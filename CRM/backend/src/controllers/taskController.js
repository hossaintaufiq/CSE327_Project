import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { createIssue } from '../jiraClient.js';

/**
 * Get all tasks for a company
 */
export const getTasks = async (req, res) => {
  try {
    const companyId = req.companyId;
    const user = req.user;
    const userRole = req.companyRole;
    const { projectId, status, assignedTo } = req.query;

    let query = { companyId, isActive: true };

    // Filter by project if provided
    if (projectId) {
      query.projectId = projectId;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by assignedTo if provided
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Employees can only see tasks assigned to them
    if (userRole === 'employee') {
      query.assignedTo = user._id;
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

/**
 * Get task by ID
 */
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.companyId;
    const user = req.user;
    const userRole = req.companyRole;

    const task = await Task.findOne({ _id: taskId, companyId, isActive: true })
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email')
      .lean();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Employees can only see tasks assigned to them
    if (userRole === 'employee' && task.assignedTo?._id?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

/**
 * Create a new task
 */
export const createTask = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { projectId, title, description, status, priority, assignedTo, dueDate, tags, estimatedHours, notes } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // Validate projectId if provided
    if (projectId) {
      const project = await Project.findOne({ _id: projectId, companyId, isActive: true });
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
    }

    const task = await Task.create({
      companyId,
      projectId: projectId || null,
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      tags: tags || [],
      estimatedHours: estimatedHours || 0,
      actualHours: 0,
      notes: notes || '',
    });

    await task.populate('projectId', 'name');
    await task.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

/**
 * Update a task
 */
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.companyId;
    const user = req.user;
    const userRole = req.companyRole;
    const updateData = req.body;

    const task = await Task.findOne({ _id: taskId, companyId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Employees can only update tasks assigned to them
    if (userRole === 'employee' && task.assignedTo?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update tasks assigned to you.' });
    }

    // Update fields
    if (updateData.title !== undefined) task.title = updateData.title;
    if (updateData.description !== undefined) task.description = updateData.description;
    if (updateData.status !== undefined) task.status = updateData.status;
    if (updateData.priority !== undefined) task.priority = updateData.priority;
    if (updateData.assignedTo !== undefined) task.assignedTo = updateData.assignedTo || null;
    if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate || null;
    if (updateData.tags !== undefined) task.tags = updateData.tags || [];
    if (updateData.estimatedHours !== undefined) task.estimatedHours = updateData.estimatedHours || 0;
    if (updateData.actualHours !== undefined) task.actualHours = updateData.actualHours || 0;
    if (updateData.notes !== undefined) task.notes = updateData.notes || '';

    // Update projectId if provided
    if (updateData.projectId !== undefined) {
      if (updateData.projectId) {
        const project = await Project.findOne({ _id: updateData.projectId, companyId, isActive: true });
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }
        task.projectId = updateData.projectId;
      } else {
        task.projectId = null;
      }
    }

    await task.save();
    await task.populate('projectId', 'name');
    await task.populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.companyId;
    const userRole = req.companyRole;

    // Only company admin and manager can delete tasks
    if (userRole !== 'company_admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Only admins and managers can delete tasks.' });
    }

    const task = await Task.findOne({ _id: taskId, companyId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Soft delete - set isActive to false
    task.isActive = false;
    await task.save();

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

/**
 * Create a Jira issue linked to a task
 */
export const createJiraIssueForTask = async (req, res) => {
  try {
    console.log('Creating Jira issue for task:', req.params, req.body);
    const { taskId } = req.params;
    const companyId = req.companyId;
    const { summary, description, issuetype = 'Task' } = req.body;

    // Find the task
    const task = await Task.findOne({ _id: taskId, companyId, isActive: true });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Create Jira issue
    const jiraIssueData = {
      summary: summary || `Task: ${task.title}`,
      description: description || task.description || `Task details: ${task.title}`,
      issuetype,
    };

    const jiraIssue = await createIssue(jiraIssueData);

    // Link Jira issue to task
    const jiraIssueLink = {
      issueKey: jiraIssue.key,
      issueUrl: `${process.env.JIRA_BASE_URL}/browse/${jiraIssue.key}`,
      createdAt: new Date(),
    };

    task.jiraIssues.push(jiraIssueLink);
    await task.save();

    res.json({
      success: true,
      message: 'Jira issue created and linked to task',
      data: {
        jiraIssue,
        task: {
          id: task._id,
          title: task.title,
          jiraIssues: task.jiraIssues,
        },
      },
    });
  } catch (error) {
    console.error('Error creating Jira issue for task:', error);
    res.status(500).json({ message: 'Error creating Jira issue', error: error.message });
  }
};

