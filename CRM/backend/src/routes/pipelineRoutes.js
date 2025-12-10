/**
 * Pipeline Routes
 * 
 * Routes for pipeline management.
 */

import express from 'express';
import * as pipelineController from '../controllers/pipelineController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';

const router = express.Router();

// Apply authentication and company access middleware to all routes
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

// ===== Pipeline Configuration =====

// Get all pipeline configurations
router.get('/config', pipelineController.getAllPipelineConfigs);

// Get specific pipeline configuration
router.get('/config/:type', pipelineController.getPipelineConfig);

// ===== Dashboard =====

// Get dashboard summary (all pipelines)
router.get('/dashboard', pipelineController.getDashboardSummary);

// ===== Pipeline Operations =====

// Get summary for a pipeline type
router.get('/:type/summary', pipelineController.getPipelineSummary);

// Get entities in a specific stage
router.get('/:type/stage/:stage', pipelineController.getEntitiesInStage);

// Validate a transition (preview)
router.post('/:type/validate', pipelineController.validateTransition);

// Move entity to a stage
router.post('/:type/:entityId/move', pipelineController.moveToStage);

// ===== Approvals =====

// Get pending approvals
router.get('/approvals/pending', pipelineController.getPendingApprovals);

// Process an approval
router.post('/approvals/:approvalId', pipelineController.processApproval);

export default router;
