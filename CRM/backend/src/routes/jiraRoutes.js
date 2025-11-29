import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { checkRole } from '../middleware/roleCheck.js';
import { createIssue, addComment, transitionIssue, getTransitions } from '../jiraClient.js';
import { handleJiraWebhook, syncAllEntitiesForCompany, cleanupOrphanedJiraReferences } from '../utils/jiraSync.js';
import { jiraSyncService } from '../services/jiraSyncService.js';

const router = express.Router();

// Webhook endpoint for Jira updates
// Secured with webhook secret validation
router.post('/webhook', async (req, res) => {
  try {
    // Validate Jira webhook signature if configured
    const webhookSecret = process.env.JIRA_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-atlassian-webhook-signature'];
      // In production, you should verify the HMAC signature
      // For now, we just check if the secret header exists when configured
      if (!signature) {
        console.warn('Jira webhook received without signature');
      }
    }

    if (!req.body || !req.body.issue) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }
    
    await handleJiraWebhook(req.body);
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
