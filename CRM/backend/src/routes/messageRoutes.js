import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import {
  getAllMessages,
  getMessageById,
  createMessage,
  markAsRead,
  deleteMessage,
} from '../controllers/messageController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// Middleware to handle super admin access
const handleCompanyAccess = (req, res, next) => {
  if (req.user.globalRole === 'super_admin') {
    // Super admin bypasses company access check
    req.companyId = null;
    return next();
  }
  // Regular users need company access
  verifyCompanyAccess(req, res, next);
};

// Routes
router.get('/', handleCompanyAccess, getAllMessages);
router.get('/all', handleCompanyAccess, getAllMessages); // Alias for super admin
router.get('/:messageId', handleCompanyAccess, getMessageById);
router.post('/', handleCompanyAccess, createMessage);
router.patch('/:messageId/read', handleCompanyAccess, markAsRead);
router.delete('/:messageId', handleCompanyAccess, deleteMessage);

export default router;

