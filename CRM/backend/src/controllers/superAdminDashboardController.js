import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Message } from '../models/Message.js';
import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';
import { Subscription } from '../models/Subscription.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';

/**
 * Get super admin dashboard statistics
 */
export const getSuperAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total Companies
    const totalCompanies = await Company.countDocuments({ isActive: true });
    
    // Inactive Companies
    const inactiveCompanies = await Company.countDocuments({ isActive: false });

    // New Companies (30 days)
    const newCompanies30d = await Company.countDocuments({
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Daily Signups (last 7 days)
    const dailySignups = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);
      
      const daySignups = await User.countDocuments({
        isActive: true,
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });
      
      dailySignups.push({
        date: dayStart.toISOString().split('T')[0],
        count: daySignups,
      });
    }

    // Total Users
    const totalUsers = await User.countDocuments({ isActive: true });

    // New Users (30 days)
    const newUsers30d = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Total Revenue (all companies, delivered orders)
    const totalRevenueResult = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Monthly Revenue (all companies, delivered orders this month)
    const monthlyRevenueResult = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    // Total Leads (all companies)
    const totalLeads = await Client.countDocuments({ isActive: true });

    // New Leads (30 days)
    const newLeads30d = await Client.countDocuments({
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Pipeline Value (all companies, pending + processing)
    const pipelineResult = await Order.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'processing'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const pipelineValue = pipelineResult[0]?.total || 0;

    // Total Orders
    const totalOrders = await Order.countDocuments();

    // Active Tasks (actual tasks across all companies)
    const activeTasks = await Task.countDocuments({
      isActive: true,
      status: { $in: ['todo', 'in_progress', 'review'] },
    });

    // Subscription Revenue
    const subscriptionRevenueResult = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
        },
      },
      {
        $group: {
          _id: null,
          monthly: {
            $sum: {
              $cond: [{ $eq: ['$billingCycle', 'monthly'] }, '$amount', 0],
            },
          },
          yearly: {
            $sum: {
              $cond: [{ $eq: ['$billingCycle', 'yearly'] }, { $divide: ['$amount', 12] }, 0],
            },
          },
        },
      },
    ]);
    const subscriptionRevenue = subscriptionRevenueResult[0] 
      ? (subscriptionRevenueResult[0].monthly || 0) + (subscriptionRevenueResult[0].yearly || 0)
      : 0;

    // System Health Status
    const systemHealth = {
      database: 'healthy', // Can be enhanced with actual DB checks
      api: 'healthy',
      storage: 'healthy',
      lastChecked: now,
    };

    // Top Performing Companies (by revenue)
    const topCompaniesResult = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
        },
      },
      {
        $group: {
          _id: '$companyId',
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const topCompanies = await Promise.all(
      topCompaniesResult.map(async (item) => {
        const company = await Company.findById(item._id).populate('adminId', 'name email').lean();
        return {
          id: company?._id,
          name: company?.name || 'Unknown',
          revenue: item.totalRevenue,
          orderCount: item.orderCount,
          adminName: company?.adminId?.name || 'N/A',
        };
      })
    );

    // Calculate Revenue Trend (last 6 months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const monthRevenue = await Order.aggregate([
        {
          $match: {
            status: 'delivered',
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
          },
        },
      ]);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      revenueTrend.push({
        month: monthNames[monthStart.getMonth()],
        revenue: monthRevenue[0]?.total || 0,
      });
    }

    // Calculate Avg Deal Size
    const allDeliveredOrders = await Order.find({ status: 'delivered' }).lean();
    const avgDealSize = allDeliveredOrders.length > 0 ? totalRevenue / allDeliveredOrders.length : 0;

    // Conversion Rate
    const conversionRate = totalOrders > 0 ? (allDeliveredOrders.length / totalOrders) * 100 : 0;

    // Top Deals (top 5 orders by amount across all companies)
    const topDeals = await Order.find({})
      .populate('clientId', 'name email')
      .populate('companyId', 'name')
      .sort({ totalAmount: -1 })
      .limit(5)
      .lean();

    // Recent Activity (from ActivityLog, Messages, Companies, Users)
    const recentActivities = [];

    // Get recent activity logs
    const recentLogs = await ActivityLog.find({})
      .populate('userId', 'name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    recentLogs.forEach((log) => {
      recentActivities.push({
        id: log._id,
        type: 'log',
        action: log.action,
        description: log.description,
        userName: log.userId?.name || log.userId?.email || 'System',
        companyName: log.companyId?.name || null,
        date: log.createdAt,
        severity: log.severity,
      });
    });

    // Get recent messages
    const recentMessages = await Message.find({})
      .populate('senderId', 'name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentMessages.forEach((msg) => {
      recentActivities.push({
        id: msg._id,
        type: 'message',
        action: 'message_sent',
        description: `Message sent in ${msg.companyId?.name || 'Unknown'}`,
        userName: msg.senderId?.name || msg.senderId?.email || 'Unknown',
        companyName: msg.companyId?.name || 'Unknown',
        date: msg.createdAt,
        severity: 'info',
      });
    });

    // Get recent company creations
    const recentCompanyCreations = await Company.find({})
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentCompanyCreations.forEach((company) => {
      recentActivities.push({
        id: company._id,
        type: 'company',
        action: 'company_created',
        description: `Company "${company.name}" created`,
        userName: company.adminId?.name || company.adminId?.email || 'Unknown',
        companyName: company.name,
        date: company.createdAt,
        severity: 'info',
      });
    });

    // Sort all activities by date and limit to 15
    const recentActivity = recentActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);

    // Recent Companies (last 5)
    const recentCompanies = await Company.find({ isActive: true })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        stats: {
          totalCompanies,
          inactiveCompanies,
          newCompanies30d,
          totalUsers,
          newUsers30d,
          monthlyRevenue,
          totalRevenue,
          subscriptionRevenue,
          totalLeads,
          newLeads30d,
          pipelineValue,
          totalOrders,
          activeTasks,
          avgDealSize,
          conversionRate,
          systemHealth,
        },
        dailySignups,
        topCompanies,
        revenueTrend,
        recentActivity,
        topDeals: topDeals.map((deal) => ({
          id: deal._id,
          orderNumber: deal.orderNumber,
          clientName: deal.clientId?.name || deal.clientId?.email || 'Unknown',
          companyName: deal.companyId?.name || 'Unknown',
          amount: deal.totalAmount,
          status: deal.status,
          createdAt: deal.createdAt,
        })),
        recentCompanies: recentCompanies.map((c) => ({
          id: c._id,
          name: c.name,
          domain: c.domain,
          adminName: c.adminId?.name || 'N/A',
          adminEmail: c.adminId?.email || 'N/A',
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching super admin dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
};

