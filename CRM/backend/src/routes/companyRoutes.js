import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import {
  createCompany,
  joinCompany,
  listMyCompanies,
  getCompanyMembers,
  getPendingJoinRequests,
  handleJoinRequest,
} from '../controllers/companyController.js';
import { getEmployeeProfile, searchEmployees, getEmployees } from '../controllers/employeeController.js';
import { getCompanyProfile, updateCompanyProfile } from '../controllers/companyProfileController.js';
import { getRolesAndPermissions, updateUserRole, removeUserFromCompany } from '../controllers/rolesPermissionsController.js';
import { getCompanySettings, updateCompanySettings } from '../controllers/settingsController.js';
import { getCompanyAnnouncements, createCompanyAnnouncement } from '../controllers/announcementController.js';

const router = express.Router();

router.use(verifyFirebaseToken);

// Routes that don't require company access
router.post('/create', createCompany);
router.post('/join', joinCompany);
router.get('/my-companies', listMyCompanies);

// Routes that require company access
router.get('/members', verifyCompanyAccess, getCompanyMembers); // Get members of the active company
router.get('/members/:employeeId/profile', verifyCompanyAccess, checkRole(['company_admin', 'manager']), getEmployeeProfile); // Get employee profile
router.get('/profile', verifyCompanyAccess, checkRole(['company_admin']), getCompanyProfile); // Get company profile
router.put('/profile', verifyCompanyAccess, checkRole(['company_admin']), updateCompanyProfile); // Update company profile
router.get('/roles', verifyCompanyAccess, checkRole(['company_admin']), getRolesAndPermissions); // Get roles and permissions
router.put('/roles/:userId', verifyCompanyAccess, checkRole(['company_admin']), updateUserRole); // Update user role
router.delete('/roles/:userId', verifyCompanyAccess, checkRole(['company_admin']), removeUserFromCompany); // Remove user from company
router.get('/settings', verifyCompanyAccess, checkRole(['company_admin']), getCompanySettings); // Get company settings
router.put('/settings', verifyCompanyAccess, checkRole(['company_admin']), updateCompanySettings); // Update company settings
router.get('/announcements', verifyCompanyAccess, getCompanyAnnouncements); // Get company announcements
router.post('/announcements', verifyCompanyAccess, checkRole(['company_admin']), createCompanyAnnouncement); // Create company announcement
router.get('/:companyId/members', verifyCompanyAccess, checkRole(['company_admin', 'manager']), getCompanyMembers);

// Join request management (company admin only)
router.get('/join-requests', verifyCompanyAccess, checkRole(['company_admin']), getPendingJoinRequests); // Get pending join requests
router.post('/join-requests/handle', verifyCompanyAccess, checkRole(['company_admin']), handleJoinRequest); // Approve/reject join request

export default router;

