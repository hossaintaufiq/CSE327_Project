/**
 * AI Controller
 * 
 * Handles AI-powered endpoints using Gemini service.
 * Last updated: December 9, 2025
 */

import * as geminiService from '../services/geminiService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

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

/**
 * Get company dashboard insights and recommendations
 */
export const getCompanyInsights = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    
    // Fetch key company statistics for AI analysis
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Monthly Revenue
    const monthlyRevenueResult = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: 'delivered',
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;
    
    // Total Revenue
    const totalRevenueResult = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: 'delivered',
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    
    // New Leads (30d)
    const newLeads30d = await Client.countDocuments({
      companyId,
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo },
    });
    
    // Total Clients
    const totalClients = await Client.countDocuments({
      companyId,
      isActive: true,
    });
    
    // Total Orders
    const totalOrders = await Order.countDocuments({ companyId });
    
    // Pipeline Value
    const pipelineResult = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: { $in: ['pending', 'processing'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const pipelineValue = pipelineResult[0]?.total || 0;
    
    // Active Tasks
    const activeTasks = await Task.countDocuments({
      companyId,
      isActive: true,
      status: { $in: ['todo', 'in_progress', 'review'] },
    });
    
    // Total Employees
    const employeesResult = await User.aggregate([
      { $unwind: '$companies' },
      {
        $match: {
          'companies.companyId': new mongoose.Types.ObjectId(companyId),
          'companies.isActive': true,
          isActive: true,
        },
      },
      { $count: 'total' },
    ]);
    const totalEmployees = employeesResult[0]?.total || 0;
    
    // Revenue Trend (last 6 months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthRevenue = await Order.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            status: 'delivered',
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      revenueTrend.push({
        month: monthNames[monthStart.getMonth()],
        revenue: monthRevenue[0]?.total || 0,
      });
    }
    
    // Calculate metrics
    const allDeliveredOrders = await Order.find({
      companyId,
      status: 'delivered',
    }).lean();
    const avgDealSize = allDeliveredOrders.length > 0 ? totalRevenue / allDeliveredOrders.length : 0;
    const conversionRate = totalOrders > 0 ? (allDeliveredOrders.length / totalOrders) * 100 : 0;
    
    const companyData = {
      monthlyRevenue,
      totalRevenue,
      newLeads30d,
      totalClients,
      totalOrders,
      pipelineValue,
      activeTasks,
      totalEmployees,
      avgDealSize,
      conversionRate,
      revenueTrend,
    };
    
    // Check if Gemini API is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      return errorResponse(
        res,
        'CONFIG_ERROR',
        'Gemini API key is not configured. Please add GEMINI_API_KEY to your backend .env file. Get your free API key at: https://makersuite.google.com/app/apikey',
        503
      );
    }
    
    // Generate AI insights
    console.log('[AI Insights] Starting insight generation for company:', companyId);
    const insights = await geminiService.generateCompanyInsights(companyData);
    console.log('[AI Insights] Successfully generated insights');
    
    return successResponse(res, { 
      insights,
      stats: companyData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI Insights] Error generating insights:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('API key') || error.message?.includes('403') || error.message?.includes('Forbidden')) {
      return errorResponse(
        res,
        'API_KEY_ERROR',
        error.message || 'Gemini API key is invalid. Please check your GEMINI_API_KEY in the backend .env file. Get your free API key at: https://makersuite.google.com/app/apikey',
        503
      );
    }
    
    // Check for model errors
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return errorResponse(
        res,
        'MODEL_ERROR',
        'Gemini model not available. Please check backend configuration. Error: ' + error.message,
        503
      );
    }
    
    next(error);
  }
};

/**
 * Process AI request with MCP tools
 * This endpoint allows admins/employees to interact with AI using natural language
 * and leverages MCP tools to perform CRM operations
 */
export const processAIRequest = async (req, res, next) => {
  try {
    const { prompt, conversationHistory = [] } = req.body;
    const companyId = req.companyId;
    const userId = req.user._id;

    if (!prompt) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Prompt is required', 400);
    }

    // Check if Gemini is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      return errorResponse(
        res,
        'CONFIG_ERROR',
        'AI service is not configured. Please contact your administrator.',
        503
      );
    }

    console.log(`[AI Request] User: ${userId}, Company: ${companyId}`);
    console.log(`[AI Request] Prompt: ${prompt.substring(0, 100)}...`);

    // Use Gemini with MCP tools for intelligent CRM operations
    const response = await geminiService.generateWithTools(prompt, companyId, userId);

    console.log(`[AI Request] Response generated successfully`);

    return successResponse(res, { 
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI Request] Error:', error.message || error);
    console.error('[AI Request] Stack:', error.stack);
    
    // Extract retry delay from error message if available
    let retryMessage = '';
    const retryMatch = error.message?.match(/retry in ([\d.]+)s/i);
    if (retryMatch) {
      const seconds = Math.ceil(parseFloat(retryMatch[1]));
      retryMessage = ` Please wait ${seconds} seconds and try again.`;
    }
    
    // Handle specific error types
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit') || error.message?.includes('quota')) {
      return errorResponse(
        res,
        'RATE_LIMIT',
        `You have exceeded the Gemini API free tier limit (20 requests/day).${retryMessage || ' Please wait a moment and try again, or upgrade your API plan.'}`,
        429
      );
    }
    
    if (error.message?.includes('GEMINI_API_KEY')) {
      return errorResponse(
        res,
        'CONFIG_ERROR',
        'AI service is not properly configured.',
        503
      );
    }

    return errorResponse(
      res,
      'AI_ERROR',
      `AI processing failed: ${error.message || 'Unknown error'}`,
      500
    );
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
  getCompanyInsights,
  processAIRequest,
};
