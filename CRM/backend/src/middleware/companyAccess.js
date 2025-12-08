import { User } from '../models/User.js';

export const verifyCompanyAccess = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Super Admin has access to all companies
    if (user.globalRole === 'super_admin') {
      req.companyId = req.headers['x-company-id'] || req.query.companyId || null;
      req.companyRole = 'super_admin';
      return next();
    }

    // Clients can access with company context without membership check
    if (user.globalRole === 'client') {
      const clientCompanyId = req.headers['x-company-id'] || req.query.companyId;
      if (!clientCompanyId) {
        return res.status(400).json({ message: 'X-Company-Id header or companyId query param is required' });
      }
      req.companyId = clientCompanyId;
      req.companyRole = 'client';
      return next();
    }

    // Get requested company ID from header or query
    const requestedCompanyId = req.headers['x-company-id'] || req.query.companyId;
    
    if (!requestedCompanyId) {
      return res.status(400).json({ message: 'X-Company-Id header or companyId query param is required' });
    }

    // Check if user has any companies
    if (!user.companies || user.companies.length === 0) {
      return res.status(403).json({ 
        message: 'Access denied. You are not a member of any company. Please join a company first.' 
      });
    }

    // Find user's membership in the requested company
    // Handle both populated (object) and unpopulated (ID) companyId
    const membership = user.companies.find((c) => {
      if (!c.isActive) return false;
      
      // Normalize companyId for comparison
      let companyIdToCompare = null;
      
      // If companyId is populated (object), get _id
      if (c.companyId && typeof c.companyId === 'object') {
        companyIdToCompare = c.companyId._id?.toString() || c.companyId.toString();
      } else {
        // If companyId is just an ID (string/ObjectId)
        companyIdToCompare = c.companyId?.toString();
      }
      
      // Compare with requested company ID (normalize both)
      const normalizedRequestedId = requestedCompanyId.toString().trim();
      return companyIdToCompare === normalizedRequestedId;
    });

    if (!membership) {
      // Add debug logging to help troubleshoot
      console.log('Company access denied:', {
        userId: user._id,
        userEmail: user.email,
        requestedCompanyId,
        userCompanies: user.companies?.map(c => ({
          companyId: c.companyId?._id || c.companyId,
          isActive: c.isActive,
          role: c.role
        }))
      });
      
      return res.status(403).json({ 
        message: 'Access denied. You are not a member of this company.',
        debug: process.env.NODE_ENV === 'development' ? {
          requestedCompanyId,
          userCompanies: user.companies?.map(c => ({
            companyId: c.companyId?._id?.toString() || c.companyId?.toString(),
            isActive: c.isActive
          }))
        } : undefined
      });
    }

    req.companyId = requestedCompanyId;
    req.companyRole = membership.role;
    next();
  } catch (error) {
    console.error('Company access verification error:', error.message);
    return res.status(500).json({ message: 'Error verifying company access' });
  }
};
