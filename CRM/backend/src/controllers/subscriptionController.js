import mongoose from 'mongoose';
import { Subscription } from '../models/Subscription.js';
import { Company } from '../models/Company.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Get all subscriptions
 */
export const getSubscriptions = async (req, res) => {
  try {
    const { status, plan } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (plan) query.plan = plan;

    const subscriptions = await Subscription.find(query)
      .populate('companyId', 'name domain adminId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { subscriptions },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
};

/**
 * Get subscription by company ID
 */
export const getSubscriptionByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const subscription = await Subscription.findOne({ companyId })
      .populate('companyId', 'name domain adminId')
      .lean();

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Error fetching subscription', error: error.message });
  }
};

/**
 * Create or update subscription
 */
export const upsertSubscription = async (req, res) => {
  try {
    const { companyId, plan, status, billingCycle, amount, autoRenew, endDate } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Plan pricing (can be moved to config)
    const planPricing = {
      free: { monthly: 0, yearly: 0 },
      standard: { monthly: 29, yearly: 290 },
      pro: { monthly: 99, yearly: 990 },
      enterprise: { monthly: 299, yearly: 2990 },
    };

    const subscriptionAmount = amount || (planPricing[plan]?.[billingCycle || 'monthly'] || 0);

    // Calculate dates
    const startDate = new Date();
    const subscriptionEndDate = endDate || (() => {
      const end = new Date(startDate);
      if (billingCycle === 'yearly') {
        end.setFullYear(end.getFullYear() + 1);
      } else {
        end.setMonth(end.getMonth() + 1);
      }
      return end;
    })();

    const nextBillingDate = autoRenew ? subscriptionEndDate : null;

    const existingSubscription = await Subscription.findOne({ companyId });
    const isNew = !existingSubscription;

    const subscription = await Subscription.findOneAndUpdate(
      { companyId },
      {
        companyId,
        plan: plan || 'free',
        status: status || 'active',
        billingCycle: billingCycle || 'monthly',
        amount: subscriptionAmount,
        autoRenew: autoRenew !== undefined ? autoRenew : true,
        startDate,
        endDate: subscriptionEndDate,
        nextBillingDate,
        currency: 'USD',
      },
      { upsert: true, new: true }
    );

    await subscription.populate('companyId', 'name domain adminId');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      companyId,
      action: isNew ? 'subscription_created' : 'subscription_updated',
      description: `Subscription ${isNew ? 'created' : 'updated'} for ${company.name}`,
      metadata: { plan, status, amount: subscriptionAmount },
      severity: 'info',
    });

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription },
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Error updating subscription', error: error.message });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res) => {
  try {
    const { companyId } = req.params;

    const subscription = await Subscription.findOne({ companyId });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    await subscription.populate('companyId', 'name');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      companyId,
      action: 'subscription_cancelled',
      description: `Subscription cancelled for ${subscription.companyId.name}`,
      severity: 'warning',
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription },
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Error cancelling subscription', error: error.message });
  }
};

/**
 * Get upcoming renewals
 */
export const getUpcomingRenewals = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const renewals = await Subscription.find({
      status: 'active',
      autoRenew: true,
      nextBillingDate: { $lte: futureDate, $gte: new Date() },
    })
      .populate('companyId', 'name domain')
      .sort({ nextBillingDate: 1 })
      .lean();

    res.json({
      success: true,
      data: { renewals },
    });
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    res.status(500).json({ message: 'Error fetching upcoming renewals', error: error.message });
  }
};

/**
 * Get failed payments
 */
export const getFailedPayments = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      failedPayments: { $gt: 0 },
      status: 'active',
    })
      .populate('companyId', 'name domain')
      .sort({ failedPayments: -1 })
      .lean();

    res.json({
      success: true,
      data: { subscriptions },
    });
  } catch (error) {
    console.error('Error fetching failed payments:', error);
    res.status(500).json({ message: 'Error fetching failed payments', error: error.message });
  }
};

