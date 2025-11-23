import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { createIssue } from '../jiraClient.js';
import { syncStatusToJira, updateJiraIssue, cleanupJiraReferencesOnEntityDeletion } from '../utils/jiraSync.js';

/**
 * Get all projects for a company
 */
export const getProjects = async (req, res) => {
  try {
    const companyId = req.companyId;
    const user = req.user;
    const userRole = req.companyRole;

    let query = { companyId, isActive: true };

    // Employees can only see projects they're assigned to or are members of
    if (userRole === 'employee') {
      query.$or = [
        { assignedTo: user._id },
        { 'members.userId': user._id },
      ];
    }

    const projects = await Project.find(query)
      .populate('assignedTo', 'name email')
      .populate('members.userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Get task counts for each project
    const projectsWithTaskCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          {
            $match: {
              companyId: new mongoose.Types.ObjectId(companyId),
              projectId: project._id,
              isActive: true,
            },
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const counts = taskCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {});

        return {
          ...project,
          taskCounts: {
            todo: counts.todo || 0,
            in_progress: counts.in_progress || 0,
            review: counts.review || 0,
            done: counts.done || 0,
            total: Object.values(counts).reduce((sum, count) => sum + count, 0),
          },
        };
      })
    );

    res.json({
      success: true,
      data: { projects: projectsWithTaskCounts },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.companyId;

    const project = await Project.findOne({ _id: projectId, companyId, isActive: true })
      .populate('assignedTo', 'name email')
      .populate('members.userId', 'name email')
      .lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get tasks for this project
    const tasks = await Task.find({
      companyId,
      projectId,
      isActive: true,
    })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        project: {
          ...project,
          tasks,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

/**
 * Create a new project
 */
export const createProject = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { name, description, status, priority, startDate, endDate, assignedTo, members, budget, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = await Project.create({
      companyId,
      name,
      description: description || '',
      status: status || 'planning',
      priority: priority || 'medium',
      startDate: startDate || null,
      endDate: endDate || null,
      assignedTo: assignedTo || null,
      members: members || [],
      budget: budget || 0,
      notes: notes || '',
      progress: 0,
    });

    await project.populate('assignedTo', 'name email');
    await project.populate('members.userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

/**
 * Update a project
 */
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.companyId;
    const userRole = req.companyRole;
    const updateData = req.body;

    // Only company admin and manager can update projects
    if (userRole !== 'company_admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Only admins and managers can update projects.' });
    }

    const project = await Project.findOne({ _id: projectId, companyId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update fields
    if (updateData.name !== undefined) project.name = updateData.name;
    if (updateData.description !== undefined) project.description = updateData.description;
    if (updateData.status !== undefined) project.status = updateData.status;
    if (updateData.priority !== undefined) project.priority = updateData.priority;
    if (updateData.startDate !== undefined) project.startDate = updateData.startDate || null;
    if (updateData.endDate !== undefined) project.endDate = updateData.endDate || null;
    if (updateData.assignedTo !== undefined) project.assignedTo = updateData.assignedTo || null;
    if (updateData.members !== undefined) project.members = updateData.members || [];
    if (updateData.progress !== undefined) project.progress = Math.max(0, Math.min(100, updateData.progress));
    if (updateData.budget !== undefined) project.budget = updateData.budget || 0;
    if (updateData.notes !== undefined) project.notes = updateData.notes || '';

    await project.save();
    await project.populate('assignedTo', 'name email');
    await project.populate('members.userId', 'name email');

    // Sync with Jira if status changed or other important fields updated
    try {
      const statusChanged = updateData.status !== undefined && updateData.status !== project.status;
      const importantFieldsChanged = updateData.name !== undefined || updateData.description !== undefined ||
                                   updateData.priority !== undefined || updateData.progress !== undefined;

      if (statusChanged) {
        await syncStatusToJira('project', project, project.status);
      }

      if (importantFieldsChanged) {
        await updateJiraIssue('project', project);
      }
    } catch (syncError) {
      console.error('Error syncing project to Jira:', syncError);
      // Don't fail the update if sync fails, just log it
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.companyId;
    const userRole = req.companyRole;

    // Only company admin can delete projects
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can delete projects.' });
    }

    const project = await Project.findOne({ _id: projectId, companyId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Soft delete - set isActive to false
    project.isActive = false;
    await project.save();

    // Clean up Jira references for the deleted project
    try {
      await cleanupJiraReferencesOnEntityDeletion('project', projectId);
    } catch (cleanupError) {
      console.error('Error cleaning up Jira references:', cleanupError);
      // Don't fail the deletion if cleanup fails
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

/**
 * Create a Jira issue linked to a project
 */
export const createJiraIssueForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.companyId;
    const { summary, description, issuetype = 'Bug' } = req.body;

    // Find the project
    const project = await Project.findOne({ _id: projectId, companyId, isActive: true });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create Jira issue
    const jiraIssueData = {
      summary: summary || `Project Issue: ${project.name}`,
      description: description || `Project: ${project.name}\nDescription: ${project.description}\nIssue: ${description || 'Project blocker'}`,
      issuetype,
    };

    const jiraIssue = await createIssue(jiraIssueData);

    // Link Jira issue to project
    const jiraIssueLink = {
      issueKey: jiraIssue.key,
      issueUrl: `${process.env.JIRA_BASE_URL}/browse/${jiraIssue.key}`,
      createdAt: new Date(),
    };

    project.jiraIssues.push(jiraIssueLink);
    await project.save();

    res.json({
      success: true,
      message: 'Jira issue created and linked to project',
      data: {
        jiraIssue,
        project: {
          id: project._id,
          name: project.name,
          jiraIssues: project.jiraIssues,
        },
      },
    });
  } catch (error) {
    console.error('Error creating Jira issue for project:', error);
    res.status(500).json({ message: 'Error creating Jira issue', error: error.message });
  }
};

