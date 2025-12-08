/**
 * AI Routes
 * 
 * Endpoints for AI-powered features using Gemini.
 */

import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import {
  checkHealth,
  generateText,
  summarize,
  suggestTasks,
  generateEmailDraft,
  analyzeClient,
  smartSearch,
  generateProjectDescription,
  suggestResponses,
  getCompanyInsights,
  processAIRequest,
} from '../controllers/aiController.js';

const router = express.Router();

// Health check (no auth required for monitoring)
router.get('/health', checkHealth);

// All other routes require authentication
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

// Text generation
router.post('/generate', generateText);

// Summarization
router.post('/summarize', summarize);

// Task suggestions for a project
router.post('/projects/:projectId/suggest-tasks', suggestTasks);

// Email draft generation for a client
router.post('/clients/:clientId/email-draft', generateEmailDraft);

// Client analysis and insights
router.get('/clients/:clientId/analyze', analyzeClient);

// Smart search with natural language
router.post('/smart-search', smartSearch);

// Generate project description
router.post('/generate-description', generateProjectDescription);

// Suggest chat responses
router.post('/suggest-responses', suggestResponses);

// Get company dashboard insights and recommendations
router.get('/company/insights', getCompanyInsights);

// Process AI request with MCP tools (for AI assistant chat)
router.post('/process-request', processAIRequest);

export default router;
