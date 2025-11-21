import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Message } from '../models/Message.js';
import { Subscription } from '../models/Subscription.js';

/**
 * Get database monitoring statistics
 */
export const getDatabaseStats = async (req, res) => {
  try {
    // Total records by collection
    const totalRecords = {
      companies: await Company.countDocuments(),
      users: await User.countDocuments(),
      clients: await Client.countDocuments(),
      orders: await Order.countDocuments(),
      projects: await Project.countDocuments(),
      tasks: await Task.countDocuments(),
      messages: await Message.countDocuments(),
      subscriptions: await Subscription.countDocuments(),
    };

    const totalRecordsCount = Object.values(totalRecords).reduce((sum, count) => sum + count, 0);

    // Per-company database load
    const companies = await Company.find({ isActive: true }).lean();
    const companyLoads = await Promise.all(
      companies.map(async (company) => {
        const companyId = company._id;
        const clients = await Client.countDocuments({ companyId, isActive: true });
        const orders = await Order.countDocuments({ companyId });
        const projects = await Project.countDocuments({ companyId, isActive: true });
        const tasks = await Task.countDocuments({ companyId, isActive: true });
        const messages = await Message.countDocuments({ companyId });
        const members = await User.countDocuments({
          'companies.companyId': companyId,
          'companies.isActive': true,
        });

        return {
          companyId: company._id,
          companyName: company.name,
          totalRecords: clients + orders + projects + tasks + messages,
          breakdown: {
            clients,
            orders,
            projects,
            tasks,
            messages,
            members,
          },
        };
      })
    );

    // Sort by total records (highest first)
    companyLoads.sort((a, b) => b.totalRecords - a.totalRecords);

    // Performance warnings (companies with > 10000 records)
    const performanceWarnings = companyLoads.filter((load) => load.totalRecords > 10000);

    // Estimate storage size (rough calculation)
    // This is a simplified estimation - actual storage would require DB stats
    const estimatedStorageMB = totalRecordsCount * 0.001; // Rough estimate: 1KB per record

    res.json({
      success: true,
      data: {
        totalRecords,
        totalRecordsCount,
        estimatedStorageMB: estimatedStorageMB.toFixed(2),
        companyLoads: companyLoads.slice(0, 20), // Top 20 companies
        performanceWarnings,
      },
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ message: 'Error fetching database stats', error: error.message });
  }
};

/**
 * Get API hit rate per company (simplified - would need actual API logging)
 */
export const getApiHitRate = async (req, res) => {
  try {
    // This is a placeholder - in production, you'd track API calls
    // For now, we'll use activity logs as a proxy
    const { ActivityLog } = await import('../models/ActivityLog.js');
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const apiHits = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          companyId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$companyId',
          hitCount: { $sum: 1 },
        },
      },
      {
        $sort: { hitCount: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    const companies = await Company.find({
      _id: { $in: apiHits.map((h) => h._id) },
    }).lean();

    const hitRate = apiHits.map((hit) => {
      const company = companies.find((c) => c._id.toString() === hit._id.toString());
      return {
        companyId: hit._id,
        companyName: company?.name || 'Unknown',
        hitCount: hit.hitCount,
        avgDailyHits: (hit.hitCount / 30).toFixed(2),
      };
    });

    res.json({
      success: true,
      data: { hitRate },
    });
  } catch (error) {
    console.error('Error fetching API hit rate:', error);
    res.status(500).json({ message: 'Error fetching API hit rate', error: error.message });
  }
};

