import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';
import { createIssue } from '../jiraClient.js';
import { createNotificationForStatusChange } from '../services/notificationService.js';

/**
 * Get all orders for a company
 */
export const getOrders = async (req, res) => {
  try {
    const companyId = req.companyId;
    const user = req.user;
    const userRole = req.companyRole;

    let query = { companyId };

    // Employees can only see orders assigned to them
    if (userRole === 'employee') {
      query.assignedTo = user._id;
    }

    const orders = await Order.find(query)
      .populate('clientId', 'name email phone company')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { orders },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const companyId = req.companyId;
    const user = req.user;
    const userRole = req.companyRole;

    const order = await Order.findOne({ _id: orderId, companyId })
      .populate('clientId', 'name email phone company address')
      .populate('assignedTo', 'name email')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Employees can only see orders assigned to them
    if (userRole === 'employee' && order.assignedTo?._id?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

/**
 * Create a new order
 */
export const createOrder = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { clientId, items, status, assignedTo, notes } = req.body;

    // Validate required fields
    if (!clientId) {
      return res.status(400).json({ message: 'Client is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Validate items
    for (const item of items) {
      if (!item.productName || !item.quantity || item.price === undefined) {
        return res.status(400).json({ message: 'Each item must have productName, quantity, and price' });
      }
      if (item.quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }
      if (item.price < 0) {
        return res.status(400).json({ message: 'Price cannot be negative' });
      }
    }

    // Check if client exists and belongs to the company
    const client = await Client.findOne({ _id: clientId, companyId, isActive: true });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
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

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

/**
 * Update an order
 */
export const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const companyId = req.companyId;
    const userRole = req.companyRole;
    const { clientId, items, status, assignedTo, notes } = req.body;

    // Find order
    const order = await Order.findOne({ _id: orderId, companyId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only company admin and manager can update orders
    if (userRole !== 'company_admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Only admins and managers can update orders.' });
    }

    // Update fields
    if (clientId) {
      const client = await Client.findOne({ _id: clientId, companyId, isActive: true });
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      order.clientId = clientId;
    }

    if (items && Array.isArray(items) && items.length > 0) {
      // Validate items
      for (const item of items) {
        if (!item.productName || !item.quantity || item.price === undefined) {
          return res.status(400).json({ message: 'Each item must have productName, quantity, and price' });
        }
        if (item.quantity < 1) {
          return res.status(400).json({ message: 'Quantity must be at least 1' });
        }
        if (item.price < 0) {
          return res.status(400).json({ message: 'Price cannot be negative' });
        }
      }
      order.items = items;
      // Recalculate total amount
      order.totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    }

    if (status) {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
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

    // Sync with Jira if status changed or other important fields updated
    try {
      const oldStatus = order.status; // Store old status before potential change
      const statusChanged = status !== undefined && status !== order.status;
      const importantFieldsChanged = items !== undefined || notes !== undefined;

      if (statusChanged) {
        await syncStatusToJira('order', order, order.status);
        // Create notification for manual status change
        await createNotificationForStatusChange('order', order, order.status);
      }

      if (importantFieldsChanged) {
        await updateJiraIssue('order', order);
      }
    } catch (syncError) {
      console.error('Error syncing order to Jira:', syncError);
      // Don't fail the update if sync fails, just log it
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: { order },
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
};

/**
 * Delete an order
 */
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const companyId = req.companyId;
    const userRole = req.companyRole;

    // Only company admin can delete orders
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can delete orders.' });
    }

    // Clean up Jira references before deleting the order
    try {
      await cleanupJiraReferencesOnEntityDeletion('order', orderId);
    } catch (cleanupError) {
      console.error('Error cleaning up Jira references:', cleanupError);
      // Don't fail the deletion if cleanup fails
    }

    const order = await Order.findOneAndDelete({ _id: orderId, companyId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};

/**
 * Create a Jira issue linked to an order
 */
export const createJiraIssueForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const companyId = req.companyId;
    const { summary, description, issuetype = 'Bug' } = req.body;

    // Find the order
    const order = await Order.findOne({ _id: orderId, companyId }).populate('clientId', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create Jira issue
    const jiraIssueData = {
      summary: summary || `Order Issue: ${order.orderNumber}`,
      description: description || `Order: ${order.orderNumber}\nClient: ${order.clientId?.name || 'N/A'}\nStatus: ${order.status}\nIssue: ${description || 'Order problem'}`,
      issuetype,
    };

    const jiraIssue = await createIssue(jiraIssueData);

    // Link Jira issue to order
    const jiraIssueLink = {
      issueKey: jiraIssue.key,
      issueUrl: `${process.env.JIRA_BASE_URL}/browse/${jiraIssue.key}`,
      createdAt: new Date(),
    };

    order.jiraIssues.push(jiraIssueLink);
    await order.save();

    res.json({
      success: true,
      message: 'Jira issue created and linked to order',
      data: {
        jiraIssue,
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          jiraIssues: order.jiraIssues,
        },
      },
    });
  } catch (error) {
    console.error('Error creating Jira issue for order:', error);
    res.status(500).json({ message: 'Error creating Jira issue', error: error.message });
  }
};

