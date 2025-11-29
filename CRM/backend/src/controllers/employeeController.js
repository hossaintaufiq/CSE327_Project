import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

/**
 * Get employee profile details with statistics
 */
export const getEmployeeProfile = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.companyId;
    const userRole = req.companyRole;

    // Only company admin and manager can view employee profiles
    if (userRole !== 'company_admin' && userRole !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Only admins and managers can view employee profiles.' });
    }

    // Find the employee user
    const employee = await User.findById(employeeId).lean();
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee is a member of the company
    const membership = employee.companies?.find((c) => {
      const cId = c.companyId?._id || c.companyId;
      return cId?.toString() === companyId.toString() && c.isActive;
    });

    if (!membership) {
      return res.status(403).json({ message: 'Employee is not a member of this company' });
    }

    // Get statistics for this employee in this company
    const assignedLeads = await Client.countDocuments({
      companyId,
      assignedTo: employeeId,
      isActive: true,
    });

    const assignedOrders = await Order.countDocuments({
      companyId,
      assignedTo: employeeId,
    });

    const sentMessages = await Message.countDocuments({
      companyId,
      senderId: employeeId,
    });

    const receivedMessages = await Message.countDocuments({
      companyId,
      recipientId: employeeId,
    });

    // Get recent activity (last 5 leads assigned)
    const recentLeads = await Client.find({
      companyId,
      assignedTo: employeeId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email status createdAt')
      .lean();

    // Get recent orders
    const recentOrders = await Order.find({
      companyId,
      assignedTo: employeeId,
    })
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalAmount status createdAt clientId')
      .lean();

    res.json({
      success: true,
      data: {
        employee: {
          userId: employee._id,
          name: employee.name || 'No Name',
          email: employee.email,
          globalRole: employee.globalRole,
          isActive: employee.isActive,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
          membership: {
            role: membership.role,
            joinedAt: membership.joinedAt,
            isActive: membership.isActive,
          },
        },
        statistics: {
          assignedLeads,
          assignedOrders,
          sentMessages,
          receivedMessages,
          totalMessages: sentMessages + receivedMessages,
        },
        recentLeads,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({ message: 'Error fetching employee profile', error: error.message });
  }
};

/**
 * Search employees in a company
 */
export const searchEmployees = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { q = '' } = req.query;

    // Find all users that are members of this company
    const users = await User.find({
      'companies.companyId': companyId,
      'companies.isActive': true,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('_id name email avatar globalRole companies')
      .limit(20)
      .lean();

    // Format the response
    const employees = users.map(user => {
      const membership = user.companies?.find(c => 
        c.companyId?.toString() === companyId.toString()
      );
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: membership?.role || 'employee',
      };
    });

    res.json({
      success: true,
      data: { employees },
    });
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ message: 'Error searching employees', error: error.message });
  }
};

/**
 * Get all employees in a company
 */
export const getEmployees = async (req, res) => {
  try {
    const companyId = req.companyId;

    // Find all users that are members of this company
    const users = await User.find({
      'companies.companyId': companyId,
      'companies.isActive': true,
      isActive: true,
    })
      .select('_id name email avatar globalRole companies')
      .lean();

    // Format the response
    const employees = users.map(user => {
      const membership = user.companies?.find(c => 
        c.companyId?.toString() === companyId.toString()
      );
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: membership?.role || 'employee',
      };
    });

    res.json({
      success: true,
      data: { employees },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
};

