/**
 * Conversation Controller
 * 
 * Handles API endpoints for client-company conversations
 */

import * as conversationService from '../services/conversationService.js';
import * as geminiService from '../services/geminiService.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/responseHelper.js';

/**
 * Get conversations for client user (their own conversations)
 */
export const getMyConversations = async (req, res, next) => {
  try {
    const { status, companyId, type, limit, offset } = req.query;
    
    console.log(`[getMyConversations] User: ${req.user._id}, Query:`, req.query);

    const { conversations, total } = await conversationService.getClientConversations(
      req.user._id,
      { status, companyId, type, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 }
    );
    
    console.log(`[getMyConversations] Found ${total} conversations`);

    return successResponse(res, { conversations, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversations for company (admin/manager/employee view)
 */
export const getCompanyConversations = async (req, res, next) => {
  try {
    const { status, assignedTo, type, limit, offset } = req.query;
    
    console.log('[getCompanyConversations] Request details:', {
      companyId: req.companyId,
      userId: req.user._id,
      userEmail: req.user.email,
      companyRole: req.companyRole,
      queryParams: { status, assignedTo, type, limit, offset }
    });
    
    const { conversations, total } = await conversationService.getCompanyConversations(
      req.companyId,
      { 
        status, 
        assignedTo, 
        type, 
        userId: req.user._id,
        role: req.companyRole,
        limit: parseInt(limit) || 50, 
        offset: parseInt(offset) || 0 
      }
    );
    
    console.log(`[getCompanyConversations] Returning ${conversations.length} of ${total} total conversations`);
    
    return successResponse(res, { conversations, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single conversation
 */
export const getConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    const { conversation, isClient, isCompanyMember } = await conversationService.getConversationById(
      conversationId,
      req.user._id
    );
    
    return successResponse(res, { conversation, isClient, isCompanyMember });
  } catch (error) {
    next(error);
  }
};

/**
 * Start a new conversation (client initiating)
 */
export const startConversation = async (req, res, next) => {
  try {
    const { companyId, type, productId, productName, initialMessage } = req.body;
    
    if (!companyId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Company ID is required', 400);
    }
    
    let conversation = await conversationService.startConversation({
      clientUserId: req.user._id,
      companyId,
      type,
      productId,
      productName,
      initialMessage,
    });
    
    // Generate AI welcome/response if there's an initial message
    if (initialMessage && conversation.aiHandled) {
      try {
        const companyName = conversation.companyId?.name || 'our company';
        const typeLabel = {
          inquiry: 'product inquiry',
          order: 'order-related question',
          complaint: 'complaint',
          support: 'support request',
          general: 'question',
        }[type] || 'question';
        
        const aiPrompt = `You are a helpful customer service AI assistant for ${companyName}. 
A client just started a new conversation with a ${typeLabel}.

Their message: ${initialMessage}

Respond helpfully and professionally. Acknowledge their ${typeLabel} and provide initial assistance.
Keep your response concise (2-3 sentences) and offer to help further.`;

        const aiResponse = await geminiService.generateText(aiPrompt);
        
        // Add AI response to conversation
        conversation = await conversationService.addAIResponse(conversation._id, aiResponse);
      } catch (aiError) {
        console.error('AI welcome response error:', aiError);
        // Don't fail if AI fails
      }
    }
    
    return successResponse(res, { conversation }, 201, 'Conversation started');
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType, metadata } = req.body;
    
    if (!content?.trim()) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Message content is required', 400);
    }
    
    // Determine sender type based on user's role in the conversation
    const { conversation: existingConv, isClient } = await conversationService.getConversationById(
      conversationId,
      req.user._id
    );
    
    const senderType = isClient ? 'client' : 'representative';
    
    // Save the user's message
    let { conversation, message } = await conversationService.sendMessage({
      conversationId,
      senderId: req.user._id,
      senderType,
      content: content.trim(),
      messageType: messageType || 'text',
      metadata: metadata || {},
    });
    
    // If client message and conversation is AI-handled, generate AI response
    if (isClient && existingConv.aiHandled && existingConv.status === 'active') {
      try {
        console.log('Generating AI response for conversation:', conversationId);
        
        // Build conversation context
        const recentMessages = existingConv.messages.slice(-5).map(m => 
          `${m.senderType}: ${m.content}`
        ).join('\n');
        
        const aiPrompt = `You are a helpful customer service AI assistant for ${existingConv.companyId?.name || 'our company'}. 
You're helping a client with a ${existingConv.type || 'general'} inquiry.

Recent conversation:
${recentMessages}
client: ${content.trim()}

Respond helpfully and professionally. If you cannot fully help with their request, suggest they can request a human representative.
Keep your response concise (2-3 sentences max unless detailed explanation needed).`;

        console.log('AI prompt:', aiPrompt.substring(0, 200) + '...');
        
        const aiResponse = await geminiService.generateText(aiPrompt);
        
        console.log('AI response generated:', aiResponse.substring(0, 100) + '...');
        
        // Save AI response
        const { conversation: updatedConv } = await conversationService.sendMessage({
          conversationId,
          senderId: null,
          senderType: 'ai',
          content: aiResponse,
          messageType: 'ai_response',
          metadata: { aiGenerated: true },
        });
        
        conversation = updatedConv;
      } catch (aiError) {
        console.error('AI response error:', aiError.message);
        console.error('AI error stack:', aiError.stack);
        
        // Fallback for rate limits or other errors
        let fallbackMessage = "I apologize, but I'm having trouble processing your request right now. A human representative will be with you shortly.";
        
        if (aiError.message?.includes('429') || aiError.message?.includes('Quota')) {
          fallbackMessage = "I'm currently experiencing high traffic. Please try again in a minute, or wait for a human representative.";
        }

        try {
          const { conversation: updatedConv } = await conversationService.sendMessage({
            conversationId,
            senderId: null,
            senderType: 'system', // Use system type to distinguish
            content: fallbackMessage,
            messageType: 'system',
            metadata: { error: true, originalError: aiError.message }
          });
          conversation = updatedConv;
        } catch (fallbackError) {
          console.error('Failed to send fallback message:', fallbackError);
        }
      }
    } else {
      console.log('Skipping AI response:', { isClient, aiHandled: existingConv?.aiHandled, status: existingConv?.status });
    }
    
    return successResponse(res, { conversation, message });
  } catch (error) {
    next(error);
  }
};

/**
 * Escalate conversation to human representative
 */
export const escalateConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { reason } = req.body;
    
    const conversation = await conversationService.escalateConversation(
      conversationId,
      reason || 'Client requested human assistance'
    );
    
    return successResponse(res, { conversation }, 200, 'Conversation escalated');
  } catch (error) {
    next(error);
  }
};

/**
 * Assign representative to conversation (admin/manager only)
 */
export const assignRepresentative = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { representativeId } = req.body;
    
    console.log('[assignRepresentative] Params:', req.params);
    console.log('[assignRepresentative] Body:', req.body);
    console.log('[assignRepresentative] ConversationId:', conversationId, 'RepresentativeId:', representativeId);
    
    if (!representativeId) {
      console.error('[assignRepresentative] Validation failed: representativeId is missing');
      return errorResponse(res, 'VALIDATION_ERROR', 'Representative ID is required', 400);
    }
    
    const conversation = await conversationService.assignRepresentative(
      conversationId,
      representativeId,
      req.user._id
    );
    
    return successResponse(res, { conversation }, 200, 'Representative assigned');
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve a conversation
 */
export const resolveConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { notes } = req.body;
    
    // Determine resolution type based on who is resolving
    const { isClient } = await conversationService.getConversationById(
      conversationId,
      req.user._id
    );
    
    const resolutionType = isClient ? 'client_closed' : 'representative_resolved';
    
    const conversation = await conversationService.resolveConversation(
      conversationId,
      req.user._id,
      resolutionType,
      notes
    );
    
    return successResponse(res, { conversation }, 200, 'Conversation resolved');
  } catch (error) {
    next(error);
  }
};

/**
 * Rate a resolved conversation (client only)
 */
export const rateConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Rating must be between 1 and 5', 400);
    }
    
    const conversation = await conversationService.addSatisfactionRating(
      conversationId,
      req.user._id,
      rating
    );
    
    return successResponse(res, { conversation }, 200, 'Rating submitted');
  } catch (error) {
    next(error);
  }
};

/**
 * Get companies the client is associated with
 */
export const getMyCompanies = async (req, res, next) => {
  try {
    const companies = await conversationService.getClientCompanies(req.user._id);
    return successResponse(res, { companies });
  } catch (error) {
    next(error);
  }
};

/**
 * Browse available companies (for starting new conversations)
 */
export const browseCompanies = async (req, res, next) => {
  try {
    const { search, limit, offset } = req.query;
    
    const { companies, total } = await conversationService.getAvailableCompanies({
      search,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });
    
    return successResponse(res, { companies, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client's orders across all companies
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const { companyId, status, limit, offset } = req.query;
    
    const { orders, total } = await conversationService.getClientOrders(
      req.user._id,
      { companyId, status, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 }
    );
    
    return successResponse(res, { orders, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation statistics for company dashboard
 */
export const getConversationStats = async (req, res, next) => {
  try {
    const stats = await conversationService.getConversationStats(
      req.companyId,
      req.companyRole,
      req.user._id
    );
    return successResponse(res, { stats });
  } catch (error) {
    next(error);
  }
};
