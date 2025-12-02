import * as projectService from '../services/projectService.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/responseHelper.js';

/**
 * Get all projects for a company
 * Controller is now thin - delegates to projectService
 */
export const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects({
      companyId: req.companyId,
      userId: req.user._id,
      role: req.companyRole,
      status: req.query.status,
    });
    return successResponse(res, { projects });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById({
      projectId: req.params.projectId,
      companyId: req.companyId,
      includeTasks: true,
    });

    if (!project) {
      return notFoundResponse(res, 'Project not found');
    }

    return successResponse(res, { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new project
 */
export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject({
      companyId: req.companyId,
      createdBy: req.user._id,
      data: req.body,
    });

    return successResponse(res, { project }, 201, 'Project created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update a project
 */
export const updateProject = async (req, res, next) => {
  try {
    // Only company admin and manager can update projects
    if (req.companyRole !== 'company_admin' && req.companyRole !== 'manager') {
      return errorResponse(res, 'ACCESS_DENIED', 'Access denied. Only admins and managers can update projects.', 403);
    }

    const project = await projectService.updateProject({
      projectId: req.params.projectId,
      companyId: req.companyId,
      updatedBy: req.user._id,
      data: req.body,
    });

    return successResponse(res, { project }, 200, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (req, res, next) => {
  try {
    // Only company admin can delete projects
    if (req.companyRole !== 'company_admin') {
      return errorResponse(res, 'ACCESS_DENIED', 'Access denied. Only company admin can delete projects.', 403);
    }

    await projectService.deleteProject({
      projectId: req.params.projectId,
      companyId: req.companyId,
      deletedBy: req.user._id,
    });

    return successResponse(res, null, 200, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Move project to pipeline stage
 */
export const moveProjectToStage = async (req, res, next) => {
  try {
    const { targetStage } = req.body;

    const project = await projectService.moveProjectToPipelineStage({
      projectId: req.params.projectId,
      companyId: req.companyId,
      updatedBy: req.user._id,
      targetStage,
    });

    return successResponse(res, { project }, 200, 'Project moved to new stage');
  } catch (error) {
    next(error);
  }
};

/**
 * Add member to project
 */
export const addProjectMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    const project = await projectService.addProjectMember({
      projectId: req.params.projectId,
      companyId: req.companyId,
      userId,
      role,
    });

    return successResponse(res, { project }, 200, 'Member added to project');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove member from project
 */
export const removeProjectMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const project = await projectService.removeProjectMember({
      projectId: req.params.projectId,
      companyId: req.companyId,
      userId,
    });

    return successResponse(res, { project }, 200, 'Member removed from project');
  } catch (error) {
    next(error);
  }
};

/**
 * Get project statistics
 */
export const getProjectStats = async (req, res, next) => {
  try {
    const stats = await projectService.getProjectStats(req.companyId);
    return successResponse(res, { stats });
  } catch (error) {
    next(error);
  }
};