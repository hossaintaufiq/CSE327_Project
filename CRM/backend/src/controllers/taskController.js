import * as taskService from '../services/taskService.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/responseHelper.js';

/**
 * Get all tasks for a company
 * Controller is now thin - delegates to taskService
 */
export const getTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getTasks({
      companyId: req.companyId,
      userId: req.user._id,
      role: req.companyRole,
      projectId: req.query.projectId,
      status: req.query.status,
      assignedTo: req.query.assignedTo,
    });
    return successResponse(res, { tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks in Kanban view
 */
export const getTasksKanban = async (req, res, next) => {
  try {
    const kanban = await taskService.getTasksKanban({
      companyId: req.companyId,
      projectId: req.query.projectId,
    });
    return successResponse(res, { kanban });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task by ID
 */
export const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById({
      taskId: req.params.taskId,
      companyId: req.companyId,
    });

    if (!task) {
      return notFoundResponse(res, 'Task not found');
    }

    // Employees can only see tasks assigned to them
    if (req.companyRole === 'employee' && task.assignedTo?._id?.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'ACCESS_DENIED', 'Access denied', 403);
    }

    return successResponse(res, { task });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 */
export const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask({
      companyId: req.companyId,
      createdBy: req.user._id,
      data: req.body,
    });

    return successResponse(res, { task }, 201, 'Task created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update a task
 */
export const updateTask = async (req, res, next) => {
  try {
    // Employees can only update tasks assigned to them (check done in service)
    const task = await taskService.updateTask({
      taskId: req.params.taskId,
      companyId: req.companyId,
      updatedBy: req.user._id,
      data: req.body,
    });

    return successResponse(res, { task }, 200, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req, res, next) => {
  try {
    // Only company admin and manager can delete tasks
    if (req.companyRole !== 'company_admin' && req.companyRole !== 'manager') {
      return errorResponse(res, 'ACCESS_DENIED', 'Access denied. Only admins and managers can delete tasks.', 403);
    }

    await taskService.deleteTask({
      taskId: req.params.taskId,
      companyId: req.companyId,
      deletedBy: req.user._id,
    });

    return successResponse(res, null, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Move task to pipeline stage (Kanban drag-drop)
 */
export const moveTaskToStage = async (req, res, next) => {
  try {
    const { targetStage } = req.body;

    const task = await taskService.moveTaskToPipelineStage({
      taskId: req.params.taskId,
      companyId: req.companyId,
      updatedBy: req.user._id,
      targetStage,
    });

    return successResponse(res, { task }, 200, 'Task moved to new stage');
  } catch (error) {
    next(error);
  }
};

/**
 * Assign task to user
 */
export const assignTask = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;

    const task = await taskService.assignTask({
      taskId: req.params.taskId,
      companyId: req.companyId,
      assignedTo,
      assignedBy: req.user._id,
    });

    return successResponse(res, { task }, 200, 'Task assigned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get task statistics
 */
export const getTaskStats = async (req, res, next) => {
  try {
    const stats = await taskService.getTaskStats(req.companyId, req.query.projectId);
    return successResponse(res, { stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks due soon
 */
export const getTasksDueSoon = async (req, res, next) => {
  try {
    const daysAhead = parseInt(req.query.days, 10) || 7;
    const tasks = await taskService.getTasksDueSoon(req.companyId, daysAhead);
    return successResponse(res, { tasks });
  } catch (error) {
    next(error);
  }
};