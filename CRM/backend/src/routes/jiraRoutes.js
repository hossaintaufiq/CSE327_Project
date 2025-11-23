import express from 'express';
import { createIssue, addComment, transitionIssue, getTransitions } from '../jiraClient.js';

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

export default router;