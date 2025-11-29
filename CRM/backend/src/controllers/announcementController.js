import mongoose from 'mongoose';
import { Announcement } from '../models/Announcement.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Get all announcements
 */
export const getAnnouncements = async (req, res) => {
  try {
    const { isActive, type } = req.query;

    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (type) query.type = type;

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email')
      .populate('targetCompanies', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { announcements },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

/**
 * Create announcement
 */
export const createAnnouncement = async (req, res) => {
  try {
    const { targetType, targetCompanies, title, content, type, priority, startDate, endDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      createdBy: req.user._id,
      targetType: targetType || 'all',
      targetCompanies: targetCompanies || [],
      title,
      content,
      type: type || 'info',
      priority: priority || 'medium',
      startDate: startDate || new Date(),
      endDate: endDate || null,
      isActive: true,
    });

    await announcement.populate('createdBy', 'name email');
    await announcement.populate('targetCompanies', 'name');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'announcement_created',
      description: `Announcement created: ${title}`,
      metadata: { announcementId: announcement._id, targetType },
      severity: 'info',
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement },
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const updateData = req.body;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (updateData.title !== undefined) announcement.title = updateData.title;
    if (updateData.content !== undefined) announcement.content = updateData.content;
    if (updateData.type !== undefined) announcement.type = updateData.type;
    if (updateData.priority !== undefined) announcement.priority = updateData.priority;
    if (updateData.isActive !== undefined) announcement.isActive = updateData.isActive;
    if (updateData.startDate !== undefined) announcement.startDate = updateData.startDate;
    if (updateData.endDate !== undefined) announcement.endDate = updateData.endDate;
    if (updateData.targetType !== undefined) announcement.targetType = updateData.targetType;
    if (updateData.targetCompanies !== undefined) announcement.targetCompanies = updateData.targetCompanies;

    await announcement.save();
    await announcement.populate('createdBy', 'name email');
    await announcement.populate('targetCompanies', 'name');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: { announcement },
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Error updating announcement', error: error.message });
  }
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findByIdAndDelete(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
};

/**
 * Get announcements for company users
 */
export const getCompanyAnnouncements = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userRole = req.companyRole;

    // Build query to get announcements relevant to this company
    const query = {
      isActive: true,
      $or: [
        { targetType: 'all' },
        { targetType: 'companies' },
        { targetType: 'users' },
        { 
          targetType: 'specific_companies',
          targetCompanies: companyId
        }
      ]
    };

    // Add date filtering
    const now = new Date();
    query.$or.forEach(condition => {
      condition.startDate = { $lte: now };
      if (condition.endDate) {
        condition.endDate = { $gte: now };
      }
    });

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email')
      .populate('targetCompanies', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { announcements },
    });
  } catch (error) {
    console.error('Error fetching company announcements:', error);
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

/**
 * Create announcement for company
 */
export const createCompanyAnnouncement = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { title, content, type, priority, targetType, targetCompanies } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // For company announcements, default to company scope
    const announcementData = {
      createdBy: req.user._id,
      targetType: targetType || 'companies',
      targetCompanies: targetType === 'specific_companies' ? targetCompanies : [companyId],
      title,
      content,
      type: type || 'announcement',
      priority: priority || 'medium',
    };

    const announcement = await Announcement.create(announcementData);

    await announcement.populate('createdBy', 'name email');
    await announcement.populate('targetCompanies', 'name');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      companyId,
      action: 'announcement_created',
      description: `Company announcement created: ${title}`,
      metadata: { announcementId: announcement._id },
    });

    res.json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement },
    });
  } catch (error) {
    console.error('Error creating company announcement:', error);
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
};

