/**
 * Project Service
 * 
 * Encapsulates all business logic for project management.
 * Controllers should use this service instead of directly accessing models.
 */

import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';

// Valid project statuses
const VALID_STATUSES = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Pipeline stages for projects
export const PROJECT_PIPELINE_STAGES = ['planning', 'in_progress', 'on_hold', 'completed'];

/**
 * Get all projects for a company with task counts
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} [params.userId] - User ID for employee filtering
 * @param {string} [params.role] - User role
 * @param {string} [params.status] - Filter by status
 * @returns {Promise<Array>} List of projects with task counts
 */
export async function getProjects({ companyId, userId, role, status }) {
  const query = { companyId, isActive: true };

  // Employees can only see projects they're assigned to or are members of
  if (role === 'employee' && userId) {
    query.$or = [
      { assignedTo: userId },
      { 'members.userId': userId },
    ];
  }

  if (status && VALID_STATUSES.includes(status)) {
    query.status = status;
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

  return projectsWithTaskCounts;
}

/**
 * Get project by ID with tasks
 * @param {Object} params
 * @param {string} params.projectId - Project ID
 * @param {string} params.companyId - Company ID
 * @param {boolean} [params.includeTasks=true] - Include project tasks
 * @returns {Promise<Object|null>} Project with tasks or null
 */
export async function getProjectById({ projectId, companyId, includeTasks = true }) {
  const project = await Project.findOne({ _id: projectId, companyId, isActive: true })
    .populate('assignedTo', 'name email')
    .populate('members.userId', 'name email')
    .lean();

  if (!project) return null;

  if (includeTasks) {
    const tasks = await Task.find({
      companyId,
      projectId,
      isActive: true,
    })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return { ...project, tasks };
  }

  return project;
}

/**
 * Create a new project
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} params.createdBy - User ID who created
 * @param {Object} params.data - Project data
 * @returns {Promise<Object>} Created project
 */
export async function createProject({ companyId, createdBy, data }) {
  const { name, description, status, priority, startDate, endDate, assignedTo, members, budget, notes } = data;

  if (!name?.trim()) {
    const error = new Error('Project name is required');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const project = await Project.create({
    companyId,
    name: name.trim(),
    description: description || '',
    status: status && VALID_STATUSES.includes(status) ? status : 'planning',
    priority: priority && VALID_PRIORITIES.includes(priority) ? priority : 'medium',
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

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Project creation is logged through the project's timestamps and createdBy field

  return project.toObject();
}

/**
 * Update a project
 * @param {Object} params
 * @param {string} params.projectId - Project ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.updatedBy - User ID who updated
 * @param {Object} params.data - Update data
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject({ projectId, companyId, updatedBy, data }) {
  const project = await Project.findOne({ _id: projectId, companyId });

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const oldStatus = project.status;

  // Update allowed fields
  const allowedFields = ['name', 'description', 'status', 'priority', 'startDate', 'endDate', 'assignedTo', 'members', 'budget', 'notes', 'progress'];
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === 'status' && !VALID_STATUSES.includes(data[field])) {
        continue; // Skip invalid status
      }
      if (field === 'priority' && !VALID_PRIORITIES.includes(data[field])) {
        continue; // Skip invalid priority
      }
      project[field] = data[field];
    }
  }

  await project.save();
  await project.populate('assignedTo', 'name email');
  await project.populate('members.userId', 'name email');

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Project updates are logged through the project's timestamps and updatedAt field

  return project.toObject();
}

/**
 * Delete (soft) a project
 * @param {Object} params
 * @param {string} params.projectId - Project ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.deletedBy - User ID who deleted
 * @returns {Promise<Object>} Deleted project
 */
export async function deleteProject({ projectId, companyId, deletedBy }) {
  const project = await Project.findOne({ _id: projectId, companyId });

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  project.isActive = false;
  await project.save();

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Project deletion is logged through the project's isActive flag and timestamps

  return project.toObject();
}

/**
 * Move project to pipeline stage
 * @param {Object} params
 * @param {string} params.projectId - Project ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.updatedBy - User ID who updated
 * @param {string} params.targetStage - Target pipeline stage
 * @returns {Promise<Object>} Updated project
 */
export async function moveProjectToPipelineStage({ projectId, companyId, updatedBy, targetStage }) {
  if (!PROJECT_PIPELINE_STAGES.includes(targetStage)) {
    const error = new Error(`Invalid pipeline stage. Valid stages: ${PROJECT_PIPELINE_STAGES.join(', ')}`);
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return updateProject({
    projectId,
    companyId,
    updatedBy,
    data: { status: targetStage },
  });
}

/**
 * Add member to project
 * @param {Object} params
 * @param {string} params.projectId - Project ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.userId - User ID to add
 * @param {string} [params.role='member'] - Member role
 * @returns {Promise<Object>} Updated project
 */
export async function addProjectMember({ projectId, companyId, userId, role = 'member' }) {
  const project = await Project.findOne({ _id: projectId, companyId, isActive: true });

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Check if user is already a member
  const existingMember = project.members.find(m => m.userId.toString() === userId);
  if (existingMember) {
    const error = new Error('User is already a member of this project');
    error.status = 400;
    error.code = 'ALREADY_MEMBER';
    throw error;
  }

  project.members.push({ userId, role });
  await project.save();
  await project.populate('members.userId', 'name email');

  return project.toObject();
}

/**
 * Remove member from project
 * @param {Object} params
 * @param {string} params.projectId - Project ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.userId - User ID to remove
 * @returns {Promise<Object>} Updated project
 */
export async function removeProjectMember({ projectId, companyId, userId }) {
  const project = await Project.findOne({ _id: projectId, companyId, isActive: true });

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  project.members = project.members.filter(m => m.userId.toString() !== userId);
  await project.save();

  return project.toObject();
}

/**
 * Get project statistics for a company
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Statistics
 */
export async function getProjectStats(companyId) {
  const [totalProjects, projectsByStatus] = await Promise.all([
    Project.countDocuments({ companyId, isActive: true }),
    Project.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const statusCounts = projectsByStatus.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalProjects,
    planning: statusCounts.planning || 0,
    in_progress: statusCounts.in_progress || 0,
    on_hold: statusCounts.on_hold || 0,
    completed: statusCounts.completed || 0,
    cancelled: statusCounts.cancelled || 0,
  };
}

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  moveProjectToPipelineStage,
  addProjectMember,
  removeProjectMember,
  getProjectStats,
  PROJECT_PIPELINE_STAGES,
};
