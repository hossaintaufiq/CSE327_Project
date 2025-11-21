import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = express.Router();

router.use(verifyFirebaseToken);

// All routes require company access
router.use(verifyCompanyAccess);

// Get all tasks
router.get('/', getTasks);

// Get task by ID
router.get('/:taskId', getTaskById);

// Create task (company_admin, manager, employee)
router.post('/', checkRole(['company_admin', 'manager', 'employee']), createTask);

// Update task (company_admin, manager, employee - employees can only update their own)
router.put('/:taskId', checkRole(['company_admin', 'manager', 'employee']), updateTask);

// Delete task (company_admin, manager)
router.delete('/:taskId', checkRole(['company_admin', 'manager']), deleteTask);

export default router;

