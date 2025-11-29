import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import {
  getLinkInfo,
  generateLinkCode,
  unlinkTelegram,
  sendTestNotification,
} from '../controllers/telegramController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// Get link status and info
router.get('/link-status', getLinkInfo);

// Generate link code
router.post('/generate-link', generateLinkCode);

// Unlink Telegram
router.delete('/unlink', unlinkTelegram);

// Send test notification (requires company access)
router.post('/test-notification', verifyCompanyAccess, sendTestNotification);

export default router;
