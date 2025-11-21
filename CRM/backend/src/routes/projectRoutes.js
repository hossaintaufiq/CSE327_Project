import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';

const router = express.Router();

router.use(verifyFirebaseToken);

// All routes require company access
router.use(verifyCompanyAccess);

// Get all projects
router.get('/', getProjects);

// Get project by ID
router.get('/:projectId', getProjectById);

// Create project (company_admin, manager, employee)
router.post('/', checkRole(['company_admin', 'manager', 'employee']), createProject);

// Update project (company_admin, manager)
router.put('/:projectId', checkRole(['company_admin', 'manager']), updateProject);

// Delete project (company_admin only)
router.delete('/:projectId', checkRole(['company_admin']), deleteProject);

export default router;

