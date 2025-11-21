import mongoose from 'mongoose';
import { FeatureToggle } from '../models/FeatureToggle.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Get all feature toggles
 */
export const getFeatureToggles = async (req, res) => {
  try {
    const toggles = await FeatureToggle.find({})
      .populate('affectedCompanies', 'name')
      .sort({ feature: 1 })
      .lean();

    res.json({
      success: true,
      data: { toggles },
    });
  } catch (error) {
    console.error('Error fetching feature toggles:', error);
    res.status(500).json({ message: 'Error fetching feature toggles', error: error.message });
  }
};

/**
 * Get feature toggle by name
 */
export const getFeatureToggle = async (req, res) => {
  try {
    const { feature } = req.params;

    const toggle = await FeatureToggle.findOne({ feature })
      .populate('affectedCompanies', 'name')
      .lean();

    if (!toggle) {
      return res.status(404).json({ message: 'Feature toggle not found' });
    }

    res.json({
      success: true,
      data: { toggle },
    });
  } catch (error) {
    console.error('Error fetching feature toggle:', error);
    res.status(500).json({ message: 'Error fetching feature toggle', error: error.message });
  }
};

/**
 * Create or update feature toggle
 */
export const upsertFeatureToggle = async (req, res) => {
  try {
    const { feature } = req.params;
    const { enabled, description, affectedCompanies } = req.body;

    if (!feature) {
      return res.status(400).json({ message: 'Feature name is required' });
    }

    const toggle = await FeatureToggle.findOneAndUpdate(
      { feature },
      {
        feature,
        enabled: enabled !== undefined ? enabled : true,
        description: description || '',
        affectedCompanies: affectedCompanies || [],
      },
      { upsert: true, new: true }
    );

    await toggle.populate('affectedCompanies', 'name');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'feature_toggled',
      description: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`,
      metadata: { feature, enabled, affectedCompanies: affectedCompanies?.length || 0 },
      severity: 'info',
    });

    res.json({
      success: true,
      message: 'Feature toggle updated successfully',
      data: { toggle },
    });
  } catch (error) {
    console.error('Error updating feature toggle:', error);
    res.status(500).json({ message: 'Error updating feature toggle', error: error.message });
  }
};

/**
 * Toggle feature (quick enable/disable)
 */
export const toggleFeature = async (req, res) => {
  try {
    const { feature } = req.params;

    const toggle = await FeatureToggle.findOne({ feature });
    if (!toggle) {
      return res.status(404).json({ message: 'Feature toggle not found' });
    }

    toggle.enabled = !toggle.enabled;
    await toggle.save();

    await toggle.populate('affectedCompanies', 'name');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'feature_toggled',
      description: `Feature ${feature} ${toggle.enabled ? 'enabled' : 'disabled'}`,
      metadata: { feature, enabled: toggle.enabled },
      severity: 'info',
    });

    res.json({
      success: true,
      message: `Feature ${toggle.enabled ? 'enabled' : 'disabled'} successfully`,
      data: { toggle },
    });
  } catch (error) {
    console.error('Error toggling feature:', error);
    res.status(500).json({ message: 'Error toggling feature', error: error.message });
  }
};

