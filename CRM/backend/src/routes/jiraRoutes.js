import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { verifyCompanyAccess } from '../middleware/companyAccess.js';
import { createIssue, addComment, transitionIssue, getTransitions } from '../jiraClient.js';
import { handleJiraWebhook, syncAllEntitiesForCompany, cleanupOrphanedJiraReferences } from '../utils/jiraSync.js';
import { jiraSyncService } from '../services/jiraSyncService.js';

const router = express.Router();

// Basic middleware: you should add authentication & validation in production
router.post('/issue', async (req, res) => {
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

router.post('/issue/:key/comment', async (req, res) => {
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

router.post('/issue/:key/transition', async (req, res) => {
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

// Webhook endpoint for Jira updates (no auth required for webhooks)
router.post('/webhook', async (req, res) => {
  try {
    console.log('Received Jira webhook:', JSON.stringify(req.body, null, 2));
    
    // Basic validation - ensure this is a Jira webhook
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

// Manual sync endpoint for all entities
router.post('/sync-all', verifyFirebaseToken, verifyCompanyAccess, async (req, res) => {
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

// Immediate sync endpoint (triggers sync right away)
router.post('/sync-now', verifyFirebaseToken, verifyCompanyAccess, async (req, res) => {
  try {
    const companyId = req.companyId;
    console.log(`⚡ Immediate sync requested for company ${companyId}`);
    
    // Trigger immediate sync
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

// Cleanup orphaned Jira references endpoint
router.post('/cleanup-orphaned', verifyFirebaseToken, verifyCompanyAccess, async (req, res) => {
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