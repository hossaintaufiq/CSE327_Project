/**
 * MCP (Model Context Protocol) Server
 * 
 * Provides a standardized interface for AI tools to interact with CRM data.
 * This follows the Model Context Protocol specification for tool integration.
 * 
 * Features:
 * - Tool definitions for CRM operations
 * - Context retrieval from database
 * - Standardized request/response format
 */

import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Message } from '../models/Message.js';
import * as geminiService from './geminiService.js';

/**
 * MCP Tool Definitions
 * These define the available tools and their schemas
 */
export const TOOL_DEFINITIONS = {
  // Client tools
  searchClients: {
    name: 'searchClients',
    description: 'Search for clients in the CRM by name, email, status, or company',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (name, email, or company)' },
        status: { type: 'string', enum: ['active', 'inactive', 'lead', 'customer'], description: 'Filter by status' },
        limit: { type: 'number', description: 'Maximum results to return', default: 10 },
      },
    },
  },
  getClient: {
    name: 'getClient',
    description: 'Get detailed information about a specific client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'The client ID' },
      },
      required: ['clientId'],
    },
  },
  createClient: {
    name: 'createClient',
    description: 'Create a new client/lead in the CRM',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Client name' },
        email: { type: 'string', description: 'Client email' },
        phone: { type: 'string', description: 'Client phone' },
        company: { type: 'string', description: 'Client company' },
        status: { type: 'string', enum: ['active', 'inactive', 'lead', 'customer'], default: 'lead' },
      },
      required: ['name', 'email'],
    },
  },

  // Order tools
  searchOrders: {
    name: 'searchOrders',
    description: 'Search for orders by status or client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Filter by client ID' },
        status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  getOrder: {
    name: 'getOrder',
    description: 'Get detailed information about a specific order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'The order ID' },
      },
      required: ['orderId'],
    },
  },

  // Task tools
  searchTasks: {
    name: 'searchTasks',
    description: 'Search for tasks by status, project, or assignee',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Filter by project ID' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'cancelled'] },
        assignedTo: { type: 'string', description: 'Filter by assignee user ID' },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  createTask: {
    name: 'createTask',
    description: 'Create a new task',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        projectId: { type: 'string', description: 'Project ID to assign task to' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        dueDate: { type: 'string', description: 'Due date in ISO format' },
      },
      required: ['title'],
    },
  },

  // Project tools
  searchProjects: {
    name: 'searchProjects',
    description: 'Search for projects by status or name',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (project name)' },
        status: { type: 'string', enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'] },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  getProject: {
    name: 'getProject',
    description: 'Get detailed information about a specific project including tasks',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'The project ID' },
      },
      required: ['projectId'],
    },
  },

  // AI tools
  generateContent: {
    name: 'generateContent',
    description: 'Generate content using AI (emails, descriptions, summaries)',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['email', 'description', 'summary', 'response'], description: 'Type of content to generate' },
        context: { type: 'string', description: 'Context for generation' },
        tone: { type: 'string', enum: ['professional', 'friendly', 'formal'], default: 'professional' },
      },
      required: ['type', 'context'],
    },
  },
  analyzeData: {
    name: 'analyzeData',
    description: 'Analyze CRM data and provide insights',
    inputSchema: {
      type: 'object',
      properties: {
        dataType: { type: 'string', enum: ['client', 'orders', 'tasks', 'projects'], description: 'Type of data to analyze' },
        entityId: { type: 'string', description: 'Specific entity ID to analyze' },
      },
      required: ['dataType'],
    },
  },
};

/**
 * Execute an MCP tool
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} params - Tool parameters
 * @param {string} companyId - Company ID for data isolation
 * @returns {Promise<Object>} Tool execution result
 */
export async function executeTool(toolName, params, companyId) {
  const tool = TOOL_DEFINITIONS[toolName];
  
  if (!tool) {
    return {
      success: false,
      error: { code: 'UNKNOWN_TOOL', message: `Tool '${toolName}' not found` },
    };
  }

  try {
    switch (toolName) {
      // Client tools
      case 'searchClients': {
        const query = { companyId, isActive: true };
        if (params.status) query.status = params.status;
        if (params.query) {
          query.$or = [
            { name: { $regex: params.query, $options: 'i' } },
            { email: { $regex: params.query, $options: 'i' } },
            { company: { $regex: params.query, $options: 'i' } },
          ];
        }
        const clients = await Client.find(query).limit(params.limit || 10).lean();
        return { success: true, data: { clients, count: clients.length } };
      }

      case 'getClient': {
        const client = await Client.findOne({ _id: params.clientId, companyId, isActive: true }).lean();
        if (!client) return { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } };
        
        // Get related orders
        const orders = await Order.find({ clientId: params.clientId, companyId }).select('orderNumber status totalAmount createdAt').lean();
        return { success: true, data: { client, orders, orderCount: orders.length } };
      }

      case 'createClient': {
        const client = await Client.create({ ...params, companyId });
        return { success: true, data: { client }, message: 'Client created successfully' };
      }

      // Order tools
      case 'searchOrders': {
        const query = { companyId };
        if (params.clientId) query.clientId = params.clientId;
        if (params.status) query.status = params.status;
        const orders = await Order.find(query)
          .populate('clientId', 'name email')
          .limit(params.limit || 10)
          .lean();
        return { success: true, data: { orders, count: orders.length } };
      }

      case 'getOrder': {
        const order = await Order.findOne({ _id: params.orderId, companyId })
          .populate('clientId', 'name email company')
          .lean();
        if (!order) return { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } };
        return { success: true, data: { order } };
      }

      // Task tools
      case 'searchTasks': {
        const query = { companyId, isActive: true };
        if (params.projectId) query.projectId = params.projectId;
        if (params.status) query.status = params.status;
        if (params.assignedTo) query.assignedTo = params.assignedTo;
        const tasks = await Task.find(query)
          .populate('projectId', 'name')
          .populate('assignedTo', 'name')
          .limit(params.limit || 10)
          .lean();
        return { success: true, data: { tasks, count: tasks.length } };
      }

      case 'createTask': {
        const task = await Task.create({ ...params, companyId, status: 'todo' });
        return { success: true, data: { task }, message: 'Task created successfully' };
      }

      // Project tools
      case 'searchProjects': {
        const query = { companyId, isActive: true };
        if (params.status) query.status = params.status;
        if (params.query) {
          query.name = { $regex: params.query, $options: 'i' };
        }
        const projects = await Project.find(query).limit(params.limit || 10).lean();
        return { success: true, data: { projects, count: projects.length } };
      }

      case 'getProject': {
        const project = await Project.findOne({ _id: params.projectId, companyId, isActive: true })
          .populate('assignedTo', 'name email')
          .lean();
        if (!project) return { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } };
        
        const tasks = await Task.find({ projectId: params.projectId, companyId, isActive: true })
          .populate('assignedTo', 'name')
          .lean();
        return { success: true, data: { project, tasks, taskCount: tasks.length } };
      }

      // AI tools
      case 'generateContent': {
        let content = '';
        switch (params.type) {
          case 'email':
            const emailDraft = await geminiService.generateEmailDraft({
              clientName: params.clientName || 'Client',
              purpose: params.context,
              tone: params.tone,
            });
            content = emailDraft;
            break;
          case 'description':
            content = await geminiService.generateProjectDescription('Project', params.context);
            break;
          case 'summary':
            content = await geminiService.summarize(params.context);
            break;
          case 'response':
            const responses = await geminiService.suggestResponses(params.context, { clientName: params.clientName });
            content = responses;
            break;
          default:
            content = await geminiService.generateText(params.context);
        }
        return { success: true, data: { content, type: params.type } };
      }

      case 'analyzeData': {
        let analysis = {};
        switch (params.dataType) {
          case 'client':
            if (params.entityId) {
              const client = await Client.findOne({ _id: params.entityId, companyId }).lean();
              if (client) {
                const orders = await Order.find({ clientId: params.entityId }).lean();
                analysis = await geminiService.analyzeClient({
                  name: client.name,
                  status: client.status,
                  company: client.company,
                  orderCount: orders.length,
                  totalValue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
                });
              }
            }
            break;
          case 'orders':
            const orderStats = await Order.aggregate([
              { $match: { companyId } },
              { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
            ]);
            analysis = { ordersByStatus: orderStats };
            break;
          case 'tasks':
            const taskStats = await Task.aggregate([
              { $match: { companyId, isActive: true } },
              { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            analysis = { tasksByStatus: taskStats };
            break;
          case 'projects':
            const projectStats = await Project.aggregate([
              { $match: { companyId, isActive: true } },
              { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            analysis = { projectsByStatus: projectStats };
            break;
        }
        return { success: true, data: { analysis, dataType: params.dataType } };
      }

      default:
        return { success: false, error: { code: 'NOT_IMPLEMENTED', message: `Tool '${toolName}' not implemented` } };
    }
  } catch (error) {
    console.error(`MCP tool execution error (${toolName}):`, error);
    return {
      success: false,
      error: { code: 'EXECUTION_ERROR', message: error.message },
    };
  }
}

/**
 * Get available tools list (MCP tools/list format)
 * @returns {Object} List of available tools
 */
export function listTools() {
  return {
    tools: Object.values(TOOL_DEFINITIONS).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
}

/**
 * Get context for AI operations
 * @param {string} companyId - Company ID
 * @param {string} contextType - Type of context to retrieve
 * @returns {Promise<Object>} Context data
 */
export async function getContext(companyId, contextType) {
  switch (contextType) {
    case 'overview':
      const [clientCount, orderCount, projectCount, taskCount] = await Promise.all([
        Client.countDocuments({ companyId, isActive: true }),
        Order.countDocuments({ companyId }),
        Project.countDocuments({ companyId, isActive: true }),
        Task.countDocuments({ companyId, isActive: true }),
      ]);
      return { clientCount, orderCount, projectCount, taskCount };

    case 'recent':
      const [recentClients, recentOrders, recentTasks] = await Promise.all([
        Client.find({ companyId, isActive: true }).sort({ createdAt: -1 }).limit(5).select('name email status').lean(),
        Order.find({ companyId }).sort({ createdAt: -1 }).limit(5).select('orderNumber status totalAmount').lean(),
        Task.find({ companyId, isActive: true }).sort({ createdAt: -1 }).limit(5).select('title status priority').lean(),
      ]);
      return { recentClients, recentOrders, recentTasks };

    default:
      return {};
  }
}

export default {
  TOOL_DEFINITIONS,
  executeTool,
  listTools,
  getContext,
};
