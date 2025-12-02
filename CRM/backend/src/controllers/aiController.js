/**
 * AI Controller
 * 
 * Handles AI-powered endpoints using Gemini service.
 */

import * as geminiService from '../services/geminiService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';

/**
 * Check AI service health
 */
export const checkHealth = async (req, res, next) => {
  try {
    const health = await geminiService.checkHealth();
    return successResponse(res, { ai: health });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate text from prompt
 */
export const generateText = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Prompt is required', 400);
    }

    const text = await geminiService.generateText(prompt);
    return successResponse(res, { text });
  } catch (error) {
    next(error);
  }
};

/**
 * Summarize content
 */
export const summarize = async (req, res, next) => {
  try {
    const { content, maxLength } = req.body;
    
    if (!content) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Content is required', 400);
    }

    const summary = await geminiService.summarize(content, maxLength);
    return successResponse(res, { summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task suggestions for a project
 */
export const suggestTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const companyId = req.companyId;

    const project = await Project.findOne({ _id: projectId, companyId, isActive: true });
    if (!project) {
      return errorResponse(res, 'NOT_FOUND', 'Project not found', 404);
    }

    const existingTasks = await Task.find({ projectId, companyId, isActive: true })
      .select('title status')
      .lean();

    const suggestions = await geminiService.suggestTasks(project, existingTasks);
    return successResponse(res, { suggestions });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate email draft for client
 */
export const generateEmailDraft = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { purpose, context, tone } = req.body;
    const companyId = req.companyId;

    if (!purpose) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Email purpose is required', 400);
    }

    const client = await Client.findOne({ _id: clientId, companyId, isActive: true });
    if (!client) {
      return errorResponse(res, 'NOT_FOUND', 'Client not found', 404);
    }

    const draft = await geminiService.generateEmailDraft({
      clientName: client.name,
      purpose,
      context,
      tone,
    });

    return successResponse(res, { draft });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze client and get insights
 */
export const analyzeClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const companyId = req.companyId;

    const client = await Client.findOne({ _id: clientId, companyId, isActive: true }).lean();
    if (!client) {
      return errorResponse(res, 'NOT_FOUND', 'Client not found', 404);
    }

    // Get order statistics
    const orders = await Order.find({ clientId, companyId }).lean();
    const orderCount = orders.length;
    const totalValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const analysis = await geminiService.analyzeClient({
      name: client.name,
      status: client.status,
      company: client.company,
      orderCount,
      totalValue,
      lastContact: client.updatedAt,
      notes: client.notes,
    });

    return successResponse(res, { analysis, client: { name: client.name, status: client.status } });
  } catch (error) {
    next(error);
  }
};

/**
 * Smart search with natural language
 */
export const smartSearch = async (req, res, next) => {
  try {
    const { query, entityType } = req.body;
    const companyId = req.companyId;

    if (!query || !entityType) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Query and entityType are required', 400);
    }

    const validTypes = ['client', 'order', 'task', 'project'];
    if (!validTypes.includes(entityType)) {
      return errorResponse(res, 'VALIDATION_ERROR', `entityType must be one of: ${validTypes.join(', ')}`, 400);
    }

    // Get AI-generated filters
    const filters = await geminiService.smartSearch(query, entityType);

    // Add company filter
    const searchQuery = { ...filters, companyId, isActive: true };

    // Execute search based on entity type
    let results = [];
    switch (entityType) {
      case 'client':
        results = await Client.find(searchQuery).limit(20).lean();
        break;
      case 'order':
        results = await Order.find(searchQuery).limit(20).lean();
        break;
      case 'task':
        results = await Task.find(searchQuery).limit(20).lean();
        break;
      case 'project':
        results = await Project.find(searchQuery).limit(20).lean();
        break;
    }

    return successResponse(res, { 
      results, 
      count: results.length, 
      filters,
      query 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate project description
 */
export const generateProjectDescription = async (req, res, next) => {
  try {
    const { title, briefDescription } = req.body;

    if (!title) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Title is required', 400);
    }

    const description = await geminiService.generateProjectDescription(
      title,
      briefDescription || ''
    );

    return successResponse(res, { description });
  } catch (error) {
    next(error);
  }
};

/**
 * Suggest responses for chat message
 */
export const suggestResponses = async (req, res, next) => {
  try {
    const { message, clientName, conversationContext } = req.body;

    if (!message) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Message is required', 400);
    }

    const suggestions = await geminiService.suggestResponses(message, {
      clientName,
      conversationContext,
    });

    return successResponse(res, { suggestions });
  } catch (error) {
    next(error);
  }
};

export default {
  checkHealth,
  generateText,
  summarize,
  suggestTasks,
  generateEmailDraft,
  analyzeClient,
  smartSearch,
  generateProjectDescription,
  suggestResponses,
};
