import express from 'express';
import twilio from 'twilio';
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
// Validate Twilio request signatures when TWILIO_AUTH_TOKEN is configured
const validateTwilioRequest = (req, res, next) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return next();

  try {
    const signature = req.headers['x-twilio-signature'];
    if (!signature) {
      console.warn('Twilio webhook missing X-Twilio-Signature');
      return res.status(403).send('Forbidden');
    }

    // Build full URL used by Twilio when creating the signature
    const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const url = base.replace(/\/$/, '') + req.originalUrl;

    // Use Twilio RequestValidator
    const validator = new twilio.RequestValidator(authToken);
    const isValid = validator.validate(signature, url, req.body || {});

    if (!isValid) {
      console.warn('Invalid Twilio signature for', req.originalUrl);
      return res.status(403).send('Forbidden');
    }

    return next();
  } catch (err) {
    console.error('Error validating Twilio signature:', err?.message || err);
    return res.status(500).send('Server error');
  }
};

router.post('/webhook/voice', express.urlencoded({ extended: true }), validateTwilioRequest, handleVoiceWebhook);
router.post('/webhook/status', express.urlencoded({ extended: true }), validateTwilioRequest, handleStatusCallback);

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
