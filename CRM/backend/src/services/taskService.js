/**
 * Task Service
 * 
 * Encapsulates all business logic for task management.
 * Controllers should use this service instead of directly accessing models.
 */

import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { createNotification, sendStatusChangeNotification } from './notificationService.js';

// Valid task statuses
const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Kanban board columns (pipeline stages for tasks)
export const TASK_PIPELINE_STAGES = ['todo', 'in_progress', 'review', 'done'];

/**
 * Get all tasks for a company
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} [params.userId] - User ID for employee filtering
 * @param {string} [params.role] - User role
 * @param {string} [params.projectId] - Filter by project
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.assignedTo] - Filter by assignee
 * @returns {Promise<Array>} List of tasks
 */
export async function getTasks({ companyId, userId, role, projectId, status, assignedTo }) {
  const query = { companyId, isActive: true };

  // Employees can only see their assigned tasks
  if (role === 'employee' && userId) {
    query.assignedTo = userId;
  }

  if (projectId) {
    query.projectId = projectId;
  }

  if (status && VALID_STATUSES.includes(status)) {
    query.status = status;
  }

  if (assignedTo) {
    query.assignedTo = assignedTo;
  }

  const tasks = await Task.find(query)
    .populate('projectId', 'name status')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return tasks;
}

/**
 * Get tasks grouped by status (Kanban view)
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} [params.projectId] - Filter by project
 * @returns {Promise<Object>} Tasks grouped by status
 */
export async function getTasksKanban({ companyId, projectId }) {
  const query = { companyId, isActive: true };

  if (projectId) {
    query.projectId = projectId;
  }

  const tasks = await Task.find(query)
    .populate('projectId', 'name')
    .populate('assignedTo', 'name email')
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  // Group by status
  const kanban = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };

  for (const task of tasks) {
    if (kanban[task.status]) {
      kanban[task.status].push(task);
    }
  }

  return kanban;
}

/**
 * Get task by ID
 * @param {Object} params
 * @param {string} params.taskId - Task ID
 * @param {string} params.companyId - Company ID
 * @returns {Promise<Object|null>} Task or null
 */
export async function getTaskById({ taskId, companyId }) {
  const task = await Task.findOne({ _id: taskId, companyId, isActive: true })
    .populate('projectId', 'name status')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .lean();

  return task;
}

/**
 * Create a new task
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} params.createdBy - User ID who created
 * @param {Object} params.data - Task data
 * @returns {Promise<Object>} Created task
 */
export async function createTask({ companyId, createdBy, data }) {
  const { title, description, status, priority, projectId, assignedTo, dueDate, estimatedHours, tags } = data;

  if (!title?.trim()) {
    const error = new Error('Task title is required');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // Validate project if provided
  if (projectId) {
    const project = await Project.findOne({ _id: projectId, companyId, isActive: true });
    if (!project) {
      const error = new Error('Project not found or does not belong to this company');
      error.status = 400;
      error.code = 'INVALID_PROJECT';
      throw error;
    }
  }

  const task = await Task.create({
    companyId,
    title: title.trim(),
    description: description || '',
    status: status && VALID_STATUSES.includes(status) ? status : 'todo',
    priority: priority && VALID_PRIORITIES.includes(priority) ? priority : 'medium',
    projectId: projectId || null,
    assignedTo: assignedTo || null,
    createdBy,
    dueDate: dueDate || null,
    estimatedHours: estimatedHours || 0,
    tags: tags || [],
  });

  await task.populate('projectId', 'name status');
  await task.populate('assignedTo', 'name email');
  await task.populate('createdBy', 'name email');

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Task creation is logged through the task's timestamps and createdBy field

  // Send notification to assigned user if task is assigned to someone else
  if (assignedTo && assignedTo !== createdBy.toString()) {
    try {
      await createNotification({
        userId: assignedTo,
        companyId,
        type: 'task',
        entityId: task._id,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${task.title}"`,
        priority: task.priority === 'urgent' || task.priority === 'high' ? 'high' : 'medium',
        relatedEntity: task._id,
        entityType: 'Task',
        metadata: {
          taskTitle: task.title,
          projectName: task.projectId?.name || 'No Project',
          dueDate: task.dueDate,
        },
      });
    } catch (notifError) {
      console.error('Error sending task assignment notification:', notifError);
    }
  }

  return task.toObject();
}

/**
 * Update a task
 * @param {Object} params
 * @param {string} params.taskId - Task ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.updatedBy - User ID who updated
 * @param {Object} params.data - Update data
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask({ taskId, companyId, updatedBy, data }) {
  const task = await Task.findOne({ _id: taskId, companyId });

  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const oldStatus = task.status;

  // Validate project if changing
  if (data.projectId && data.projectId !== task.projectId?.toString()) {
    const project = await Project.findOne({ _id: data.projectId, companyId, isActive: true });
    if (!project) {
      const error = new Error('Project not found or does not belong to this company');
      error.status = 400;
      error.code = 'INVALID_PROJECT';
      throw error;
    }
  }

  // Update allowed fields
  const allowedFields = ['title', 'description', 'status', 'priority', 'projectId', 'assignedTo', 'dueDate', 'estimatedHours', 'actualHours', 'tags', 'completedAt'];
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === 'status' && !VALID_STATUSES.includes(data[field])) {
        continue; // Skip invalid status
      }
      if (field === 'priority' && !VALID_PRIORITIES.includes(data[field])) {
        continue; // Skip invalid priority
      }
      task[field] = data[field];
    }
  }

  // Auto-set completedAt if status is done
  if (task.status === 'done' && !task.completedAt) {
    task.completedAt = new Date();
  } else if (task.status !== 'done') {
    task.completedAt = null;
  }

  await task.save();
  await task.populate('projectId', 'name status');
  await task.populate('assignedTo', 'name email');
  await task.populate('createdBy', 'name email');

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Task updates are logged through the task's timestamps and updatedAt field
  // Status changes are handled below for notifications
  if (oldStatus !== task.status) {

    // Send notification to assigned user about status change
    if (task.assignedTo && task.assignedTo._id.toString() !== updatedBy.toString()) {
      try {
        await sendStatusChangeNotification(
          companyId,
          'task',
          task._id,
          task,
          oldStatus,
          task.status,
          task.assignedTo._id
        );
      } catch (notifError) {
        console.error('Error sending task status change notification:', notifError);
      }
    }
  }

  return task.toObject();
}

/**
 * Delete (soft) a task
 * @param {Object} params
 * @param {string} params.taskId - Task ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.deletedBy - User ID who deleted
 * @returns {Promise<Object>} Deleted task
 */
export async function deleteTask({ taskId, companyId, deletedBy }) {
  const task = await Task.findOne({ _id: taskId, companyId });

  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  task.isActive = false;
  await task.save();

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Task deletion is logged through the task's isActive flag and timestamps
  
  return task.toObject();
}

/**
 * Move task to pipeline stage (Kanban drag-drop)
 * @param {Object} params
 * @param {string} params.taskId - Task ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.updatedBy - User ID who updated
 * @param {string} params.targetStage - Target pipeline stage
 * @returns {Promise<Object>} Updated task
 */
export async function moveTaskToPipelineStage({ taskId, companyId, updatedBy, targetStage }) {
  if (!TASK_PIPELINE_STAGES.includes(targetStage)) {
    const error = new Error(`Invalid pipeline stage. Valid stages: ${TASK_PIPELINE_STAGES.join(', ')}`);
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return updateTask({
    taskId,
    companyId,
    updatedBy,
    data: { status: targetStage },
  });
}

/**
 * Assign task to user
 * @param {Object} params
 * @param {string} params.taskId - Task ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.assignedTo - User ID to assign
 * @param {string} params.assignedBy - User ID who assigned
 * @returns {Promise<Object>} Updated task
 */
export async function assignTask({ taskId, companyId, assignedTo, assignedBy }) {
  const task = await updateTask({
    taskId,
    companyId,
    updatedBy: assignedBy,
    data: { assignedTo },
  });

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Task assignment is tracked through the task's assignedTo field and timestamps

  // Send notification to newly assigned user
  if (assignedTo && assignedTo !== assignedBy.toString()) {
    try {
      await createNotification({
        userId: assignedTo,
        companyId,
        type: 'task',
        entityId: taskId,
        title: 'Task Assigned to You',
        message: `You have been assigned the task: "${task.title}"`,
        priority: task.priority === 'urgent' || task.priority === 'high' ? 'high' : 'medium',
        relatedEntity: taskId,
        entityType: 'Task',
        metadata: {
          taskTitle: task.title,
          projectName: task.projectId?.name || 'No Project',
          dueDate: task.dueDate,
        },
      });
    } catch (notifError) {
      console.error('Error sending task assignment notification:', notifError);
    }
  }

  return task;
}

/**
 * Get task statistics for a company
 * @param {string} companyId - Company ID
 * @param {string} [projectId] - Filter by project
 * @returns {Promise<Object>} Statistics
 */
export async function getTaskStats(companyId, projectId) {
  const matchQuery = {
    companyId: new mongoose.Types.ObjectId(companyId),
    isActive: true,
  };

  if (projectId) {
    matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
  }

  const [totalTasks, tasksByStatus, overdueTasks] = await Promise.all([
    Task.countDocuments({ ...matchQuery }),
    Task.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({
      ...matchQuery,
      dueDate: { $lt: new Date() },
      status: { $nin: ['done', 'cancelled'] },
    }),
  ]);

  const statusCounts = tasksByStatus.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalTasks,
    todo: statusCounts.todo || 0,
    in_progress: statusCounts.in_progress || 0,
    review: statusCounts.review || 0,
    done: statusCounts.done || 0,
    cancelled: statusCounts.cancelled || 0,
    overdue: overdueTasks,
    completionRate: totalTasks > 0 ? Math.round(((statusCounts.done || 0) / totalTasks) * 100) : 0,
  };
}

/**
 * Get tasks due soon
 * @param {string} companyId - Company ID
 * @param {number} [daysAhead=7] - Days ahead to check
 * @returns {Promise<Array>} Tasks due soon
 */
export async function getTasksDueSoon(companyId, daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const tasks = await Task.find({
    companyId,
    isActive: true,
    dueDate: { $lte: futureDate, $gte: new Date() },
    status: { $nin: ['done', 'cancelled'] },
  })
    .populate('projectId', 'name')
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1 })
    .lean();

  return tasks;
}

export default {
  getTasks,
  getTasksKanban,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  moveTaskToPipelineStage,
  assignTask,
  getTaskStats,
  getTasksDueSoon,
  TASK_PIPELINE_STAGES,
};
