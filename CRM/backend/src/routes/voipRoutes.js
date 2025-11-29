import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import {
  makeOutboundCall,
  sendSMSMessage,
  getVoiceToken,
  getCallHistory,
  endActiveCall,
  handleVoiceWebhook,
  handleStatusCallback,
} from '../controllers/voipController.js';

const router = express.Router();

// Webhook endpoints (no auth required - called by Twilio)
router.post('/webhook/voice', handleVoiceWebhook);
router.post('/webhook/status', handleStatusCallback);

// Protected routes
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

// Get voice token for client
router.get('/token', getVoiceToken);

// Make outbound call
router.post('/call', checkRole(['company_admin', 'manager', 'employee']), makeOutboundCall);

// End active call
router.post('/call/:callSid/end', checkRole(['company_admin', 'manager', 'employee']), endActiveCall);

// Get call history
router.get('/calls', checkRole(['company_admin', 'manager']), getCallHistory);

// Send SMS
router.post('/sms', checkRole(['company_admin', 'manager', 'employee']), sendSMSMessage);

export default router;
