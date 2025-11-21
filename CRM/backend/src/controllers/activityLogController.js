import mongoose from 'mongoose';
import { ActivityLog } from '../models/ActivityLog.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

/**
 * Get activity logs with filters
 */
export const getActivityLogs = async (req, res) => {
  try {
    const { userId, companyId, action, severity, startDate, endDate, limit = 100 } = req.query;

    let query = {};

    if (userId) query.userId = userId;
    if (companyId) query.companyId = companyId;
    if (action) query.action = action;
    if (severity) query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
  }
};

/**
 * Get login history
 */
export const getLoginHistory = async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;

    let query = {
      action: { $in: ['login', 'login_failed', 'logout'] },
    };

    if (userId) query.userId = userId;

    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ message: 'Error fetching login history', error: error.message });
  }
};

/**
 * Get suspicious activity
 */
export const getSuspiciousActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find({
      $or: [
        { action: 'login_failed' },
        { action: 'suspicious_activity' },
        { severity: { $in: ['error', 'critical'] } },
      ],
    })
      .populate('userId', 'name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    console.error('Error fetching suspicious activity:', error);
    res.status(500).json({ message: 'Error fetching suspicious activity', error: error.message });
  }
};

/**
 * Create activity log (helper function, can be called from other controllers)
 */
export const createActivityLog = async (logData) => {
  try {
    return await ActivityLog.create(logData);
  } catch (error) {
    console.error('Error creating activity log:', error);
    return null;
  }
};

