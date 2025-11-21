import mongoose from 'mongoose';
import { User } from '../models/User.js';

/**
 * Get all roles and permissions for the company
 */
export const getRolesAndPermissions = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userRole = req.companyRole;

    // Only company admin can view roles and permissions
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can view roles and permissions.' });
    }

    // Get all members of the company with their roles
    const users = await User.find({
      'companies.companyId': companyId,
      'companies.isActive': true,
      isActive: true,
    })
      .select('name email companies')
      .lean();

    const members = users.map((user) => {
      const membership = user.companies.find(
        (c) => c.companyId?.toString() === companyId.toString() && c.isActive
      );

      return {
        userId: user._id,
        name: user.name || 'No Name',
        email: user.email,
        role: membership?.role || 'unknown',
        joinedAt: membership?.joinedAt || null,
      };
    });

    // Define role permissions
    const rolePermissions = {
      company_admin: {
        name: 'Company Admin',
        description: 'Full access to all company features',
        permissions: {
          manageCompany: true,
          manageEmployees: true,
          manageLeads: true,
          manageOrders: true,
          manageProjects: true,
          manageTasks: true,
          manageRoles: true,
          viewReports: true,
          deleteData: true,
        },
      },
      manager: {
        name: 'Manager',
        description: 'Can manage employees, leads, orders, and projects',
        permissions: {
          manageCompany: false,
          manageEmployees: true,
          manageLeads: true,
          manageOrders: true,
          manageProjects: true,
          manageTasks: true,
          manageRoles: false,
          viewReports: true,
          deleteData: false,
        },
      },
      employee: {
        name: 'Employee',
        description: 'Can view and manage assigned leads, orders, and tasks',
        permissions: {
          manageCompany: false,
          manageEmployees: false,
          manageLeads: true, // Only assigned
          manageOrders: true, // Only assigned
          manageProjects: false,
          manageTasks: true, // Only assigned
          manageRoles: false,
          viewReports: false,
          deleteData: false,
        },
      },
      client: {
        name: 'Client',
        description: 'Can view own orders and send messages',
        permissions: {
          manageCompany: false,
          manageEmployees: false,
          manageLeads: false,
          manageOrders: false, // View own only
          manageProjects: false,
          manageTasks: false,
          manageRoles: false,
          viewReports: false,
          deleteData: false,
        },
      },
    };

    res.json({
      success: true,
      data: {
        members,
        rolePermissions,
      },
    });
  } catch (error) {
    console.error('Error fetching roles and permissions:', error);
    res.status(500).json({ message: 'Error fetching roles and permissions', error: error.message });
  }
};

/**
 * Update user role in company
 */
export const updateUserRole = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userRole = req.companyRole;
    const { userId } = req.params;
    const { role } = req.body;

    // Only company admin can update roles
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can update roles.' });
    }

    if (!role || !['company_admin', 'manager', 'employee', 'client'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent changing own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and update the membership
    const membershipIndex = user.companies.findIndex(
      (c) => c.companyId?.toString() === companyId.toString() && c.isActive
    );

    if (membershipIndex === -1) {
      return res.status(404).json({ message: 'User is not a member of this company' });
    }

    user.companies[membershipIndex].role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: role,
        },
      },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

/**
 * Remove user from company
 */
export const removeUserFromCompany = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userRole = req.companyRole;
    const { userId } = req.params;

    // Only company admin can remove users
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can remove users.' });
    }

    // Prevent removing yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot remove yourself from the company' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and deactivate the membership
    const membershipIndex = user.companies.findIndex(
      (c) => c.companyId?.toString() === companyId.toString() && c.isActive
    );

    if (membershipIndex === -1) {
      return res.status(404).json({ message: 'User is not a member of this company' });
    }

    user.companies[membershipIndex].isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User removed from company successfully',
    });
  } catch (error) {
    console.error('Error removing user from company:', error);
    res.status(500).json({ message: 'Error removing user from company', error: error.message });
  }
};

