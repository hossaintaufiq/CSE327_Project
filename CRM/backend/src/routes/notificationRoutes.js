import express from 'express';
import {
  getNotifications,
  getNotificationById,
  createNotificationController,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';

const router = express.Router();

// All notification routes require authentication and company access
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

// Get all notifications for the user
router.get('/', getNotifications);

// Mark all notifications as read - must be before /:notificationId routes
router.put('/read-all', markAllAsRead);

// Get specific notification by ID
router.get('/:notificationId', getNotificationById);

// Create a new notification (admin and manager only)
router.post('/', checkRole(['company_admin', 'manager']), createNotificationController);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Test email endpoint - protected and admin only
router.post('/test-email', checkRole(['company_admin']), async (req, res) => {
  try {
    const { sendEmail } = await import('../services/emailService.js');
    const result = await sendEmail(
      req.body.to || req.user.email,
      'statusUpdate',
      {
        recipientName: req.user.name || 'User',
        entityType: 'Test',
        entityTitle: 'Email Configuration Test',
        oldStatus: 'Not Tested',
        newStatus: 'Tested',
      }
    );
    res.json({ success: true, message: 'Test email sent', result });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
