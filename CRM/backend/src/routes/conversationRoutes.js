/**
 * Conversation Routes
 * 
 * API endpoints for client-company conversations
 */

import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import {
  getMyConversations,
  getCompanyConversations,
  getConversation,
  startConversation,
  sendMessage,
  escalateConversation,
  assignRepresentative,
  resolveConversation,
  rateConversation,
  getMyCompanies,
  getMyOrders,
  getConversationStats,
} from '../controllers/conversationController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// ============ CLIENT ROUTES (no company context needed) ============

// Get all my conversations (as a client)
router.get('/my-conversations', getMyConversations);

// Get my companies (companies I'm a client of)
router.get('/my-companies', getMyCompanies);

// Get my orders across all companies
router.get('/my-orders', getMyOrders);

// Start a new conversation with a company
router.post('/start', startConversation);

// Get a specific conversation
router.get('/:conversationId', getConversation);

// Send a message in a conversation
router.post('/:conversationId/message', sendMessage);

// Request escalation to human representative
router.post('/:conversationId/escalate', escalateConversation);

// Resolve/close a conversation
router.post('/:conversationId/resolve', resolveConversation);

// Rate a resolved conversation
router.post('/:conversationId/rate', rateConversation);

// ============ COMPANY ROUTES (require company context) ============

// Get all conversations for the company
router.get('/company/list', verifyCompanyAccess, checkRole(['company_admin', 'manager', 'employee']), getCompanyConversations);

// Assign representative to conversation
router.post('/:conversationId/assign', verifyCompanyAccess, checkRole(['company_admin', 'manager']), assignRepresentative);

// Get conversation statistics
router.get('/company/stats', verifyCompanyAccess, checkRole(['company_admin', 'manager']), getConversationStats);

export default router;
