import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import {
  getTasks,
  getTasksKanban,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  moveTaskToStage,
  assignTask,
  getTaskStats,
  getTasksDueSoon,
} from '../controllers/taskController.js';

const router = express.Router();

router.use(verifyFirebaseToken);

// All routes require company access
router.use(verifyCompanyAccess);

// Get all tasks
router.get('/', getTasks);

// Get tasks in Kanban view
router.get('/kanban', getTasksKanban);

// Get task statistics
router.get('/stats', getTaskStats);

// Get tasks due soon
router.get('/due-soon', getTasksDueSoon);

// Get task by ID
router.get('/:taskId', getTaskById);

// Create task (company_admin, manager, employee)
router.post('/', checkRole(['company_admin', 'manager', 'employee']), createTask);

// Update task (company_admin, manager, employee - employees can only update their own)
router.put('/:taskId', checkRole(['company_admin', 'manager', 'employee']), updateTask);

// Move task to pipeline stage (Kanban drag-drop)
router.patch('/:taskId/stage', checkRole(['company_admin', 'manager', 'employee']), moveTaskToStage);

// Assign task to user
router.patch('/:taskId/assign', checkRole(['company_admin', 'manager']), assignTask);

// Delete task (company_admin, manager)
router.delete('/:taskId', checkRole(['company_admin', 'manager']), deleteTask);

export default router;