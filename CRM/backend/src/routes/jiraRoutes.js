import express from 'express';
import crypto from 'crypto';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import { createIssue, addComment, transitionIssue, getTransitions } from '../jiraClient.js';
import { handleJiraWebhook, syncAllEntitiesForCompany, cleanupOrphanedJiraReferences } from '../utils/jiraSync.js';
import { jiraSyncService } from '../services/jiraSyncService.js';

const router = express.Router();

// Webhook endpoint for Jira updates
// Secured with webhook secret validation
// Accept raw body for signature verification
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const webhookSecret = process.env.JIRA_WEBHOOK_SECRET;

    // If a secret is configured, validate HMAC-SHA256 signature
    if (webhookSecret) {
      const signatureHeader = (req.headers['x-atlassian-webhook-signature'] || req.headers['x-hub-signature'] || '').toString();
      if (!signatureHeader) {
        console.warn('Jira webhook received without signature');
        return res.status(403).json({ error: 'Missing webhook signature' });
      }

      // Normalize header: may be provided as 'sha256=...' or raw token
      let incoming = signatureHeader.replace(/^sha256=|^sha256:/i, '').trim();

      const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''));

      const computedHex = crypto.createHmac('sha256', webhookSecret).update(bodyBuffer).digest('hex');
      const computedBase64 = crypto.createHmac('sha256', webhookSecret).update(bodyBuffer).digest('base64');

      const incomingBuf = Buffer.from(incoming);
      const hexBuf = Buffer.from(computedHex);
      const b64Buf = Buffer.from(computedBase64);

      const valid = (
        (incomingBuf.length === hexBuf.length && crypto.timingSafeEqual(incomingBuf, hexBuf)) ||
        (incomingBuf.length === b64Buf.length && crypto.timingSafeEqual(incomingBuf, b64Buf))
      );

      if (!valid) {
        console.warn('Invalid Jira webhook signature');
        return res.status(403).json({ error: 'Invalid webhook signature' });
      }
    }

    // Parse payload from raw body and forward to handler
    let payload;
    try {
      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
      payload = raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Invalid JSON payload for Jira webhook', e.message);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    if (!payload || !payload.issue) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    await handleJiraWebhook(payload);
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing Jira webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// All other routes require authentication
router.use(verifyFirebaseToken);
router.use(verifyCompanyAccess);

// Create Jira issue - admin and managers only
router.post('/issue', checkRole(['company_admin', 'manager', 'employee']), async (req, res) => {
  try {
    const { summary, description, issuetype } = req.body;
    if (!summary) return res.status(400).json({ error: 'summary required' });
    const created = await createIssue({ summary, description, issuetype });
    return res.status(201).json(created);
  } catch (err) {
    console.error('Jira create issue error', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: err?.response?.data || err.message });
  }
});

// Add comment to Jira issue
router.post('/issue/:key/comment', checkRole(['company_admin', 'manager', 'employee']), async (req, res) => {
  try {
    const { key } = req.params;
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: 'comment required' });
    const result = await addComment(key, comment);
    res.json(result);
  } catch (err) {
    console.error('Jira add comment error', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: err?.response?.data || err.message });
  }
});

// Transition Jira issue - admin and managers only
router.post('/issue/:key/transition', checkRole(['company_admin', 'manager']), async (req, res) => {
  try {
    const { key } = req.params;
    const { transitionId, transitionName } = req.body;
    const result = await transitionIssue(key, { transitionId, transitionName });
    res.json(result);
  } catch (err) {
    console.error('Jira transition error', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: err?.response?.data || err.message });
  }
});

// Get available transitions for an issue
router.get('/issue/:key/transitions', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await getTransitions(key);
    res.json(result);
  } catch (err) {
    console.error('Jira get transitions error', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: err?.response?.data || err.message });
  }
});

// Manual sync endpoint - admin only
router.post('/sync-all', checkRole(['company_admin']), async (req, res) => {
  try {
    const companyId = req.companyId;
    console.log(`🔄 Manual sync requested for company ${companyId}`);
    await syncAllEntitiesForCompany(companyId);
    res.status(200).json({ message: 'Sync completed successfully' });
  } catch (error) {
    console.error('❌ Error during manual sync:', error);
    res.status(500).json({ error: 'Failed to sync entities' });
  }
});

// Immediate sync endpoint - admin only
router.post('/sync-now', checkRole(['company_admin']), async (req, res) => {
  try {
    const companyId = req.companyId;
    console.log(`⚡ Immediate sync requested for company ${companyId}`);
    await jiraSyncService.syncCompany(companyId);
    
    res.status(200).json({ 
      message: 'Immediate sync completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error during immediate sync:', error);
    res.status(500).json({ error: 'Failed to perform immediate sync' });
  }
});

// Cleanup orphaned Jira references - admin only
router.post('/cleanup-orphaned', checkRole(['company_admin']), async (req, res) => {
  try {
    const companyId = req.companyId;
    console.log(`🧽 Manual cleanup requested for company ${companyId}`);
    const cleanedCount = await cleanupOrphanedJiraReferences(companyId);
    res.status(200).json({ 
      message: 'Cleanup completed successfully',
      cleanedReferences: cleanedCount
    });
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup orphaned references' });
  }
});

export default router;
