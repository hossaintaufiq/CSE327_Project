import express from 'express';
import { isSuperAdminEmail, SUPER_ADMIN_EMAIL } from '../config/superAdmin.js';

const router = express.Router();

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

  res.json({
    superAdminEmail: SUPER_ADMIN_EMAIL,
    testResults: results,
  });
});

export default router;

