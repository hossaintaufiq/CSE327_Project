/**
 * Pipeline Routes
 * 
 * Routes for pipeline management.
 */

import express from 'express';
import * as pipelineController from '../controllers/pipelineController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// ===== Pipeline Configuration =====

// Get all pipeline configurations
router.get('/config', verifyFirebaseToken, pipelineController.getAllPipelineConfigs);

// Get specific pipeline configuration
router.get('/config/:type', verifyFirebaseToken, pipelineController.getPipelineConfig);

// ===== Dashboard =====

// Get dashboard summary (all pipelines)
router.get('/dashboard', verifyFirebaseToken, pipelineController.getDashboardSummary);

// ===== Pipeline Operations =====

// Get summary for a pipeline type
router.get('/:type/summary', verifyFirebaseToken, pipelineController.getPipelineSummary);

// Get entities in a specific stage
router.get('/:type/stage/:stage', verifyFirebaseToken, pipelineController.getEntitiesInStage);

// Validate a transition (preview)
router.post('/:type/validate', verifyFirebaseToken, pipelineController.validateTransition);

// Move entity to a stage
router.post('/:type/:entityId/move', verifyFirebaseToken, pipelineController.moveToStage);

// ===== Approvals =====

// Get pending approvals
router.get('/approvals/pending', verifyFirebaseToken, pipelineController.getPendingApprovals);

// Process an approval
router.post('/approvals/:approvalId', verifyFirebaseToken, pipelineController.processApproval);

export default router;
