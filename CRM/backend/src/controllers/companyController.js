import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';

export const createCompany = async (req, res) => {
  try {
    const { name, domain } = req.body;
    const user = req.user;

    if (!name) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // Check if company name already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company name already exists' });
    }

    // Create company
    const company = await Company.create({
      name,
      domain,
      adminId: user._id,
    });

    // Add user as company_admin to the company
    if (!user.companies) {
      user.companies = [];
    }
    
    user.companies.push({
      companyId: company._id,
      role: 'company_admin',
      joinedAt: new Date(),
      isActive: true,
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company: {
          id: company._id,
          name: company.name,
          domain: company.domain,
          adminId: company.adminId,
        },
      },
    });
  } catch (error) {
    console.error('Create company error:', error);
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ message: 'Company name already exists' });
    }
    res.status(500).json({ message: 'Error creating company: ' + error.message });
  }
};

export const joinCompany = async (req, res) => {
  try {
    const { companyName, role } = req.body;
    const user = req.user;

    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    if (!['manager', 'employee', 'client'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be manager, employee, or client' });
    }

    // Find company by name
    const company = await Company.findOne({ name: companyName, isActive: true });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if user is already a member
    const existingMembership = user.companies?.find(
      (c) => c.companyId?.toString() === company._id.toString()
    );

    if (existingMembership) {
      // Check if membership is pending
      if (existingMembership.status === 'pending') {
        return res.status(400).json({ message: 'Your join request is pending approval' });
      }
      return res.status(400).json({ message: 'You are already a member of this company' });
    }

    // Add company membership
    if (!user.companies) {
      user.companies = [];
    }

    // Clients are auto-approved, employees/managers need approval
    const needsApproval = role === 'manager' || role === 'employee';
    
    user.companies.push({
      companyId: company._id,
      role,
      joinedAt: new Date(),
      isActive: !needsApproval, // Inactive until approved for employees/managers
      status: needsApproval ? 'pending' : 'approved',
    });
    await user.save();

    // Import notification service for company admin notification
    try {
      const { createNotification } = await import('../services/notificationService.js');
      const { User } = await import('../models/User.js');
      
      // Find company admins to notify
      const admins = await User.find({
        'companies.companyId': company._id,
        'companies.role': 'company_admin',
        'companies.isActive': true,
      }).select('_id');

      // Send notification to each admin
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          companyId: company._id,
          type: 'general',
          title: needsApproval ? 'New Join Request' : 'New Client Joined',
          message: needsApproval 
            ? `${user.name || user.email} requested to join as ${role}. Approval required.`
            : `${user.name || user.email} joined the company as a client.`,
          priority: needsApproval ? 'high' : 'medium',
          metadata: {
            userId: user._id,
            userName: user.name || user.email,
            requestedRole: role,
            needsApproval,
          },
        });
      }
    } catch (notifError) {
      console.error('Error sending join notification:', notifError);
    }

    res.json({
      success: true,
      message: needsApproval 
        ? 'Join request submitted. Waiting for admin approval.' 
        : 'Successfully joined company',
      data: {
        company: {
          id: company._id,
          name: company.name,
          domain: company.domain,
        },
        role,
        status: needsApproval ? 'pending' : 'approved',
      },
    });
  } catch (error) {
    console.error('Join company error:', error);
    res.status(500).json({ message: 'Error joining company: ' + error.message });
  }
};

export const listMyCompanies = async (req, res) => {
  try {
    const user = req.user;
    
    await user.populate('companies.companyId');

    const companies = user.companies
      .filter((c) => c.isActive && c.companyId)
      .map((c) => ({
        id: c.companyId._id,
        name: c.companyId.name,
        domain: c.companyId.domain,
        role: c.role,
        joinedAt: c.joinedAt,
      }));

    res.json({
      success: true,
      data: { companies },
    });
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
};

export const getCompanyMembers = async (req, res) => {
  try {
    const { companyId } = req;
    
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Find all users who are members of this company (both active and pending)
    const users = await User.find({
      'companies.companyId': new mongoose.Types.ObjectId(companyId),
      isActive: true,
    }).select('name email companies').lean();

    // Process results to extract membership info
    const members = users.map((user) => {
      // Find the specific membership for this company
      const membership = user.companies.find((c) => {
        const cId = c.companyId?._id || c.companyId;
        const normalizedCId = cId?.toString();
        const normalizedCompanyId = companyId.toString();
        return normalizedCId === normalizedCompanyId;
      });

      return {
        userId: user._id,
        name: user.name || 'No Name',
        email: user.email,
        role: membership?.role || 'unknown',
        joinedAt: membership?.joinedAt || null,
        status: membership?.status || 'approved',
        isActive: membership?.isActive || false,
      };
    });

    res.json({
      success: true,
      data: { members },
    });
  } catch (error) {
    console.error('Get company members error:', error);
    res.status(500).json({ message: 'Error fetching company members', error: error.message });
  }
};

// Get pending join requests for company admin
export const getPendingJoinRequests = async (req, res) => {
  try {
    const { companyId, companyRole } = req;
    
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Only company admin can view pending requests
    if (companyRole !== 'company_admin') {
      return res.status(403).json({ message: 'Only company admin can view pending requests' });
    }

    // Find users with pending membership for this company
    const users = await User.find({
      'companies.companyId': new mongoose.Types.ObjectId(companyId),
      'companies.status': 'pending',
      isActive: true,
    }).select('name email companies').lean();

    const pendingRequests = users.map((user) => {
      const membership = user.companies.find((c) => {
        const cId = c.companyId?._id || c.companyId;
        return cId?.toString() === companyId.toString() && c.status === 'pending';
      });

      return {
        userId: user._id,
        name: user.name || 'No Name',
        email: user.email,
        requestedRole: membership?.role || 'unknown',
        requestedAt: membership?.joinedAt || null,
      };
    });

    res.json({
      success: true,
      data: { pendingRequests },
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Error fetching pending requests', error: error.message });
  }
};

// Approve or reject join request
export const handleJoinRequest = async (req, res) => {
  try {
    const { companyId, companyRole } = req;
    const { userId, action } = req.body; // action: 'approve' or 'reject'
    
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Only company admin can handle join requests
    if (companyRole !== 'company_admin') {
      return res.status(403).json({ message: 'Only company admin can approve/reject join requests' });
    }

    if (!userId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'User ID and valid action (approve/reject) are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const membershipIndex = user.companies.findIndex((c) => {
      const cId = c.companyId?._id || c.companyId;
      return cId?.toString() === companyId.toString() && c.status === 'pending';
    });

    if (membershipIndex === -1) {
      return res.status(404).json({ message: 'No pending request found for this user' });
    }

    if (action === 'approve') {
      user.companies[membershipIndex].status = 'approved';
      user.companies[membershipIndex].isActive = true;
    } else {
      user.companies[membershipIndex].status = 'rejected';
      user.companies[membershipIndex].isActive = false;
    }

    await user.save();

    // Send notification to user about approval/rejection
    try {
      const { createNotification } = await import('../services/notificationService.js');
      const company = await Company.findById(companyId);
      
      await createNotification({
        userId: user._id,
        companyId,
        type: 'general',
        title: action === 'approve' ? 'Join Request Approved' : 'Join Request Rejected',
        message: action === 'approve' 
          ? `Your request to join ${company?.name || 'the company'} has been approved!`
          : `Your request to join ${company?.name || 'the company'} has been rejected.`,
        priority: 'high',
        metadata: {
          companyName: company?.name,
          action,
        },
      });
    } catch (notifError) {
      console.error('Error sending approval notification:', notifError);
    }

    res.json({
      success: true,
      message: action === 'approve' ? 'Join request approved' : 'Join request rejected',
      data: {
        userId,
        status: user.companies[membershipIndex].status,
      },
    });
  } catch (error) {
    console.error('Handle join request error:', error);
    res.status(500).json({ message: 'Error handling join request', error: error.message });
  }
};

