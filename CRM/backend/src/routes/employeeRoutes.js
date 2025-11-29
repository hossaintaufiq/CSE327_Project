import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { getEmployeeProfile, searchEmployees, getEmployees } from '../controllers/employeeController.js';

const router = express.Router();

// All employee routes require authentication and company access
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

// Search employees in company
router.get('/search', searchEmployees);

// Get all employees in company  
router.get('/', getEmployees);

// Get specific employee profile
router.get('/:employeeId/profile', getEmployeeProfile);

export default router;
