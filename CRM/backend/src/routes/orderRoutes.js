import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  createJiraIssueForOrder,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = express.Router();

router.use(verifyFirebaseToken);

// All routes require company access
router.use(verifyCompanyAccess);

// Get all orders
router.get('/', getOrders);

// Get order by ID
router.get('/:orderId', getOrderById);

// Create order (company_admin, manager, employee)
router.post('/', checkRole(['company_admin', 'manager', 'employee']), createOrder);

// Update order (company_admin, manager)
router.put('/:orderId', checkRole(['company_admin', 'manager']), updateOrder);

// Update order status (pipeline stage)
router.patch('/:orderId/status', checkRole(['company_admin', 'manager']), updateOrderStatus);

// Delete order (company_admin only)
router.delete('/:orderId', checkRole(['company_admin']), deleteOrder);

// Create Jira issue for order
router.post('/:orderId/jira-issue', checkRole(['company_admin', 'manager', 'employee']), createJiraIssueForOrder);

export default router;