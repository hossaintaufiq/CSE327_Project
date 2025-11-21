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
      return res.status(400).json({ message: 'You are already a member of this company' });
    }

    // Add company membership (auto-approve for now, can add approval workflow later)
    if (!user.companies) {
      user.companies = [];
    }

    user.companies.push({
      companyId: company._id,
      role,
      joinedAt: new Date(),
      isActive: true,
    });
    await user.save();

    res.json({
      success: true,
      message: 'Successfully joined company',
      data: {
        company: {
          id: company._id,
          name: company.name,
          domain: company.domain,
        },
        role,
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

    // Find all users who are members of this company
    // Use find with proper query for nested array matching
    const users = await User.find({
      'companies.companyId': new mongoose.Types.ObjectId(companyId),
      'companies.isActive': true,
      isActive: true,
    }).select('name email companies').lean();

    // Process results to extract membership info
    const members = users.map((user) => {
      // Find the specific membership for this company
      const membership = user.companies.find((c) => {
        // Handle both ObjectId and string formats
        const cId = c.companyId?._id || c.companyId;
        const normalizedCId = cId?.toString();
        const normalizedCompanyId = companyId.toString();
        return normalizedCId === normalizedCompanyId && c.isActive;
      });

      return {
        userId: user._id,
        name: user.name || 'No Name',
        email: user.email,
        role: membership?.role || 'unknown',
        joinedAt: membership?.joinedAt || null,
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

