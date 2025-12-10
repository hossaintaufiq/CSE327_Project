import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { SUPER_ADMIN_EMAIL, isSuperAdminEmail } from '../config/superAdmin.js';

export const fixSuperAdmin = async (req, res) => {
  try {
    const superAdminEmail = SUPER_ADMIN_EMAIL;
    
    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${superAdminEmail}$`, 'i') }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Super admin user not found. Please sign up first.' 
      });
    }

    // Update to super admin using direct MongoDB update to bypass hooks if needed
    await User.updateOne(
      { _id: user._id },
      { $set: { globalRole: 'super_admin' } }
    );

    // Fetch updated user
    const updatedUser = await User.findById(user._id);

    res.json({
      success: true,
      message: 'Super admin role updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          globalRole: updatedUser.globalRole,
        },
      },
    });
  } catch (error) {
    console.error('❌ Fix super admin error:', error);
    res.status(500).json({ message: 'Error updating super admin role: ' + error.message });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        companies: companies.map((c) => ({
          id: c._id,
          name: c.name,
          domain: c.domain,
          admin: {
            id: c.adminId?._id,
            name: c.adminId?.name,
            email: c.adminId?.email,
          },
          createdAt: c.createdAt,
          memberCount: 0, // Can be calculated separately
        })),
      },
    });
  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
};

export const getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const company = await Company.findById(companyId).populate('adminId', 'name email');
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get all members
    const members = await User.find({
      'companies.companyId': companyId,
      'companies.isActive': true,
    }).select('name email companies');

    const memberList = members.map((user) => {
      const membership = user.companies.find(
        (c) => c.companyId?.toString() === companyId.toString()
      );
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: membership?.role,
        joinedAt: membership?.joinedAt,
      };
    });

    res.json({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          domain: company.domain,
          admin: {
            id: company.adminId?._id,
            name: company.adminId?.name,
            email: company.adminId?.email,
          },
          members: memberList,
          createdAt: company.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get company details error:', error);
    res.status(500).json({ message: 'Error fetching company details' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .populate('companies.companyId', 'name')
      .select('-firebaseUid')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          globalRole: u.globalRole,
          companies: u.companies.map((c) => ({
            companyId: c.companyId?._id || c.companyId,
            companyName: c.companyId?.name,
            role: c.role,
            joinedAt: c.joinedAt,
          })),
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive !== undefined ? isActive : user.isActive;
    await user.save();

    res.json({
      success: true,
      message: 'User status updated',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
};

export const updateCompanyStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { isActive } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.isActive = isActive !== undefined ? isActive : company.isActive;
    await company.save();

    res.json({
      success: true,
      message: 'Company status updated',
      data: {
        company: {
          id: company._id,
          name: company.name,
          isActive: company.isActive,
        },
      },
    });
  } catch (error) {
    console.error('Update company status error:', error);
    res.status(500).json({ message: 'Error updating company status' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Soft delete - set isActive to false
    company.isActive = false;
    await company.save();

    // Remove company from all users' memberships
    await User.updateMany(
      { 'companies.companyId': companyId },
      { $set: { 'companies.$.isActive': false } }
    );

    res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Error deleting company' });
  }
};
