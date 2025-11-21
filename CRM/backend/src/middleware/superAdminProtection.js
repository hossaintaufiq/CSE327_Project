import { isSuperAdminEmail } from '../config/superAdmin.js';

/**
 * Middleware to protect super admin routes
 * Ensures only the authorized super admin email can access
 */
export const protectSuperAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check if user has super_admin role
  if (user.globalRole !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }

  // Double-check: Verify email matches super admin email
  if (!isSuperAdminEmail(user.email)) {
    console.error(`SECURITY ALERT: User ${user.email} has super_admin role but email doesn't match authorized email`);
    return res.status(403).json({ message: 'Unauthorized super admin access' });
  }

  next();
};

