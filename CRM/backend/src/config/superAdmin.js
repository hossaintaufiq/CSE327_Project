/**
 * Super Admin Configuration
 * Only this email can have super admin access
 */
export const SUPER_ADMIN_EMAIL = 'hossainahmmedtaufiq22@gmail.com';

/**
 * Check if an email is the super admin email
 * @param {string} email - Email to check
 * @returns {boolean} - True if email matches super admin email
 */
export const isSuperAdminEmail = (email) => {
  if (!email) {
    console.log('❌ isSuperAdminEmail: No email provided');
    return false;
  }
  // Case-insensitive comparison and trim whitespace
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedSuperAdmin = SUPER_ADMIN_EMAIL.toLowerCase();
  const isMatch = normalizedEmail === normalizedSuperAdmin;
  
  console.log('🔍 Email comparison:', {
    provided: email,
    normalized: normalizedEmail,
    superAdmin: normalizedSuperAdmin,
    match: isMatch,
  });
  
  return isMatch;
};

/**
 * Validate that only the super admin email can have super_admin role
 * @param {string} email - User email
 * @param {string} requestedRole - Role being requested
 * @returns {boolean} - True if role assignment is valid
 */
export const validateSuperAdminRole = (email, requestedRole) => {
  // If requesting super_admin role, must be the super admin email
  if (requestedRole === 'super_admin') {
    return isSuperAdminEmail(email);
  }
  // Any other role is fine
  return true;
};

