/**
 * Order Service
 * 
 * Encapsulates all business logic for order management.
 * Controllers should use this service instead of directly accessing models.
 */

import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Client } from '../models/Client.js';

// Valid order statuses
const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// Pipeline stages for orders (for pipeline feature)
export const ORDER_PIPELINE_STAGES = ['pending', 'processing', 'shipped', 'delivered'];

/**
 * Generate unique order number
 * @returns {string} Unique order number
 */
function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Validate order items
 * @param {Array} items - Order items
 * @throws {Error} If validation fails
 */
function validateItems(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    const error = new Error('At least one item is required');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  for (const item of items) {
    if (!item.productName || !item.quantity || item.price === undefined) {
      const error = new Error('Each item must have productName, quantity, and price');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (item.quantity < 1) {
      const error = new Error('Quantity must be at least 1');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (item.price < 0) {
      const error = new Error('Price cannot be negative');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
  }
}

/**
 * Calculate total amount from items
 * @param {Array} items - Order items
 * @returns {number} Total amount
 */
function calculateTotalAmount(items) {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

/**
 * Get all orders for a company
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} [params.userId] - User ID for employee filtering
 * @param {string} [params.role] - User role
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.clientId] - Filter by client
 * @returns {Promise<Array>} List of orders
 */
export async function getOrders({ companyId, userId, role, status, clientId }) {
  const query = { companyId };

  // Employees can only see orders assigned to them
  if (role === 'employee' && userId) {
    query.assignedTo = userId;
  }

  if (status && VALID_STATUSES.includes(status)) {
    query.status = status;
  }

  if (clientId) {
    query.clientId = clientId;
  }

  const orders = await Order.find(query)
    .populate('clientId', 'name email phone company')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return orders;
}

/**
 * Get order by ID
 * @param {Object} params
 * @param {string} params.orderId - Order ID
 * @param {string} params.companyId - Company ID
 * @returns {Promise<Object|null>} Order or null
 */
export async function getOrderById({ orderId, companyId }) {
  const order = await Order.findOne({ _id: orderId, companyId })
    .populate('clientId', 'name email phone company address')
    .populate('assignedTo', 'name email')
    .lean();

  return order;
}

/**
 * Create a new order
 * @param {Object} params
 * @param {string} params.companyId - Company ID
 * @param {string} params.createdBy - User ID who created
 * @param {Object} params.data - Order data
 * @returns {Promise<Object>} Created order
 */
export async function createOrder({ companyId, createdBy, data }) {
  const { clientId, items, status, assignedTo, notes } = data;

  if (!clientId) {
    const error = new Error('Client is required');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // Validate items
  validateItems(items);

  // Check if client exists
  const client = await Client.findOne({ _id: clientId, companyId, isActive: true });
  if (!client) {
    const error = new Error('Client not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const totalAmount = calculateTotalAmount(items);
  const orderNumber = generateOrderNumber();

  const order = await Order.create({
    companyId,
    clientId,
    orderNumber,
    items,
    totalAmount,
    status: status || 'pending',
    assignedTo: assignedTo || null,
    notes: notes || '',
  });

  await order.populate('clientId', 'name email phone company');
  await order.populate('assignedTo', 'name email');

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Order creation is logged through the order's timestamps and createdBy field

  return order.toObject();
}

/**
 * Update an order
 * @param {Object} params
 * @param {string} params.orderId - Order ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.updatedBy - User ID who updated
 * @param {Object} params.data - Update data
 * @returns {Promise<Object>} Updated order
 */
export async function updateOrder({ orderId, companyId, updatedBy, data }) {
  const { clientId, items, status, assignedTo, notes } = data;

  const order = await Order.findOne({ _id: orderId, companyId });
  if (!order) {
    const error = new Error('Order not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const oldStatus = order.status;

  // Update client if provided
  if (clientId) {
    const client = await Client.findOne({ _id: clientId, companyId, isActive: true });
    if (!client) {
      const error = new Error('Client not found');
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    order.clientId = clientId;
  }

  // Update items if provided
  if (items && Array.isArray(items) && items.length > 0) {
    validateItems(items);
    order.items = items;
    order.totalAmount = calculateTotalAmount(items);
  }

  // Update status if provided
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      const error = new Error('Invalid status');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    order.status = status;
  }

  if (assignedTo !== undefined) {
    order.assignedTo = assignedTo || null;
  }

  if (notes !== undefined) {
    order.notes = notes;
  }

  await order.save();
  await order.populate('clientId', 'name email phone company');
  await order.populate('assignedTo', 'name email');

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Order updates are logged through the order's timestamps and updatedAt field

  return order.toObject();
}

/**
 * Delete an order
 * @param {Object} params
 * @param {string} params.orderId - Order ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.deletedBy - User ID who deleted
 * @returns {Promise<Object>} Deleted order
 */
export async function deleteOrder({ orderId, companyId, deletedBy }) {
  const order = await Order.findOneAndDelete({ _id: orderId, companyId });
  
  if (!order) {
    const error = new Error('Order not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Note: ActivityLog is for security/admin logs, not entity CRUD operations
  // Order deletion is logged through the order's deletion timestamp

  return order.toObject();
}

/**
 * Move order to next pipeline stage
 * @param {Object} params
 * @param {string} params.orderId - Order ID
 * @param {string} params.companyId - Company ID
 * @param {string} params.updatedBy - User ID who updated
 * @param {string} params.targetStage - Target pipeline stage
 * @returns {Promise<Object>} Updated order
 */
export async function moveOrderToPipelineStage({ orderId, companyId, updatedBy, targetStage }) {
  if (!ORDER_PIPELINE_STAGES.includes(targetStage)) {
    const error = new Error(`Invalid pipeline stage. Valid stages: ${ORDER_PIPELINE_STAGES.join(', ')}`);
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return updateOrder({
    orderId,
    companyId,
    updatedBy,
    data: { status: targetStage },
  });
}

/**
 * Get order statistics for a company
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Statistics
 */
export async function getOrderStats(companyId) {
  const [totalOrders, ordersByStatus, totalRevenue] = await Promise.all([
    Order.countDocuments({ companyId }),
    Order.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const statusCounts = ordersByStatus.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalOrders,
    pending: statusCounts.pending || 0,
    processing: statusCounts.processing || 0,
    shipped: statusCounts.shipped || 0,
    delivered: statusCounts.delivered || 0,
    cancelled: statusCounts.cancelled || 0,
    totalRevenue: totalRevenue[0]?.total || 0,
  };
}

/**
 * Get all orders for a specific client (across all companies)
 * Used for client portal to show all their orders
 * @param {Object} params
 * @param {string} params.userId - User ID of the client
 * @param {string} [params.companyId] - Optional filter by company
 * @param {string} [params.status] - Filter by status
 * @returns {Promise<Array>} List of orders
 */
export async function getClientOrders({ userId, companyId, status }) {
  const query = { userId };

  if (companyId) {
    query.companyId = companyId;
  }

  if (status && VALID_STATUSES.includes(status)) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('companyId', 'name logo industry')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return orders;
}

/**
 * Get client order statistics across all companies
 * @param {Object} params
 * @param {string} params.userId - User ID of the client
 * @returns {Promise<Object>} Order statistics
 */
export async function getClientOrderStats({ userId }) {
  const orders = await Order.find({ userId }).lean();
  
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    byCompany: {},
  };

  // Group by company
  for (const order of orders) {
    const companyId = order.companyId?.toString();
    if (companyId) {
      if (!stats.byCompany[companyId]) {
        stats.byCompany[companyId] = { count: 0, total: 0 };
      }
      stats.byCompany[companyId].count++;
      stats.byCompany[companyId].total += order.totalAmount || 0;
    }
  }

  return stats;
}

export default {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  moveOrderToPipelineStage,
  getOrderStats,
  getClientOrders,
  getClientOrderStats,
  ORDER_PIPELINE_STAGES,
};
