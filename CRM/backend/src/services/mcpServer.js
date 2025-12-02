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
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
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

  // Pipeline tools (voice command optimized)
  movePipelineStage: {
    name: 'movePipelineStage',
    description: 'Move a lead, order, project, or task to a different pipeline stage',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['client', 'order', 'project', 'task'], description: 'Type of entity to move' },
        entityId: { type: 'string', description: 'ID of the entity' },
        newStage: { type: 'string', description: 'New pipeline stage name' },
      },
      required: ['entityType', 'entityId', 'newStage'],
    },
  },
  getPipelineStats: {
    name: 'getPipelineStats',
    description: 'Get pipeline statistics showing counts per stage',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['client', 'order', 'project', 'task'], description: 'Type of entity to analyze' },
      },
      required: ['entityType'],
    },
  },

  // Task management tools (voice command optimized)
  updateTaskStatus: {
    name: 'updateTaskStatus',
    description: 'Quickly update a task status (todo, in_progress, review, done)',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID to update' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'cancelled'], description: 'New status' },
      },
      required: ['taskId', 'status'],
    },
  },
  getMyTasks: {
    name: 'getMyTasks',
    description: 'Get tasks assigned to the current user, optionally filtered by status',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'all'], description: 'Filter by status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Filter by priority' },
      },
    },
  },

  // Follow-up and reminder tools
  scheduleFollowup: {
    name: 'scheduleFollowup',
    description: 'Schedule a follow-up task or reminder for a client or deal',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['client', 'order', 'project'], description: 'What to follow up on' },
        entityId: { type: 'string', description: 'ID of the entity' },
        dueDate: { type: 'string', description: 'When to follow up (e.g., "tomorrow", "next week", or ISO date)' },
        note: { type: 'string', description: 'Follow-up note or reminder message' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      },
      required: ['entityType', 'entityId', 'note'],
    },
  },
  getUpcomingFollowups: {
    name: 'getUpcomingFollowups',
    description: 'Get upcoming follow-ups and reminders for today or this week',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: { type: 'string', enum: ['today', 'tomorrow', 'this_week', 'next_week'], default: 'today' },
      },
    },
  },

  // Quick note/comment tools
  addNote: {
    name: 'addNote',
    description: 'Add a note or comment to a client, order, project, or task',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['client', 'order', 'project', 'task'], description: 'Entity type' },
        entityId: { type: 'string', description: 'Entity ID' },
        note: { type: 'string', description: 'Note content' },
      },
      required: ['entityType', 'entityId', 'note'],
    },
  },
  getNotes: {
    name: 'getNotes',
    description: 'Get notes/comments for a specific entity',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['client', 'order', 'project', 'task'], description: 'Entity type' },
        entityId: { type: 'string', description: 'Entity ID' },
        limit: { type: 'number', default: 10 },
      },
      required: ['entityType', 'entityId'],
    },
  },

  // Dashboard and metrics tools
  getDashboardMetrics: {
    name: 'getDashboardMetrics',
    description: 'Get key dashboard metrics and KPIs',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today', 'this_week', 'this_month', 'this_quarter'], default: 'this_week' },
      },
    },
  },
  getTopClients: {
    name: 'getTopClients',
    description: 'Get top clients by revenue or activity',
    inputSchema: {
      type: 'object',
      properties: {
        sortBy: { type: 'string', enum: ['revenue', 'orders', 'recent'], default: 'revenue' },
        limit: { type: 'number', default: 5 },
      },
    },
  },

  // Quick search tools
  quickSearch: {
    name: 'quickSearch',
    description: 'Search across all CRM entities (clients, orders, projects, tasks)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        entityTypes: {
          type: 'array',
          items: { type: 'string', enum: ['client', 'order', 'project', 'task'] },
          description: 'Types to search (defaults to all)',
        },
        limit: { type: 'number', default: 10 },
      },
      required: ['query'],
    },
  },

  // Activity log tools
  getRecentActivity: {
    name: 'getRecentActivity',
    description: 'Get recent activity log entries',
    inputSchema: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['client', 'order', 'project', 'task', 'all'], default: 'all' },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  logActivity: {
    name: 'logActivity',
    description: 'Log a custom activity (call, meeting, email, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['call', 'meeting', 'email', 'note', 'other'], description: 'Activity type' },
        entityType: { type: 'string', enum: ['client', 'order', 'project', 'task'] },
        entityId: { type: 'string', description: 'Related entity ID' },
        description: { type: 'string', description: 'Activity description' },
      },
      required: ['type', 'description'],
    },
  },

  // Order management tools
  updateOrderStatus: {
    name: 'updateOrderStatus',
    description: 'Update an order status',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID' },
        status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
      },
      required: ['orderId', 'status'],
    },
  },
  createOrder: {
    name: 'createOrder',
    description: 'Create a new order for a client',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'Client ID' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
            },
          },
          description: 'Order items',
        },
        notes: { type: 'string', description: 'Order notes' },
      },
      required: ['clientId'],
    },
  },

  // Team tools
  getTeamMembers: {
    name: 'getTeamMembers',
    description: 'Get list of team members',
    inputSchema: {
      type: 'object',
      properties: {
        role: { type: 'string', description: 'Filter by role' },
      },
    },
  },
  assignTask: {
    name: 'assignTask',
    description: 'Assign a task to a team member',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        userId: { type: 'string', description: 'User ID to assign to' },
        notify: { type: 'boolean', default: true, description: 'Send notification' },
      },
      required: ['taskId', 'userId'],
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

      // Pipeline tools
      case 'movePipelineStage': {
        let entity;
        const updateData = { pipelineStage: params.newStage, updatedAt: new Date() };
        
        switch (params.entityType) {
          case 'client':
            entity = await Client.findOneAndUpdate(
              { _id: params.entityId, companyId },
              updateData,
              { new: true }
            ).lean();
            break;
          case 'order':
            entity = await Order.findOneAndUpdate(
              { _id: params.entityId, companyId },
              { ...updateData, status: params.newStage },
              { new: true }
            ).lean();
            break;
          case 'project':
            entity = await Project.findOneAndUpdate(
              { _id: params.entityId, companyId },
              { ...updateData, status: params.newStage },
              { new: true }
            ).lean();
            break;
          case 'task':
            entity = await Task.findOneAndUpdate(
              { _id: params.entityId, companyId },
              { ...updateData, status: params.newStage },
              { new: true }
            ).lean();
            break;
        }
        
        if (!entity) return { success: false, error: { code: 'NOT_FOUND', message: 'Entity not found' } };
        return { success: true, data: { entity, newStage: params.newStage }, message: `Moved to ${params.newStage}` };
      }

      case 'getPipelineStats': {
        let stats;
        switch (params.entityType) {
          case 'client':
            stats = await Client.aggregate([
              { $match: { companyId, isActive: true } },
              { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
            ]);
            break;
          case 'order':
            stats = await Order.aggregate([
              { $match: { companyId } },
              { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$totalAmount' } } },
            ]);
            break;
          case 'project':
            stats = await Project.aggregate([
              { $match: { companyId, isActive: true } },
              { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            break;
          case 'task':
            stats = await Task.aggregate([
              { $match: { companyId, isActive: true } },
              { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            break;
        }
        return { success: true, data: { stats, entityType: params.entityType } };
      }

      // Task management tools
      case 'updateTaskStatus': {
        const task = await Task.findOneAndUpdate(
          { _id: params.taskId, companyId },
          { status: params.status, updatedAt: new Date() },
          { new: true }
        ).populate('assignedTo', 'name').lean();
        
        if (!task) return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };
        return { success: true, data: { task }, message: `Task status updated to ${params.status}` };
      }

      case 'getMyTasks': {
        const query = { companyId, isActive: true };
        if (params.status && params.status !== 'all') query.status = params.status;
        if (params.priority) query.priority = params.priority;
        
        const tasks = await Task.find(query)
          .populate('projectId', 'name')
          .sort({ priority: -1, dueDate: 1 })
          .limit(20)
          .lean();
        
        return { success: true, data: { tasks, count: tasks.length } };
      }

      // Follow-up tools
      case 'scheduleFollowup': {
        // Parse relative dates
        let dueDate = new Date();
        if (params.dueDate) {
          const lower = params.dueDate.toLowerCase();
          if (lower.includes('tomorrow')) {
            dueDate.setDate(dueDate.getDate() + 1);
          } else if (lower.includes('next week')) {
            dueDate.setDate(dueDate.getDate() + 7);
          } else if (lower.includes('next month')) {
            dueDate.setMonth(dueDate.getMonth() + 1);
          } else {
            dueDate = new Date(params.dueDate);
          }
        }

        const followupTask = await Task.create({
          companyId,
          title: `Follow-up: ${params.note.substring(0, 50)}`,
          description: params.note,
          type: 'followup',
          relatedEntity: params.entityType,
          relatedEntityId: params.entityId,
          dueDate,
          priority: params.priority || 'medium',
          status: 'todo',
        });

        return { success: true, data: { task: followupTask }, message: `Follow-up scheduled for ${dueDate.toLocaleDateString()}` };
      }

      case 'getUpcomingFollowups': {
        const now = new Date();
        let endDate = new Date();
        
        switch (params.timeframe) {
          case 'today':
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'tomorrow':
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'this_week':
            endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
            break;
          case 'next_week':
            endDate.setDate(endDate.getDate() + 14);
            break;
          default:
            endDate.setHours(23, 59, 59, 999);
        }

        const followups = await Task.find({
          companyId,
          isActive: true,
          type: 'followup',
          dueDate: { $gte: now, $lte: endDate },
        }).sort({ dueDate: 1 }).lean();

        return { success: true, data: { followups, count: followups.length, timeframe: params.timeframe } };
      }

      // Note tools
      case 'addNote': {
        const note = await Message.create({
          companyId,
          type: 'note',
          entityType: params.entityType,
          entityId: params.entityId,
          content: params.note,
          createdAt: new Date(),
        });
        return { success: true, data: { note }, message: 'Note added successfully' };
      }

      case 'getNotes': {
        const notes = await Message.find({
          companyId,
          entityType: params.entityType,
          entityId: params.entityId,
          type: 'note',
        }).sort({ createdAt: -1 }).limit(params.limit || 10).lean();
        
        return { success: true, data: { notes, count: notes.length } };
      }

      // Dashboard and metrics tools
      case 'getDashboardMetrics': {
        const now = new Date();
        let startDate = new Date();
        
        switch (params.period) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'this_week':
            startDate.setDate(startDate.getDate() - startDate.getDay());
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'this_month':
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'this_quarter':
            startDate.setMonth(Math.floor(startDate.getMonth() / 3) * 3, 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        }

        const [clients, orders, tasks, projects] = await Promise.all([
          Client.countDocuments({ companyId, isActive: true, createdAt: { $gte: startDate } }),
          Order.aggregate([
            { $match: { companyId, createdAt: { $gte: startDate } } },
            { $group: { _id: null, count: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
          ]),
          Task.aggregate([
            { $match: { companyId, isActive: true } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          Project.countDocuments({ companyId, isActive: true, status: 'in_progress' }),
        ]);

        const orderData = orders[0] || { count: 0, totalRevenue: 0 };
        const tasksByStatus = Object.fromEntries(tasks.map(t => [t._id, t.count]));

        return {
          success: true,
          data: {
            period: params.period,
            metrics: {
              newClients: clients,
              totalOrders: orderData.count,
              revenue: orderData.totalRevenue,
              activeProjects: projects,
              tasksTodo: tasksByStatus.todo || 0,
              tasksInProgress: tasksByStatus.in_progress || 0,
              tasksDone: tasksByStatus.done || 0,
            },
          },
        };
      }

      case 'getTopClients': {
        let clients;
        switch (params.sortBy) {
          case 'revenue':
            clients = await Order.aggregate([
              { $match: { companyId } },
              { $group: { _id: '$clientId', totalRevenue: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
              { $sort: { totalRevenue: -1 } },
              { $limit: params.limit || 5 },
              { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
              { $unwind: '$client' },
              { $project: { name: '$client.name', email: '$client.email', totalRevenue: 1, orderCount: 1 } },
            ]);
            break;
          case 'orders':
            clients = await Order.aggregate([
              { $match: { companyId } },
              { $group: { _id: '$clientId', orderCount: { $sum: 1 } } },
              { $sort: { orderCount: -1 } },
              { $limit: params.limit || 5 },
              { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
              { $unwind: '$client' },
              { $project: { name: '$client.name', email: '$client.email', orderCount: 1 } },
            ]);
            break;
          case 'recent':
          default:
            clients = await Client.find({ companyId, isActive: true })
              .sort({ updatedAt: -1 })
              .limit(params.limit || 5)
              .select('name email company status')
              .lean();
        }
        return { success: true, data: { clients, sortBy: params.sortBy } };
      }

      // Quick search
      case 'quickSearch': {
        const results = {};
        const searchTypes = params.entityTypes || ['client', 'order', 'project', 'task'];
        const regex = { $regex: params.query, $options: 'i' };

        if (searchTypes.includes('client')) {
          results.clients = await Client.find({
            companyId,
            isActive: true,
            $or: [{ name: regex }, { email: regex }, { company: regex }],
          }).limit(params.limit || 10).select('name email company status').lean();
        }

        if (searchTypes.includes('order')) {
          results.orders = await Order.find({
            companyId,
            $or: [{ orderNumber: regex }, { notes: regex }],
          }).limit(params.limit || 10).select('orderNumber status totalAmount').lean();
        }

        if (searchTypes.includes('project')) {
          results.projects = await Project.find({
            companyId,
            isActive: true,
            $or: [{ name: regex }, { description: regex }],
          }).limit(params.limit || 10).select('name status').lean();
        }

        if (searchTypes.includes('task')) {
          results.tasks = await Task.find({
            companyId,
            isActive: true,
            $or: [{ title: regex }, { description: regex }],
          }).limit(params.limit || 10).select('title status priority').lean();
        }

        const totalCount = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
        return { success: true, data: { results, totalCount, query: params.query } };
      }

      // Activity log tools
      case 'getRecentActivity': {
        const query = { companyId };
        if (params.entityType && params.entityType !== 'all') {
          query.entityType = params.entityType;
        }

        const activities = await ActivityLog.find(query)
          .sort({ createdAt: -1 })
          .limit(params.limit || 10)
          .lean();

        return { success: true, data: { activities, count: activities.length } };
      }

      case 'logActivity': {
        const activity = await ActivityLog.create({
          companyId,
          type: params.type,
          entityType: params.entityType,
          entityId: params.entityId,
          description: params.description,
          createdAt: new Date(),
        });
        return { success: true, data: { activity }, message: 'Activity logged' };
      }

      // Order management
      case 'updateOrderStatus': {
        const order = await Order.findOneAndUpdate(
          { _id: params.orderId, companyId },
          { status: params.status, updatedAt: new Date() },
          { new: true }
        ).lean();
        
        if (!order) return { success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } };
        return { success: true, data: { order }, message: `Order status updated to ${params.status}` };
      }

      case 'createOrder': {
        const items = params.items || [];
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
        
        const order = await Order.create({
          companyId,
          clientId: params.clientId,
          items,
          totalAmount,
          notes: params.notes,
          status: 'pending',
          orderNumber: `ORD-${Date.now()}`,
        });

        return { success: true, data: { order }, message: 'Order created successfully' };
      }

      // Team tools
      case 'getTeamMembers': {
        const query = { companyId, isActive: true };
        if (params.role) query.role = params.role;

        const members = await User.find(query)
          .select('name email role')
          .lean();

        return { success: true, data: { members, count: members.length } };
      }

      case 'assignTask': {
        const task = await Task.findOneAndUpdate(
          { _id: params.taskId, companyId },
          { assignedTo: params.userId, updatedAt: new Date() },
          { new: true }
        ).populate('assignedTo', 'name email').lean();

        if (!task) return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };
        return { success: true, data: { task }, message: `Task assigned to ${task.assignedTo?.name || 'user'}` };
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
