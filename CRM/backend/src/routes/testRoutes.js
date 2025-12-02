import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { superAdminOnly } from '../middleware/roleCheck.js';
import { protectSuperAdmin } from '../middleware/superAdminProtection.js';
import { isSuperAdminEmail, SUPER_ADMIN_EMAIL } from '../config/superAdmin.js';

const router = express.Router();

// SECURITY: All test routes require super admin authentication
// Only available in non-production environments
if (process.env.NODE_ENV !== 'production') {
  router.use(verifyFirebaseToken);
  router.use(superAdminOnly);
  router.use(protectSuperAdmin);

  // Test endpoint to verify super admin email check
  router.get('/test-super-admin-check', (req, res) => {
    const testEmails = [
      'hossainahmmedtaufiq22@gmail.com',
      'Hossainahmmedtaufiq22@gmail.com',
      'HOSSAINAHMMEDTAUFIQ22@GMAIL.COM',
      'hossainahmmedtaufiq22@gmail.com ',
      ' hossainahmmedtaufiq22@gmail.com',
      'other@email.com',
    ];

    const results = testEmails.map((email) => ({
      email,
      isSuperAdmin: isSuperAdminEmail(email),
      expected: email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
    }));

    // Only show masked email for security
    const maskedEmail = SUPER_ADMIN_EMAIL.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    res.json({
      superAdminEmail: maskedEmail,
      testResults: results.map(r => ({ ...r, email: r.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') })),
    });
  });
} else {
  // In production, return 404 for all test routes
  router.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

export default router;

