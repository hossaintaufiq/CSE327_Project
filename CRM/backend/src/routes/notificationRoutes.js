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

const router = express.Router();

// Test email endpoint (no auth required for testing)
router.post('/test-email', async (req, res) => {
  try {
    const { sendEmail } = await import('../services/emailService.js');
    const result = await sendEmail({
      to: req.body.to || 'nazmul.sakib01@northsouth.edu',
      subject: req.body.subject || 'CRM Test Email',
      html: req.body.html || '<h1>Test Email</h1><p>This is a test email from your CRM system.</p>'
    });
    res.json({ success: true, message: 'Test email sent successfully', result });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// All notification routes require authentication and company access
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

// Get all notifications for the user
router.get('/', getNotifications);

// Get specific notification by ID
router.get('/:notificationId', getNotificationById);

// Create a new notification (for internal use, might be restricted)
router.post('/', createNotificationController);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Test email endpoint (no auth required for testing)
router.post('/test-email', async (req, res) => {
  try {
    const { sendEmail } = await import('../services/emailService.js');
    const result = await sendEmail({
      to: 'nazmul.sakib01@northsouth.edu',
      subject: 'Test Email from CRM',
      html: '<h1>Test Email</h1><p>This is a test email to verify Gmail SMTP configuration.</p>'
    });
    res.json({ success: true, message: 'Test email sent successfully', result });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;