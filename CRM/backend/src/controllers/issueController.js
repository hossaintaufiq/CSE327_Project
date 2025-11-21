import mongoose from 'mongoose';
import { Issue } from '../models/Issue.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Get all issues
 */
export const getIssues = async (req, res) => {
  try {
    const { companyId, status, priority, category, assignedTo } = req.query;

    let query = {};

    if (companyId) query.companyId = companyId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    const issues = await Issue.find(query)
      .populate('companyId', 'name domain')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { issues },
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ message: 'Error fetching issues', error: error.message });
  }
};

/**
 * Get issue by ID
 */
export const getIssueById = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId)
      .populate('companyId', 'name domain')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json({
      success: true,
      data: { issue },
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({ message: 'Error fetching issue', error: error.message });
  }
};

/**
 * Create issue
 */
export const createIssue = async (req, res) => {
  try {
    const { companyId, title, description, category, priority, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const issue = await Issue.create({
      companyId: companyId || null,
      reportedBy: req.user._id,
      title,
      description,
      category: category || 'support',
      priority: priority || 'medium',
      tags: tags || [],
      status: 'open',
    });

    await issue.populate('companyId', 'name domain');
    await issue.populate('reportedBy', 'name email');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      companyId: companyId || null,
      action: 'issue_created',
      description: `Issue created: ${title}`,
      metadata: { issueId: issue._id, category, priority },
      severity: priority === 'critical' || priority === 'urgent' ? 'error' : 'info',
    });

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: { issue },
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Error creating issue', error: error.message });
  }
};

/**
 * Update issue
 */
export const updateIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status, priority, assignedTo, resolution, tags } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (status !== undefined) {
      issue.status = status;
      if (status === 'resolved' || status === 'closed') {
        issue.resolvedAt = new Date();
        issue.resolution = resolution || issue.resolution;
      }
    }
    if (priority !== undefined) issue.priority = priority;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo || null;
    if (resolution !== undefined) issue.resolution = resolution;
    if (tags !== undefined) issue.tags = tags;

    await issue.save();
    await issue.populate('companyId', 'name domain');
    await issue.populate('reportedBy', 'name email');
    await issue.populate('assignedTo', 'name email');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      companyId: issue.companyId?._id || null,
      action: 'issue_updated',
      description: `Issue updated: ${issue.title}`,
      metadata: { issueId: issue._id, status, priority },
      severity: 'info',
    });

    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: { issue },
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Error updating issue', error: error.message });
  }
};

/**
 * Get disputes
 */
export const getDisputes = async (req, res) => {
  try {
    const disputes = await Issue.find({ isDispute: true })
      .populate('companyId', 'name domain')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { disputes },
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ message: 'Error fetching disputes', error: error.message });
  }
};

