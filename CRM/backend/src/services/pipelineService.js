/**
 * Pipeline Service
 * 
 * Manages pipeline stages for different entities:
 * - Leads: Prospect → Qualified → Proposal → Negotiation → Won/Lost
 * - Orders: Pending → Processing → Shipped → Delivered → Completed
 * - Projects: Planning → In Progress → On Hold → Completed
 * - Tasks: Todo → In Progress → Review → Done
 * 
 * Features:
 * - Stage transitions with validation
 * - Admin approval for certain transitions
 * - Activity logging
 * - Notifications on stage changes
 */

import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { emitToCompany } from './liveChatService.js';

// Pipeline stage definitions
export const PIPELINES = {
  lead: {
    stages: ['prospect', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
    model: 'Client',
    statusField: 'pipelineStage',
    requiresApproval: ['won', 'lost'], // Stages that need admin approval
    allowedTransitions: {
      prospect: ['contacted', 'lost'],
      contacted: ['qualified', 'lost'],
      qualified: ['proposal', 'lost'],
      proposal: ['negotiation', 'lost'],
      negotiation: ['won', 'lost', 'proposal'],
      won: [], // Final stage
      lost: ['prospect'], // Can re-open
    },
  },
  order: {
    stages: ['pending', 'approved', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
    model: 'Order',
    statusField: 'status',
    requiresApproval: ['approved', 'cancelled'],
    allowedTransitions: {
      pending: ['approved', 'cancelled'],
      approved: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['completed'],
      completed: [],
      cancelled: ['pending'], // Can re-open
    },
  },
  project: {
    stages: ['planning', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    model: 'Project',
    statusField: 'status',
    requiresApproval: ['approved'],
    allowedTransitions: {
      planning: ['approved', 'cancelled'],
      approved: ['in_progress', 'cancelled'],
      in_progress: ['on_hold', 'completed', 'cancelled'],
      on_hold: ['in_progress', 'cancelled'],
      completed: [],
      cancelled: ['planning'],
    },
  },
  task: {
    stages: ['todo', 'in_progress', 'review', 'done', 'cancelled'],
    model: 'Task',
    statusField: 'status',
    requiresApproval: [], // No approval needed for tasks
    allowedTransitions: {
      todo: ['in_progress', 'cancelled'],
      in_progress: ['review', 'todo', 'cancelled'],
      review: ['done', 'in_progress'],
      done: ['in_progress'], // Can re-open
      cancelled: ['todo'],
    },
  },
};

/**
 * Get pipeline configuration
 * @param {string} pipelineType - Type of pipeline (lead, order, project, task)
 * @returns {Object} Pipeline configuration
 */
export function getPipelineConfig(pipelineType) {
  const pipeline = PIPELINES[pipelineType];
  if (!pipeline) {
    throw new Error(`Unknown pipeline type: ${pipelineType}`);
  }
  return pipeline;
}

/**
 * Validate stage transition
 * @param {string} pipelineType - Type of pipeline
 * @param {string} currentStage - Current stage
 * @param {string} targetStage - Target stage
 * @returns {Object} Validation result
 */
export function validateTransition(pipelineType, currentStage, targetStage) {
  const pipeline = getPipelineConfig(pipelineType);
  
  // Check if target stage is valid
  if (!pipeline.stages.includes(targetStage)) {
    return {
      valid: false,
      reason: `Invalid stage: ${targetStage}. Valid stages: ${pipeline.stages.join(', ')}`,
    };
  }

  // Check if transition is allowed
  const allowedTransitions = pipeline.allowedTransitions[currentStage] || [];
  if (!allowedTransitions.includes(targetStage)) {
    return {
      valid: false,
      reason: `Cannot transition from '${currentStage}' to '${targetStage}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
    };
  }

  // Check if approval is required
  const requiresApproval = pipeline.requiresApproval.includes(targetStage);

  return {
    valid: true,
    requiresApproval,
  };
}

/**
 * Get entity model by pipeline type
 */
function getModel(pipelineType) {
  const modelMap = {
    lead: Client,
    order: Order,
    project: Project,
    task: Task,
  };
  return modelMap[pipelineType];
}

/**
 * Move entity to next pipeline stage
 * @param {Object} params
 * @param {string} params.pipelineType - Type of pipeline
 * @param {string} params.entityId - Entity ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.targetStage - Target stage
 * @param {string} params.userId - User making the change
 * @param {string} params.userRole - User's role
 * @param {string} [params.notes] - Transition notes
 * @param {boolean} [params.forceApproval] - Force approval (for admins)
 * @returns {Promise<Object>} Updated entity
 */
export async function moveToStage({
  pipelineType,
  entityId,
  companyId,
  targetStage,
  userId,
  userRole,
  notes,
  forceApproval = false,
}) {
  const pipeline = getPipelineConfig(pipelineType);
  const Model = getModel(pipelineType);
  
  // Find entity
  const entity = await Model.findOne({ _id: entityId, companyId });
  if (!entity) {
    const error = new Error(`${pipeline.model} not found`);
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const currentStage = entity[pipeline.statusField] || pipeline.stages[0];
  
  // Validate transition
  const validation = validateTransition(pipelineType, currentStage, targetStage);
  if (!validation.valid) {
    const error = new Error(validation.reason);
    error.status = 400;
    error.code = 'INVALID_TRANSITION';
    throw error;
  }

  // Check approval requirement
  if (validation.requiresApproval && !forceApproval) {
    // Only company_admin can approve
    if (userRole !== 'company_admin') {
      // Create pending approval request
      return createApprovalRequest({
        pipelineType,
        entityId,
        companyId,
        currentStage,
        targetStage,
        requestedBy: userId,
        notes,
      });
    }
  }

  // Perform transition
  const oldStage = currentStage;
  entity[pipeline.statusField] = targetStage;
  
  // For leads, also update status when reaching 'won'
  if (pipelineType === 'lead' && targetStage === 'won') {
    entity.status = 'customer';
  }

  await entity.save();

  // Log activity
  await ActivityLog.create({
    companyId,
    userId,
    action: 'pipeline_transition',
    entityType: pipelineType,
    entityId,
    meta: {
      pipelineType,
      fromStage: oldStage,
      toStage: targetStage,
      notes,
    },
  });

  // Emit real-time update
  emitToCompany(companyId, 'pipeline:update', {
    pipelineType,
    entityId,
    fromStage: oldStage,
    toStage: targetStage,
    timestamp: new Date(),
  });

  return {
    entity: entity.toObject(),
    transition: {
      from: oldStage,
      to: targetStage,
      approved: true,
    },
  };
}

/**
 * Pending approval requests (in-memory for simplicity, can be moved to DB)
 */
const pendingApprovals = new Map();

/**
 * Create approval request
 */
async function createApprovalRequest({
  pipelineType,
  entityId,
  companyId,
  currentStage,
  targetStage,
  requestedBy,
  notes,
}) {
  const approvalId = `${pipelineType}-${entityId}-${Date.now()}`;
  
  const approval = {
    id: approvalId,
    pipelineType,
    entityId,
    companyId,
    currentStage,
    targetStage,
    requestedBy,
    notes,
    status: 'pending',
    createdAt: new Date(),
  };

  pendingApprovals.set(approvalId, approval);

  // Emit notification for admins
  emitToCompany(companyId, 'approval:requested', approval);

  // Log activity
  await ActivityLog.create({
    companyId,
    userId: requestedBy,
    action: 'approval_requested',
    entityType: pipelineType,
    entityId,
    meta: {
      approvalId,
      fromStage: currentStage,
      toStage: targetStage,
    },
  });

  return {
    pending: true,
    approvalId,
    message: `Transition to '${targetStage}' requires admin approval`,
    approval,
  };
}

/**
 * Get pending approvals for a company
 * @param {string} companyId - Company ID
 * @returns {Array} Pending approvals
 */
export function getPendingApprovals(companyId) {
  const approvals = [];
  for (const [id, approval] of pendingApprovals) {
    if (approval.companyId === companyId && approval.status === 'pending') {
      approvals.push(approval);
    }
  }
  return approvals;
}

/**
 * Approve or reject a pending transition
 * @param {Object} params
 * @param {string} params.approvalId - Approval request ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.adminId - Admin user ID
 * @param {boolean} params.approved - Approve or reject
 * @param {string} [params.reason] - Reason for decision
 * @returns {Promise<Object>} Result
 */
export async function processApproval({
  approvalId,
  companyId,
  adminId,
  approved,
  reason,
}) {
  const approval = pendingApprovals.get(approvalId);
  
  if (!approval) {
    const error = new Error('Approval request not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (approval.companyId !== companyId) {
    const error = new Error('Access denied');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  if (approval.status !== 'pending') {
    const error = new Error('Approval already processed');
    error.status = 400;
    error.code = 'ALREADY_PROCESSED';
    throw error;
  }

  approval.status = approved ? 'approved' : 'rejected';
  approval.processedBy = adminId;
  approval.processedAt = new Date();
  approval.reason = reason;

  if (approved) {
    // Execute the transition
    const result = await moveToStage({
      pipelineType: approval.pipelineType,
      entityId: approval.entityId,
      companyId,
      targetStage: approval.targetStage,
      userId: adminId,
      userRole: 'company_admin',
      notes: `Approved by admin. ${reason || ''}`,
      forceApproval: true,
    });

    // Clean up
    pendingApprovals.delete(approvalId);

    return {
      approved: true,
      result,
    };
  } else {
    // Notify requester of rejection
    emitToCompany(companyId, 'approval:rejected', {
      approvalId,
      reason,
      processedAt: approval.processedAt,
    });

    // Log activity
    await ActivityLog.create({
      companyId,
      userId: adminId,
      action: 'approval_rejected',
      entityType: approval.pipelineType,
      entityId: approval.entityId,
      meta: {
        approvalId,
        reason,
      },
    });

    // Clean up
    pendingApprovals.delete(approvalId);

    return {
      approved: false,
      reason,
    };
  }
}

/**
 * Get pipeline summary for a company
 * @param {string} companyId - Company ID
 * @param {string} pipelineType - Type of pipeline
 * @returns {Promise<Object>} Pipeline summary
 */
export async function getPipelineSummary(companyId, pipelineType) {
  const pipeline = getPipelineConfig(pipelineType);
  const Model = getModel(pipelineType);

  // Build match query - include isActive filter only if the field exists in schema
  const matchQuery = { companyId: new mongoose.Types.ObjectId(companyId) };
  const schema = Model.schema.obj;
  if (schema.isActive !== undefined) {
    matchQuery.isActive = true;
  }

  const aggregation = await Model.aggregate([
    { $match: matchQuery },
    { $group: { _id: `$${pipeline.statusField}`, count: { $sum: 1 } } },
  ]);

  const summary = {};
  for (const stage of pipeline.stages) {
    const found = aggregation.find(a => a._id === stage);
    summary[stage] = found ? found.count : 0;
  }

  return {
    pipelineType,
    stages: pipeline.stages,
    counts: summary,
    total: Object.values(summary).reduce((a, b) => a + b, 0),
  };
}

/**
 * Get entities in a specific pipeline stage
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} params.pipelineType - Pipeline type
 * @param {string} params.stage - Stage to filter
 * @param {number} [params.limit=50] - Limit
 * @returns {Promise<Array>} Entities in stage
 */
export async function getEntitiesInStage({ companyId, pipelineType, stage, limit = 50 }) {
  const pipeline = getPipelineConfig(pipelineType);
  const Model = getModel(pipelineType);

  if (!pipeline.stages.includes(stage)) {
    const error = new Error(`Invalid stage: ${stage}`);
    error.status = 400;
    error.code = 'INVALID_STAGE';
    throw error;
  }

  // Build query - include isActive filter only if the field exists in schema
  const query = {
    companyId,
    [pipeline.statusField]: stage,
  };
  
  const schema = Model.schema.obj;
  if (schema.isActive !== undefined) {
    query.isActive = true;
  }

  const entities = await Model.find(query)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return entities;
}

export default {
  PIPELINES,
  getPipelineConfig,
  validateTransition,
  moveToStage,
  getPendingApprovals,
  processApproval,
  getPipelineSummary,
  getEntitiesInStage,
};
