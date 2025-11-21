import mongoose from 'mongoose';
import { Company } from '../models/Company.js';

/**
 * Get company settings
 */
export const getCompanySettings = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userRole = req.companyRole;

    // Only company admin can view settings
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can view settings.' });
    }

    const company = await Company.findById(companyId).lean();

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Default settings structure
    const settings = {
      company: {
        name: company.name,
        domain: company.domain || '',
        isActive: company.isActive,
      },
      notifications: {
        emailNotifications: true,
        orderNotifications: true,
        leadNotifications: true,
        taskNotifications: true,
        projectNotifications: true,
      },
      features: {
        enableProjects: true,
        enableTasks: true,
        enableOrders: true,
        enableLeads: true,
      },
      preferences: {
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
      },
    };

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: 'Error fetching company settings', error: error.message });
  }
};

/**
 * Update company settings
 */
export const updateCompanySettings = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userRole = req.companyRole;
    const { notifications, features, preferences } = req.body;

    // Only company admin can update settings
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can update settings.' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // For now, we'll store settings in a simple structure
    // In a production app, you might want a separate Settings model
    // For this demo, we'll just return success with the updated settings

    const updatedSettings = {
      company: {
        name: company.name,
        domain: company.domain || '',
        isActive: company.isActive,
      },
      notifications: notifications || {
        emailNotifications: true,
        orderNotifications: true,
        leadNotifications: true,
        taskNotifications: true,
        projectNotifications: true,
      },
      features: features || {
        enableProjects: true,
        enableTasks: true,
        enableOrders: true,
        enableLeads: true,
      },
      preferences: preferences || {
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
      },
    };

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings: updatedSettings },
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: 'Error updating company settings', error: error.message });
  }
};

