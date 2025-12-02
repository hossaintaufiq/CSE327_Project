/**
 * MCP Routes
 * 
 * Model Context Protocol endpoints for AI tool integration.
 */

import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import * as mcpServer from '../services/mcpServer.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

const router = express.Router();

/**
 * List available MCP tools
 * GET /api/mcp/tools
 */
router.get('/tools', (req, res) => {
  const tools = mcpServer.listTools();
  return successResponse(res, tools);
});

// Authenticated routes
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

/**
 * Execute an MCP tool
 * POST /api/mcp/execute
 */
router.post('/execute', async (req, res, next) => {
  try {
    const { tool, params } = req.body;

    if (!tool) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Tool name is required', 400);
    }

    const result = await mcpServer.executeTool(tool, params || {}, req.companyId);

    if (!result.success) {
      return errorResponse(res, result.error.code, result.error.message, 400);
    }

    return successResponse(res, result.data, 200, result.message);
  } catch (error) {
    next(error);
  }
});

/**
 * Get context for AI operations
 * GET /api/mcp/context/:type
 */
router.get('/context/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const validTypes = ['overview', 'recent'];

    if (!validTypes.includes(type)) {
      return errorResponse(res, 'VALIDATION_ERROR', `Context type must be one of: ${validTypes.join(', ')}`, 400);
    }

    const context = await mcpServer.getContext(req.companyId, type);
    return successResponse(res, { context, type });
  } catch (error) {
    next(error);
  }
});

/**
 * Batch execute multiple tools
 * POST /api/mcp/batch
 */
router.post('/batch', async (req, res, next) => {
  try {
    const { operations } = req.body;

    if (!operations || !Array.isArray(operations)) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Operations array is required', 400);
    }

    if (operations.length > 10) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Maximum 10 operations per batch', 400);
    }

    const results = await Promise.all(
      operations.map(op => mcpServer.executeTool(op.tool, op.params || {}, req.companyId))
    );

    return successResponse(res, { results, count: results.length });
  } catch (error) {
    next(error);
  }
});

export default router;
