import * as orderService from '../services/orderService.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/responseHelper.js';

/**
 * Get all orders for a company
 * Controller is now thin - delegates to orderService
 */
export const getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrders({
      companyId: req.companyId,
      userId: req.user._id,
      role: req.companyRole,
    });
    return successResponse(res, { orders });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById({
      orderId: req.params.orderId,
      companyId: req.companyId,
    });

    if (!order) {
      return notFoundResponse(res, 'Order not found');
    }

    // Employees can only see orders assigned to them
    if (req.companyRole === 'employee' && order.assignedTo?._id?.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'ACCESS_DENIED', 'Access denied', 403);
    }

    return successResponse(res, { order });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new order
 */
export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder({
      companyId: req.companyId,
      createdBy: req.user._id,
      data: req.body,
    });

    return successResponse(res, { order }, 201, 'Order created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update an order
 */
export const updateOrder = async (req, res, next) => {
  try {
    // Only company admin and manager can update orders
    if (req.companyRole !== 'company_admin' && req.companyRole !== 'manager') {
      return errorResponse(res, 'ACCESS_DENIED', 'Access denied. Only admins and managers can update orders.', 403);
    }

    const order = await orderService.updateOrder({
      orderId: req.params.orderId,
      companyId: req.companyId,
      updatedBy: req.user._id,
      data: req.body,
    });

    return successResponse(res, { order }, 200, 'Order updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an order
 */
export const deleteOrder = async (req, res, next) => {
  try {
    // Only company admin can delete orders
    if (req.companyRole !== 'company_admin') {
      return errorResponse(res, 'ACCESS_DENIED', 'Access denied. Only company admin can delete orders.', 403);
    }

    await orderService.deleteOrder({
      orderId: req.params.orderId,
      companyId: req.companyId,
      deletedBy: req.user._id,
    });

    return successResponse(res, null, 200, 'Order deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a Jira issue linked to an order
 */
export const createJiraIssueForOrder = async (req, res, next) => {
  try {
    const result = await orderService.createJiraIssueForOrder({
      orderId: req.params.orderId,
      companyId: req.companyId,
      data: req.body,
    });

    return successResponse(res, result, 200, 'Jira issue created and linked to order');
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Only company admin and manager can update order status
    if (req.companyRole !== 'company_admin' && req.companyRole !== 'manager') {
      return errorResponse(res, 'ACCESS_DENIED', 'Access denied. Only admins and managers can update order status.', 403);
    }

    const order = await orderService.updateOrderStatus({
      orderId: req.params.orderId,
      companyId: req.companyId,
      updatedBy: req.user._id,
      status,
    });

    return successResponse(res, { order }, 200, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders for a client (across all companies)
 * Used for client portal multi-company view
 */
export const getClientOrders = async (req, res, next) => {
  try {
    const { companyId, status } = req.query;
    
    const orders = await orderService.getClientOrders({
      userId: req.user._id,
      companyId,
      status,
    });
    
    return successResponse(res, { orders });
  } catch (error) {
    next(error);
  }
};

/**
 * Get client order statistics
 */
export const getClientOrderStats = async (req, res, next) => {
  try {
    const stats = await orderService.getClientOrderStats({
      userId: req.user._id,
    });
    
    return successResponse(res, { stats });
  } catch (error) {
    next(error);
  }
};