/**
 * Conversation Service
 * 
 * Handles all business logic for client-company conversations
 * including AI chat, representative escalation, and multi-channel support.
 */

import { Conversation } from '../models/Conversation.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { createNotification } from './notificationService.js';

/**
 * Get all conversations for a client user
 */
export async function getClientConversations(clientUserId, { status, companyId, type, limit = 50, offset = 0 }) {
  const query = { clientUserId, isActive: true };
  
  if (status) query.status = status;
  if (companyId) query.companyId = companyId;
  if (type) query.type = type;
  
  console.log('[getClientConversations] Query:', JSON.stringify(query));

  const conversations = await Conversation.find(query)
    .populate('companyId', 'name domain')
    .populate('assignedRepresentative', 'name email')
    .sort({ lastActivity: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  
  const total = await Conversation.countDocuments(query);
  
  return { conversations, total };
}

/**
 * Get all conversations for a company (for representatives/admins)
 * @param {string} companyId - Company ID
 * @param {Object} options - Filter options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.assignedTo] - Filter by assigned representative
 * @param {string} [options.type] - Filter by conversation type
 * @param {string} [options.userId] - User ID for employee filtering
 * @param {string} [options.role] - User role for access control
 * @param {number} [options.limit] - Results limit
 * @param {number} [options.offset] - Results offset
 */
export async function getCompanyConversations(companyId, { status, assignedTo, type, userId, role, limit = 50, offset = 0 }) {
  const query = { companyId, isActive: true };
  
  console.log(`[getCompanyConversations] CompanyId: ${companyId}, Role: ${role}, UserId: ${userId}, UserIdType: ${typeof userId}`);
  
  // DEBUG: Check all conversations for this company
  const allConversations = await Conversation.find({ companyId, isActive: true })
    .select('_id clientUserId assignedRepresentative status')
    .lean();
  console.log(`[getCompanyConversations] DEBUG: Found ${allConversations.length} total conversations for company ${companyId}:`);
  allConversations.forEach(c => {
    console.log(`  - ${c._id}: assignedRepresentative=${c.assignedRepresentative}, status=${c.status}`);
  });
  
  // Employees: only see conversations assigned to them
  if (role === 'employee' && userId) {
    // MongoDB string IDs are automatically converted, but being explicit helps with debugging
    query.assignedRepresentative = userId.toString();
    console.log(`[getCompanyConversations] Employee filter: assignedRepresentative = ${userId} (${typeof query.assignedRepresentative})`);
  } else if (assignedTo) {
    query.assignedRepresentative = assignedTo;
  }
  
  if (status) query.status = status;
  if (type) query.type = type;
  
  console.log('[getCompanyConversations] MongoDB query:', JSON.stringify(query, null, 2));
  
  const conversations = await Conversation.find(query)
    .populate('clientUserId', 'name email phone avatar')
    .populate('assignedRepresentative', 'name email')
    .sort({ lastActivity: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  
  console.log(`[getCompanyConversations] Found ${conversations.length} conversations`);
  
  // Log assignment details for debugging
  if (conversations.length > 0) {
    console.log('[getCompanyConversations] Conversation details:');
    conversations.forEach(conv => {
      console.log(`  - Conversation ${conv._id}:`);
      console.log(`    Status: ${conv.status}`);
      console.log(`    Client: ${conv.clientUserId?.name || 'N/A'}`);
      console.log(`    Assigned to: ${conv.assignedRepresentative ? `${conv.assignedRepresentative.name} (${conv.assignedRepresentative._id})` : 'Unassigned'}`);
    });
  } else {
    console.log('[getCompanyConversations] No conversations found matching query');
  }
  
  const total = await Conversation.countDocuments(query);
  
  console.log(`[getCompanyConversations] Total count: ${total}`);
  
  return { conversations, total };
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId)
    .populate('companyId', 'name domain')
    .populate('clientUserId', 'name email phone avatar')
    .populate('assignedRepresentative', 'name email avatar')
    .populate('relatedOrderId')
    .lean();
  
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.status = 404;
    throw error;
  }
  
  // Verify access - either the client or company staff
  const isClient = conversation.clientUserId._id.toString() === userId.toString();
  const user = await User.findById(userId);
  const isCompanyMember = user?.companies?.some(
    c => c.companyId.toString() === conversation.companyId._id.toString() && 
    ['company_admin', 'manager', 'employee'].includes(c.role) &&
    c.isActive && c.status === 'approved'
  );
  
  if (!isClient && !isCompanyMember) {
    const error = new Error('Access denied');
    error.status = 403;
    throw error;
  }
  
  return { conversation, isClient, isCompanyMember };
}

/**
 * Start a new conversation or get existing one
 */
export async function startConversation({
  clientUserId,
  companyId,
  type = 'general',
  productId = null,
  productName = null,
  initialMessage = null,
}) {
  // Verify company exists
  const company = await Company.findById(companyId);
  if (!company || !company.isActive) {
    const error = new Error('Company not found');
    error.status = 404;
    throw error;
  }
  
  // Use the model's static method to find or create
  let conversation = await Conversation.findOrCreateConversation({
    clientUserId,
    companyId,
    type,
    productId,
    productName,
  });
  
  // Add initial message if provided
  if (initialMessage) {
    conversation.messages.push({
      senderId: clientUserId,
      senderType: 'client',
      content: initialMessage,
      messageType: 'text',
    });
    conversation.lastActivity = new Date();
    await conversation.save();
  }
  
  // Populate for response
  await conversation.populate('companyId', 'name domain');
  
  return conversation;
}

/**
 * Send a message in a conversation
 */
export async function sendMessage({
  conversationId,
  senderId,
  senderType,
  content,
  messageType = 'text',
  metadata = {},
}) {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation || !conversation.isActive) {
    const error = new Error('Conversation not found');
    error.status = 404;
    throw error;
  }
  
  // Add message
  const message = {
    senderId,
    senderType,
    content,
    messageType,
    metadata,
  };
  
  conversation.messages.push(message);
  conversation.lastActivity = new Date();
  await conversation.save();
  
  // Get the saved message (last one in array)
  const savedMessage = conversation.messages[conversation.messages.length - 1];
  
  // Send notification to relevant party
  if (senderType === 'client' && conversation.assignedRepresentative) {
    // Notify representative
    await createNotification({
      userId: conversation.assignedRepresentative,
      companyId: conversation.companyId,
      type: 'general',
      title: 'New Message from Client',
      message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      priority: conversation.priority === 'urgent' ? 'high' : 'medium',
    });
  } else if (senderType === 'representative') {
    // Notify client
    await createNotification({
      userId: conversation.clientUserId,
      companyId: conversation.companyId,
      type: 'general',
      title: 'New Message from Support',
      message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      priority: 'medium',
    });
  }
  
  return { conversation, message: savedMessage };
}

/**
 * Add AI response to a conversation
 */
export async function addAIResponse(conversationId, aiContent) {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  conversation.messages.push({
    senderId: null,
    senderType: 'ai',
    content: aiContent,
    messageType: 'ai_response',
    metadata: { aiGenerated: true },
  });
  conversation.lastActivity = new Date();
  await conversation.save();
  
  await conversation.populate('companyId', 'name domain');
  
  return conversation;
}

/**
 * Process AI response for a conversation
 */
export async function processAIResponse(conversationId, clientMessage) {
  const conversation = await Conversation.findById(conversationId)
    .populate('companyId', 'name');
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  // This will be called by the AI service to add the AI response
  // The actual AI processing happens in the MCP/AI service
  return conversation;
}

/**
 * Escalate conversation to human representative
 */
export async function escalateConversation(conversationId, reason, representativeId = null) {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  await conversation.escalateToRepresentative(reason, representativeId);
  
  // Notify company admins/managers if no specific representative assigned
  if (!representativeId) {
    const companyUsers = await User.find({
      'companies.companyId': conversation.companyId,
      'companies.role': { $in: ['company_admin', 'manager'] },
      'companies.isActive': true,
    });
    
    for (const user of companyUsers) {
      await createNotification({
        userId: user._id,
        companyId: conversation.companyId,
        type: 'general',
        title: 'Conversation Needs Attention',
        message: `A customer conversation requires human assistance. Reason: ${reason}`,
        priority: 'high',
      });
    }
  } else {
    // Notify specific representative
    await createNotification({
      userId: representativeId,
      companyId: conversation.companyId,
      type: 'general',
      title: 'New Conversation Assigned',
      message: 'A customer conversation has been assigned to you.',
      priority: 'high',
    });
  }
  
  return conversation;
}

/**
 * Assign representative to conversation
 */
export async function assignRepresentative(conversationId, representativeId, assignedBy) {
  console.log(`[assignRepresentative] ConversationId: ${conversationId}, RepresentativeId: ${representativeId}, AssignedBy: ${assignedBy}`);
  
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    console.error(`[assignRepresentative] Conversation not found: ${conversationId}`);
    throw new Error('Conversation not found');
  }
  
  console.log(`[assignRepresentative] Before: assignedRepresentative=${conversation.assignedRepresentative}, status=${conversation.status}`);
  
  conversation.assignedRepresentative = representativeId;
  conversation.status = 'with_representative';
  conversation.aiHandled = false;
  
  conversation.messages.push({
    senderType: 'system',
    content: 'A customer representative has joined the conversation.',
    messageType: 'system',
  });
  
  await conversation.save();
  
  console.log(`[assignRepresentative] After save: assignedRepresentative=${conversation.assignedRepresentative}, status=${conversation.status}`);
  
  // Notify representative
  await createNotification({
    userId: representativeId,
    companyId: conversation.companyId,
    type: 'general',
    title: 'Conversation Assigned',
    message: 'A customer conversation has been assigned to you.',
    priority: 'medium',
  });
  
  // Populate the conversation before returning
  await conversation.populate('assignedRepresentative', 'name email');
  
  console.log(`[assignRepresentative] Returning conversation with assignedRepresentative:`, conversation.assignedRepresentative);
  
  return conversation;
}

/**
 * Resolve a conversation
 */
export async function resolveConversation(conversationId, resolvedBy, resolutionType, notes = '') {
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  await conversation.resolve(resolvedBy, resolutionType, notes);
  
  // Notify client
  await createNotification({
    userId: conversation.clientUserId,
    companyId: conversation.companyId,
    type: 'general',
    title: 'Conversation Resolved',
    message: 'Your support conversation has been resolved. Thank you for contacting us!',
    priority: 'low',
  });
  
  return conversation;
}

/**
 * Add satisfaction rating to resolved conversation
 */
export async function addSatisfactionRating(conversationId, clientUserId, rating) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    clientUserId,
    status: 'resolved',
  });
  
  if (!conversation) {
    throw new Error('Conversation not found or not resolved');
  }
  
  conversation.resolution.clientSatisfaction = rating;
  await conversation.save();
  
  return conversation;
}

/**
 * Get client's companies (companies they are a client of)
 */
export async function getClientCompanies(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const clientCompanies = user.companies
    .filter(c => c.role === 'client' && c.isActive && c.status === 'approved')
    .map(c => c.companyId);
  
  const companies = await Company.find({
    _id: { $in: clientCompanies },
    isActive: true,
  }).select('name domain').lean();
  
  return companies;
}

/**
 * Get client's orders across all companies
 */
export async function getClientOrders(clientUserId, { companyId, status, limit = 50, offset = 0 }) {
  const query = { clientUserId };
  
  if (companyId) query.companyId = companyId;
  if (status) query.status = status;
  
  const orders = await Order.find(query)
    .populate('companyId', 'name domain')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  
  const total = await Order.countDocuments(query);
  
  return { orders, total };
}

/**
 * Get all available companies for clients to browse
 */
export async function getAvailableCompanies({ search, limit = 50, offset = 0 }) {
  const query = { isActive: true };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { domain: { $regex: search, $options: 'i' } },
    ];
  }
  
  const companies = await Company.find(query)
    .select('name domain createdAt')
    .sort({ name: 1 })
    .skip(offset)
    .limit(limit)
    .lean();
  
  const total = await Company.countDocuments(query);
  
  return { companies, total };
}

/**
 * Get conversation statistics for a company
 * @param {string} companyId - Company ID
 * @param {string} role - User role (employee, manager, company_admin)
 * @param {string} userId - User ID for employee filtering
 */
export async function getConversationStats(companyId, role, userId) {
  const matchStage = { 
    companyId: new mongoose.Types.ObjectId(companyId), 
    isActive: true 
  };
  
  // Employees only see stats for their assigned conversations
  if (role === 'employee' && userId) {
    matchStage.assignedRepresentative = new mongoose.Types.ObjectId(userId);
    console.log(`[getConversationStats] Employee filter: assignedRepresentative = ${userId}`);
  }
  
  const stats = await Conversation.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        pendingRepresentative: { $sum: { $cond: [{ $eq: ['$status', 'pending_representative'] }, 1, 0] } },
        withRepresentative: { $sum: { $cond: [{ $eq: ['$status', 'with_representative'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        inquiries: { $sum: { $cond: [{ $eq: ['$type', 'inquiry'] }, 1, 0] } },
        orders: { $sum: { $cond: [{ $eq: ['$type', 'order'] }, 1, 0] } },
        complaints: { $sum: { $cond: [{ $eq: ['$type', 'complaint'] }, 1, 0] } },
        avgSatisfaction: { $avg: '$resolution.clientSatisfaction' },
      },
    },
  ]);
  
  const result = stats[0] || {
    total: 0,
    active: 0,
    pendingRepresentative: 0,
    withRepresentative: 0,
    resolved: 0,
    inquiries: 0,
    orders: 0,
    complaints: 0,
    avgSatisfaction: null,
  };
  
  console.log(`[getConversationStats] CompanyId: ${companyId}, Role: ${role}, Stats:`, result);
  return result;
}

import mongoose from 'mongoose';
