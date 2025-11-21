import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';

/**
 * Get company profile details
 */
export const getCompanyProfile = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userRole = req.companyRole;

    // Only company admin can view full profile
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can view company profile.' });
    }

    const company = await Company.findById(companyId)
      .populate('adminId', 'name email')
      .lean();

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get company statistics
    const totalMembers = await User.countDocuments({
      'companies.companyId': companyId,
      'companies.isActive': true,
      isActive: true,
    });

    const totalClients = await Client.countDocuments({
      companyId,
      isActive: true,
    });

    const totalOrders = await Order.countDocuments({ companyId });

    const totalProjects = await Project.countDocuments({
      companyId,
      isActive: true,
    });

    const totalTasks = await Task.countDocuments({
      companyId,
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          domain: company.domain || '',
          adminId: company.adminId?._id,
          adminName: company.adminId?.name || company.adminId?.email,
          isActive: company.isActive,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        },
        statistics: {
          totalMembers,
          totalClients,
          totalOrders,
          totalProjects,
          totalTasks,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ message: 'Error fetching company profile', error: error.message });
  }
};

/**
 * Update company profile
 */
export const updateCompanyProfile = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userRole = req.companyRole;
    const { name, domain } = req.body;

    // Only company admin can update profile
    if (userRole !== 'company_admin') {
      return res.status(403).json({ message: 'Access denied. Only company admin can update company profile.' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== company.name) {
      const existingCompany = await Company.findOne({ name, _id: { $ne: companyId } });
      if (existingCompany) {
        return res.status(400).json({ message: 'Company name already exists' });
      }
      company.name = name;
    }

    if (domain !== undefined) {
      company.domain = domain || '';
    }

    await company.save();

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: {
        company: {
          id: company._id,
          name: company.name,
          domain: company.domain || '',
          adminId: company.adminId,
          isActive: company.isActive,
        },
      },
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ message: 'Company name already exists' });
    }
    res.status(500).json({ message: 'Error updating company profile', error: error.message });
  }
};

