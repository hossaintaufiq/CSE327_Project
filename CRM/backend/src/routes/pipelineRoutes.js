/**
 * Pipeline Routes
 * 
 * Routes for pipeline management.
 */

import express from 'express';
import * as pipelineController from '../controllers/pipelineController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ===== Pipeline Configuration =====

// Get all pipeline configurations
router.get('/config', auth, pipelineController.getAllPipelineConfigs);

// Get specific pipeline configuration
router.get('/config/:type', auth, pipelineController.getPipelineConfig);

// ===== Dashboard =====

// Get dashboard summary (all pipelines)
router.get('/dashboard', auth, pipelineController.getDashboardSummary);

// ===== Pipeline Operations =====

// Get summary for a pipeline type
router.get('/:type/summary', auth, pipelineController.getPipelineSummary);

// Get entities in a specific stage
router.get('/:type/stage/:stage', auth, pipelineController.getEntitiesInStage);

// Validate a transition (preview)
router.post('/:type/validate', auth, pipelineController.validateTransition);

// Move entity to a stage
router.post('/:type/:entityId/move', auth, pipelineController.moveToStage);

// ===== Approvals =====

// Get pending approvals
router.get('/approvals/pending', auth, pipelineController.getPendingApprovals);

// Process an approval
router.post('/approvals/:approvalId', auth, pipelineController.processApproval);

export default router;
