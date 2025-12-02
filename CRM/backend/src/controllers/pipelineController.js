/**
 * Pipeline Controller
 * 
 * Handles pipeline management endpoints.
 */

import * as pipelineService from '../services/pipelineService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * Get pipeline configuration
 */
export const getPipelineConfig = async (req, res, next) => {
  try {
    const { type } = req.params;
    
    const validTypes = ['lead', 'order', 'project', 'task'];
    if (!validTypes.includes(type)) {
      return errorResponse(res, 'VALIDATION_ERROR', `Invalid pipeline type. Valid: ${validTypes.join(', ')}`, 400);
    }

    const config = pipelineService.getPipelineConfig(type);
    return successResponse(res, { 
      pipelineType: type,
      stages: config.stages,
      requiresApproval: config.requiresApproval,
      allowedTransitions: config.allowedTransitions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pipeline configurations
 */
export const getAllPipelineConfigs = async (req, res, next) => {
  try {
    const configs = {};
    for (const type of ['lead', 'order', 'project', 'task']) {
      const config = pipelineService.getPipelineConfig(type);
      configs[type] = {
        stages: config.stages,
        requiresApproval: config.requiresApproval,
      };
    }
    return successResponse(res, { pipelines: configs });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pipeline summary (counts per stage)
 */
export const getPipelineSummary = async (req, res, next) => {
  try {
    const { type } = req.params;
    
    const summary = await pipelineService.getPipelineSummary(req.companyId, type);
    return successResponse(res, { summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get entities in a specific stage
 */
export const getEntitiesInStage = async (req, res, next) => {
  try {
    const { type, stage } = req.params;
    const { limit } = req.query;

    const entities = await pipelineService.getEntitiesInStage({
      companyId: req.companyId,
      pipelineType: type,
      stage,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return successResponse(res, { 
      stage, 
      entities, 
      count: entities.length 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Move entity to a pipeline stage
 */
export const moveToStage = async (req, res, next) => {
  try {
    const { type, entityId } = req.params;
    const { targetStage, notes } = req.body;

    if (!targetStage) {
      return errorResponse(res, 'VALIDATION_ERROR', 'targetStage is required', 400);
    }

    const result = await pipelineService.moveToStage({
      pipelineType: type,
      entityId,
      companyId: req.companyId,
      targetStage,
      userId: req.user._id,
      userRole: req.companyRole,
      notes,
    });

    if (result.pending) {
      return successResponse(res, result, 202, 'Approval required');
    }

    return successResponse(res, result, 200, 'Stage transition successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Validate a transition (preview)
 */
export const validateTransition = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { currentStage, targetStage } = req.body;

    if (!currentStage || !targetStage) {
      return errorResponse(res, 'VALIDATION_ERROR', 'currentStage and targetStage are required', 400);
    }

    const validation = pipelineService.validateTransition(type, currentStage, targetStage);
    return successResponse(res, { validation });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending approvals
 */
export const getPendingApprovals = async (req, res, next) => {
  try {
    // Only admins can see pending approvals
    if (req.companyRole !== 'company_admin') {
      return errorResponse(res, 'FORBIDDEN', 'Only admins can view pending approvals', 403);
    }

    const approvals = pipelineService.getPendingApprovals(req.companyId);
    return successResponse(res, { approvals, count: approvals.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Process an approval request
 */
export const processApproval = async (req, res, next) => {
  try {
    const { approvalId } = req.params;
    const { approved, reason } = req.body;

    // Only admins can process approvals
    if (req.companyRole !== 'company_admin') {
      return errorResponse(res, 'FORBIDDEN', 'Only admins can process approvals', 403);
    }

    if (typeof approved !== 'boolean') {
      return errorResponse(res, 'VALIDATION_ERROR', 'approved (boolean) is required', 400);
    }

    const result = await pipelineService.processApproval({
      approvalId,
      companyId: req.companyId,
      adminId: req.user._id,
      approved,
      reason,
    });

    const message = result.approved ? 'Approval granted' : 'Approval rejected';
    return successResponse(res, result, 200, message);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pipeline summaries (dashboard)
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const summaries = {};
    
    for (const type of ['lead', 'order', 'project', 'task']) {
      summaries[type] = await pipelineService.getPipelineSummary(req.companyId, type);
    }

    const pendingApprovals = req.companyRole === 'company_admin' 
      ? pipelineService.getPendingApprovals(req.companyId)
      : [];

    return successResponse(res, { 
      summaries, 
      pendingApprovals: pendingApprovals.length,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getPipelineConfig,
  getAllPipelineConfigs,
  getPipelineSummary,
  getEntitiesInStage,
  moveToStage,
  validateTransition,
  getPendingApprovals,
  processApproval,
  getDashboardSummary,
};
