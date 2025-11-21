import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { superAdminOnly } from '../middleware/roleCheck.js';
import { protectSuperAdmin } from '../middleware/superAdminProtection.js';
import {
  getAllCompanies,
  getCompanyDetails,
  getAllUsers,
  updateUserStatus,
  updateCompanyStatus,
  deleteCompany,
  fixSuperAdmin,
} from '../controllers/superAdminController.js';
import { getSuperAdminStats } from '../controllers/superAdminDashboardController.js';
import {
  getSubscriptions,
  getSubscriptionByCompany,
  upsertSubscription,
  cancelSubscription,
  getUpcomingRenewals,
  getFailedPayments,
} from '../controllers/subscriptionController.js';
import {
  getActivityLogs,
  getLoginHistory,
  getSuspiciousActivity,
} from '../controllers/activityLogController.js';
import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  getDisputes,
} from '../controllers/issueController.js';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import {
  getPlatformSettings,
  getSettingByKey,
  upsertSetting,
  bulkUpdateSettings,
} from '../controllers/platformSettingsController.js';
import {
  getFeatureToggles,
  getFeatureToggle,
  upsertFeatureToggle,
  toggleFeature,
} from '../controllers/featureToggleController.js';
import {
  getDatabaseStats,
  getApiHitRate,
} from '../controllers/databaseMonitorController.js';

const router = express.Router();

// Public route to fix super admin (no auth required for this specific case)
router.post('/fix-super-admin', fixSuperAdmin);

// Protected routes - double protection: verify token + check role + verify email
router.use(verifyFirebaseToken);
router.use(superAdminOnly);
router.use(protectSuperAdmin);

// Dashboard
router.get('/stats', getSuperAdminStats);

// Companies
router.get('/companies', getAllCompanies);
router.get('/companies/:companyId', getCompanyDetails);
router.patch('/companies/:companyId/status', updateCompanyStatus);
router.delete('/companies/:companyId', deleteCompany);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:userId/status', updateUserStatus);

// Subscriptions
router.get('/subscriptions', getSubscriptions);
router.get('/subscriptions/company/:companyId', getSubscriptionByCompany);
router.post('/subscriptions', upsertSubscription);
router.put('/subscriptions/:companyId', upsertSubscription);
router.patch('/subscriptions/:companyId/cancel', cancelSubscription);
router.get('/subscriptions/renewals', getUpcomingRenewals);
router.get('/subscriptions/failed-payments', getFailedPayments);

// Activity Logs
router.get('/activity-logs', getActivityLogs);
router.get('/activity-logs/login-history', getLoginHistory);
router.get('/activity-logs/suspicious', getSuspiciousActivity);

// Issues/Support
router.get('/issues', getIssues);
router.get('/issues/:issueId', getIssueById);
router.post('/issues', createIssue);
router.put('/issues/:issueId', updateIssue);
router.get('/issues/disputes', getDisputes);

// Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:announcementId', updateAnnouncement);
router.delete('/announcements/:announcementId', deleteAnnouncement);

// Platform Settings
router.get('/settings', getPlatformSettings);
router.get('/settings/:key', getSettingByKey);
router.put('/settings/:key', upsertSetting);
router.put('/settings', bulkUpdateSettings);

// Feature Toggles
router.get('/features', getFeatureToggles);
router.get('/features/:feature', getFeatureToggle);
router.put('/features/:feature', upsertFeatureToggle);
router.patch('/features/:feature/toggle', toggleFeature);

// Database Monitoring
router.get('/database/stats', getDatabaseStats);
router.get('/database/api-hit-rate', getApiHitRate);

export default router;

