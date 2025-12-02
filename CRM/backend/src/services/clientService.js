/**
 * Client/Lead Service
 * 
 * This service encapsulates all business logic for client/lead management.
 * Controllers should use this service instead of directly accessing models.
 * 
 * MVC Pattern:
 * - Model: Client (Mongoose schema)
 * - View: API responses (JSON)
 * - Controller: clientController.js (thin, calls this service)
 * - Service: THIS FILE (business logic, DB operations)
 */

import { Client } from '../models/Client.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Get all clients/leads for a company
 * @param {Object} params - Query parameters
 * @param {string} params.companyId - Company ID (required)
 * @param {string} [params.userId] - User ID for employee filtering
 * @param {string} [params.role] - User role for access control
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.search] - Search term
 * @returns {Promise<Array>} List of clients
 */
export async function getClients({ companyId, userId, role, status, search }) {
  const query = { companyId, isActive: true };

  // Employees can only see their assigned clients
  if (role === 'employee' && userId) {
    query.assignedTo = userId;
  }

  // Apply status filter if provided
  if (status && ['active', 'inactive', 'lead', 'customer'].includes(status)) {
    query.status = status;
  }

  // Apply search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const clients = await Client.find(query)
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return clients;
}

/**
 * Get a single client by ID
 * @param {Object} params
 * @param {string} params.clientId - Client ID
 * @param {string} params.companyId - Company ID
 * @returns {Promise<Object|null>} Client or null
 */
export async function getClientById({ clientId, companyId }) {
  const client = await Client.findOne({ 
    _id: clientId, 
    companyId, 
    isActive: true 
  })
    .populate('assignedTo', 'name email')
    .lean();

  return client;
}

/**
 * Create a new client/lead
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} params.createdBy - User ID who created
 * @param {Object} params.data - Client data
 * @returns {Promise<Object>} Created client
 */
export async function createClient({ companyId, createdBy, data }) {
  const { name, email, phone, address, assignedTo, status, notes, company } = data;

  if (!name?.trim()) {
    const error = new Error('Name is required');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const client = await Client.create({
    companyId,
    name: name.trim(),
    email: email?.trim().toLowerCase() || '',
    phone: phone?.trim() || '',
    address: address?.trim() || '',
    company: company?.trim() || '',
    assignedTo: assignedTo || null,
    status: status || 'lead',
    notes: notes?.trim() || '',
  });

  // Log activity
  await ActivityLog.create({
    companyId,
    userId: createdBy,
    action: 'create_client',
    entityType: 'client',
    entityId: client._id,
    meta: { name: client.name, status: client.status },
  });

  return client.toObject();
}

/**
 * Update a client
 * @param {Object} params
 * @param {string} params.clientId - Client ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.updatedBy - User ID who updated
 * @param {Object} params.data - Update data
 * @returns {Promise<Object>} Updated client
 */
export async function updateClient({ clientId, companyId, updatedBy, data }) {
  const client = await Client.findOne({ _id: clientId, companyId });

  if (!client) {
    const error = new Error('Client not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Track status change for activity log
  const oldStatus = client.status;

  // Update allowed fields
  const allowedFields = ['name', 'email', 'phone', 'address', 'company', 'assignedTo', 'status', 'notes'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      client[field] = data[field];
    }
  }

  await client.save();

  // Log activity if status changed
  if (oldStatus !== client.status) {
    await ActivityLog.create({
      companyId,
      userId: updatedBy,
      action: 'update_client_status',
      entityType: 'client',
      entityId: client._id,
      meta: { oldStatus, newStatus: client.status, name: client.name },
    });
  }

  return client.toObject();
}

/**
 * Delete (soft) a client
 * @param {Object} params
 * @param {string} params.clientId - Client ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.deletedBy - User ID who deleted
 * @returns {Promise<Object>} Deleted client
 */
export async function deleteClient({ clientId, companyId, deletedBy }) {
  const client = await Client.findOne({ _id: clientId, companyId });

  if (!client) {
    const error = new Error('Client not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  client.isActive = false;
  await client.save();

  // Log activity
  await ActivityLog.create({
    companyId,
    userId: deletedBy,
    action: 'delete_client',
    entityType: 'client',
    entityId: client._id,
    meta: { name: client.name },
  });

  return client.toObject();
}

/**
 * Convert a lead to a customer
 * This is the lead→client conversion flow
 * @param {Object} params
 * @param {string} params.leadId - Lead/Client ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.convertedBy - User ID who converted
 * @param {Object} [params.additionalData] - Additional data to update
 * @returns {Promise<Object>} Converted client
 */
export async function convertLeadToClient({ leadId, companyId, convertedBy, additionalData = {} }) {
  const lead = await Client.findOne({ _id: leadId, companyId });

  if (!lead) {
    const error = new Error('Lead not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Check if already a customer
  if (lead.status === 'customer') {
    const error = new Error('This lead is already a customer');
    error.status = 400;
    error.code = 'ALREADY_CONVERTED';
    throw error;
  }

  const oldStatus = lead.status;
  lead.status = 'customer';

  // Update additional fields if provided
  if (additionalData.email) lead.email = additionalData.email;
  if (additionalData.phone) lead.phone = additionalData.phone;
  if (additionalData.address) lead.address = additionalData.address;
  if (additionalData.notes) lead.notes = additionalData.notes;

  await lead.save();

  // Log activity
  await ActivityLog.create({
    companyId,
    userId: convertedBy,
    action: 'convert_lead_to_customer',
    entityType: 'client',
    entityId: lead._id,
    meta: { 
      name: lead.name, 
      oldStatus, 
      newStatus: 'customer',
      convertedAt: new Date().toISOString(),
    },
  });

  return lead.toObject();
}

/**
 * Get lead statistics for a company
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Statistics
 */
export async function getLeadStats(companyId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalLeads, newLeads30d, customers, activeLeads] = await Promise.all([
    Client.countDocuments({ companyId, isActive: true }),
    Client.countDocuments({ 
      companyId, 
      isActive: true, 
      createdAt: { $gte: thirtyDaysAgo } 
    }),
    Client.countDocuments({ companyId, isActive: true, status: 'customer' }),
    Client.countDocuments({ companyId, isActive: true, status: 'lead' }),
  ]);

  return {
    totalLeads,
    newLeads30d,
    customers,
    activeLeads,
    conversionRate: totalLeads > 0 ? ((customers / totalLeads) * 100).toFixed(1) : 0,
  };
}

/**
 * Get clients assigned to a specific user
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.companyId - Company ID
 * @param {number} [params.limit] - Limit results
 * @returns {Promise<Array>} Assigned clients
 */
export async function getAssignedClients({ userId, companyId, limit = 10 }) {
  const clients = await Client.find({
    companyId,
    assignedTo: userId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return clients;
}

export default {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  convertLeadToClient,
  getLeadStats,
  getAssignedClients,
};
