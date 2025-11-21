import mongoose from 'mongoose';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Get all platform settings
 */
export const getPlatformSettings = async (req, res) => {
  try {
    const { category } = req.query;

    let query = {};
    if (category) query.category = category;

    const settings = await PlatformSettings.find(query).lean();

    // Convert array to object for easier access
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json({
      success: true,
      data: { settings: settingsObj, raw: settings },
    });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ message: 'Error fetching platform settings', error: error.message });
  }
};

/**
 * Get setting by key
 */
export const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await PlatformSettings.findOne({ key }).lean();

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({
      success: true,
      data: { setting },
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ message: 'Error fetching setting', error: error.message });
  }
};

/**
 * Update or create setting
 */
export const upsertSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category, description, isEncrypted } = req.body;

    if (!key) {
      return res.status(400).json({ message: 'Key is required' });
    }

    const setting = await PlatformSettings.findOneAndUpdate(
      { key },
      {
        key,
        value,
        category: category || 'other',
        description: description || '',
        isEncrypted: isEncrypted || false,
        updatedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'settings_updated',
      description: `Platform setting updated: ${key}`,
      metadata: { key, category },
      severity: 'info',
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: { setting },
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Error updating setting', error: error.message });
  }
};

/**
 * Bulk update settings
 */
export const bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Settings object is required' });
    }

    const updates = Object.entries(settings).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: {
          $set: {
            key,
            value,
            updatedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await PlatformSettings.bulkWrite(updates);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'settings_updated',
      description: 'Multiple platform settings updated',
      metadata: { keys: Object.keys(settings) },
      severity: 'info',
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

