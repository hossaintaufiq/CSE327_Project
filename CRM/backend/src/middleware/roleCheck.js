export const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    const userRole = req.companyRole || req.user?.globalRole;
    
    // Super Admin bypasses all role checks
    if (req.user?.globalRole === 'super_admin') {
      return next();
    }

    // Check if user has required role for the company
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${requiredRoles.join(' or ')}` 
      });
    }

    next();
  };
};

export const superAdminOnly = (req, res, next) => {
  if (req.user?.globalRole !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin access required' });
  }
  next();
};

export const companyAdminOnly = checkRole(['company_admin']);
export const managerOnly = checkRole(['company_admin', 'manager']);
export const employeeOnly = checkRole(['company_admin', 'manager', 'employee']);
export const clientOnly = checkRole(['client']);
