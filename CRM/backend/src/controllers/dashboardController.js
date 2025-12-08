import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Message } from '../models/Message.js';
import { Client } from '../models/Client.js';
import { Order } from '../models/Order.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Conversation } from '../models/Conversation.js';

/**
 * Get dashboard statistics for a company (role-based)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const companyId = req.companyId;
    const user = req.user;
    const userRole = req.companyRole;
    
    console.log(`[getDashboardStats] User: ${user._id}, Role: ${userRole}, CompanyId: ${companyId}`);

    // Validate companyId for all roles
    if (!companyId) {
      console.error('[getDashboardStats] Missing companyId');
      return res.status(400).json({ 
        success: false,
        message: 'Company ID is required' 
      });
    }

    // Route to role-specific dashboard
    if (userRole === 'employee') {
      return getEmployeeDashboard(req, res);
    } else if (userRole === 'manager') {
      return getManagerDashboard(req, res);
    } else if (userRole === 'client') {
      return getClientDashboard(req, res);
    } else {
      // Company admin or default - return full company stats
      return getCompanyAdminDashboard(req, res);
    }
  } catch (error) {
    console.error('[getDashboardStats] Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching dashboard statistics', 
      error: error.message 
    });
  }
};

/**
 * Get dashboard statistics for Company Admin
 */
const getCompanyAdminDashboard = async (req, res) => {
  try {
    const companyId = req.companyId;

    // Count total employees in the company
    // Using aggregation to properly count nested array matches
    const employeesResult = await User.aggregate([
      { $unwind: '$companies' },
      {
        $match: {
          'companies.companyId': new mongoose.Types.ObjectId(companyId),
          'companies.isActive': true,
          isActive: true,
        },
      },
      { $count: 'total' },
    ]);
    const totalEmployees = employeesResult[0]?.total || 0;

    // Count unread messages for the company
    const unreadMessages = await Message.countDocuments({
      companyId,
      isRead: false,
    });

    // Count total messages for the company
    const totalMessages = await Message.countDocuments({
      companyId,
    });

    // Count total clients for the company
    const totalClients = await Client.countDocuments({
      companyId,
      isActive: true,
    });

    // Count total orders for the company
    const totalOrders = await Order.countDocuments({
      companyId,
    });

    // Calculate Monthly Revenue (delivered orders in current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueResult = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
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

    // Calculate New Leads (30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newLeads30d = await Client.countDocuments({
      companyId,
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate Pipeline Value (pending + processing orders)
    const pipelineResult = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
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

    // Count Active Tasks (todo + in_progress + review)
    const activeTasks = await Task.countDocuments({
      companyId,
      isActive: true,
      status: { $in: ['todo', 'in_progress', 'review'] },
    });

    // Calculate Revenue Trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const monthRevenue = await Order.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
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

    // Calculate Total Revenue, Avg Deal Size, Conversion Rate
    const allDeliveredOrders = await Order.find({
      companyId,
      status: 'delivered',
    }).lean();
    
    const totalRevenue = allDeliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgDealSize = allDeliveredOrders.length > 0 ? totalRevenue / allDeliveredOrders.length : 0;
    
    // Conversion rate: delivered orders / total orders
    const conversionRate = totalOrders > 0 ? (allDeliveredOrders.length / totalOrders) * 100 : 0;

    // Get Top Deals (top 5 orders by amount)
    const topDeals = await Order.find({ companyId })
      .populate('clientId', 'name email')
      .sort({ totalAmount: -1 })
      .limit(5)
      .lean();

    // Get recent activity from multiple sources
    const recentActivities = [];

    // Get recent messages (last 10)
    const recentMessages = await Message.find({ companyId })
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    recentMessages.forEach((msg) => {
      recentActivities.push({
        id: msg._id,
        type: 'message',
        employeeName: msg.senderId?.name || msg.senderId?.email || 'Unknown',
        activityType: msg.recipientId ? 'Sent a message' : 'Posted a company message',
        date: msg.createdAt,
        status: msg.isRead ? 'read' : 'unread',
        icon: 'message',
      });
    });

    // Get recent leads created (last 10)
    const recentLeads = await Client.find({ companyId, isActive: true })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    recentLeads.forEach((lead) => {
      recentActivities.push({
        id: lead._id,
        type: 'lead',
        employeeName: lead.assignedTo?.name || lead.assignedTo?.email || 'System',
        activityType: `Created a new lead: ${lead.name}`,
        date: lead.createdAt,
        status: lead.status || 'lead',
        icon: 'lead',
        leadName: lead.name,
      });
    });

    // Get recent orders created/updated (last 10)
    const recentOrders = await Order.find({ companyId })
      .populate('clientId', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    recentOrders.forEach((order) => {
      const isNew = order.createdAt.getTime() === order.updatedAt.getTime();
      recentActivities.push({
        id: order._id,
        type: 'order',
        employeeName: order.assignedTo?.name || order.assignedTo?.email || 'System',
        activityType: isNew 
          ? `Created order #${order.orderNumber}` 
          : `Updated order #${order.orderNumber}`,
        date: isNew ? order.createdAt : order.updatedAt,
        status: order.status,
        icon: 'order',
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        clientName: order.clientId?.name || order.clientId?.email || 'Unknown',
      });
    });

    // Get recent projects created/updated (last 10)
    const recentProjects = await Project.find({ companyId, isActive: true })
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    recentProjects.forEach((project) => {
      const isNew = project.createdAt.getTime() === project.updatedAt.getTime();
      recentActivities.push({
        id: project._id,
        type: 'project',
        employeeName: project.assignedTo?.name || project.assignedTo?.email || 'System',
        activityType: isNew 
          ? `Created project: ${project.name}` 
          : `Updated project: ${project.name}`,
        date: isNew ? project.createdAt : project.updatedAt,
        status: project.status,
        icon: 'project',
        projectName: project.name,
      });
    });

    // Get recent tasks created/updated (last 10)
    const recentTasks = await Task.find({ companyId, isActive: true })
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    recentTasks.forEach((task) => {
      const isNew = task.createdAt.getTime() === task.updatedAt.getTime();
      recentActivities.push({
        id: task._id,
        type: 'task',
        employeeName: task.assignedTo?.name || task.assignedTo?.email || 'System',
        activityType: isNew 
          ? `Created task: ${task.title}` 
          : `Updated task: ${task.title}`,
        date: isNew ? task.createdAt : task.updatedAt,
        status: task.status,
        icon: 'task',
        taskTitle: task.title,
        projectName: task.projectId?.name,
      });
    });

    // Sort all activities by date (most recent first) and limit to 15
    const recentActivity = recentActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);

    // Get company members count by role
    const membersByRole = await User.aggregate([
      { $unwind: '$companies' },
      {
        $match: {
          'companies.companyId': new mongoose.Types.ObjectId(companyId),
          'companies.isActive': true,
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$companies.role',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        role: 'company_admin',
        stats: {
          totalEmployees,
          unreadMessages,
          totalMessages,
          totalClients,
          totalOrders,
          monthlyRevenue,
          newLeads30d,
          pipelineValue,
          activeTasks,
          totalRevenue,
          avgDealSize,
          conversionRate,
          activeProjects: 0,
          pendingTasks: unreadMessages,
        },
        revenueTrend,
        recentActivity,
        topDeals: topDeals.map((deal) => ({
          id: deal._id,
          orderNumber: deal.orderNumber,
          clientName: deal.clientId?.name || deal.clientId?.email || 'Unknown',
          amount: deal.totalAmount,
          status: deal.status,
          createdAt: deal.createdAt,
        })),
        membersByRole: membersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching company admin dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
};

/**
 * Get dashboard statistics for Employee
 */
const getEmployeeDashboard = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userId = req.user._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log(`[getEmployeeDashboard] User: ${userId}, CompanyId: ${companyId}`);

    // Get assigned conversations (messages/chats)
    const assignedConversations = await Conversation.countDocuments({
      companyId,
      assignedRepresentative: userId,
      isActive: true,
    });
    console.log(`[getEmployeeDashboard] Assigned conversations: ${assignedConversations}`);

    // Get assigned leads
    const assignedLeads = await Client.countDocuments({
      companyId,
      assignedTo: userId,
      isActive: true,
    });

    // Get new leads assigned in last 30 days
    const newAssignedLeads30d = await Client.countDocuments({
      companyId,
      assignedTo: userId,
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get assigned orders
    const assignedOrders = await Order.countDocuments({
      companyId,
      assignedTo: userId,
    });

    // Get assigned orders revenue
    const assignedOrdersRevenue = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          assignedTo: new mongoose.Types.ObjectId(userId),
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
    const myRevenue = assignedOrdersRevenue[0]?.total || 0;

    // Get assigned tasks
    const assignedTasks = await Task.countDocuments({
      companyId,
      assignedTo: userId,
      isActive: true,
    });

    // Get active tasks (todo, in_progress, review)
    const activeTasks = await Task.countDocuments({
      companyId,
      assignedTo: userId,
      isActive: true,
      status: { $in: ['todo', 'in_progress', 'review'] },
    });

    // Get unread messages for user
    const unreadMessages = await Message.countDocuments({
      companyId,
      recipientId: userId,
      isRead: false,
    });

    // Get recent activity (assigned items only)
    const recentActivities = [];

    // Recent assigned leads
    const recentLeads = await Client.find({
      companyId,
      assignedTo: userId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentLeads.forEach((lead) => {
      recentActivities.push({
        id: lead._id,
        type: 'lead',
        activityType: `Assigned lead: ${lead.name}`,
        date: lead.createdAt,
        status: lead.status || 'new',
        icon: 'lead',
        leadName: lead.name,
      });
    });

    // Recent assigned orders
    const recentOrders = await Order.find({
      companyId,
      assignedTo: userId,
    })
      .populate('clientId', 'name email')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    recentOrders.forEach((order) => {
      recentActivities.push({
        id: order._id,
        type: 'order',
        activityType: `Order #${order.orderNumber}`,
        date: order.updatedAt,
        status: order.status,
        icon: 'order',
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        clientName: order.clientId?.name || order.clientId?.email || 'Unknown',
      });
    });

    // Recent assigned tasks
    const recentTasks = await Task.find({
      companyId,
      assignedTo: userId,
      isActive: true,
    })
      .populate('projectId', 'name')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    recentTasks.forEach((task) => {
      recentActivities.push({
        id: task._id,
        type: 'task',
        activityType: `Task: ${task.title}`,
        date: task.updatedAt,
        status: task.status,
        icon: 'task',
        taskTitle: task.title,
        projectName: task.projectId?.name,
        dueDate: task.dueDate,
      });
    });

    // Sort activities by date
    const recentActivity = recentActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        role: 'employee',
        stats: {
          assignedLeads,
          newAssignedLeads30d,
          assignedOrders,
          myRevenue,
          assignedTasks,
          activeTasks,
          unreadMessages,
          assignedConversations,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching employee dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
};

/**
 * Get dashboard statistics for Manager
 */
const getManagerDashboard = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userId = req.user._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get team members (employees under this manager)
    const teamMembersResult = await User.aggregate([
      { $unwind: '$companies' },
      {
        $match: {
          'companies.companyId': new mongoose.Types.ObjectId(companyId),
          'companies.role': { $in: ['employee', 'manager'] },
          'companies.isActive': true,
          isActive: true,
        },
      },
      { $count: 'total' },
    ]);
    const teamSize = teamMembersResult[0]?.total || 0;

    // Get team leads (all leads in company)
    const teamLeads = await Client.countDocuments({
      companyId,
      isActive: true,
    });

    // Get team orders
    const teamOrders = await Order.countDocuments({
      companyId,
    });

    // Get team revenue
    const teamRevenueResult = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
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
    const teamRevenue = teamRevenueResult[0]?.total || 0;

    // Get my assigned items
    const myLeads = await Client.countDocuments({
      companyId,
      assignedTo: userId,
      isActive: true,
    });

    const myOrders = await Order.countDocuments({
      companyId,
      assignedTo: userId,
    });

    const myTasks = await Task.countDocuments({
      companyId,
      assignedTo: userId,
      isActive: true,
    });

    const myActiveTasks = await Task.countDocuments({
      companyId,
      assignedTo: userId,
      isActive: true,
      status: { $in: ['todo', 'in_progress', 'review'] },
    });

    // Get unread messages
    const unreadMessages = await Message.countDocuments({
      companyId,
      recipientId: userId,
      isRead: false,
    });

    // Get recent activity (team-wide)
    const recentActivities = [];

    // Recent leads
    const recentLeads = await Client.find({ companyId, isActive: true })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    recentLeads.forEach((lead) => {
      recentActivities.push({
        id: lead._id,
        type: 'lead',
        employeeName: lead.assignedTo?.name || lead.assignedTo?.email || 'Unassigned',
        activityType: `New lead: ${lead.name}`,
        date: lead.createdAt,
        status: lead.status || 'new',
        icon: 'lead',
        leadName: lead.name,
      });
    });

    // Recent orders
    const recentOrders = await Order.find({ companyId })
      .populate('clientId', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    recentOrders.forEach((order) => {
      recentActivities.push({
        id: order._id,
        type: 'order',
        employeeName: order.assignedTo?.name || order.assignedTo?.email || 'Unassigned',
        activityType: `Order #${order.orderNumber}`,
        date: order.updatedAt,
        status: order.status,
        icon: 'order',
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        clientName: order.clientId?.name || order.clientId?.email || 'Unknown',
      });
    });

    // Recent tasks
    const recentTasks = await Task.find({ companyId, isActive: true })
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    recentTasks.forEach((task) => {
      recentActivities.push({
        id: task._id,
        type: 'task',
        employeeName: task.assignedTo?.name || task.assignedTo?.email || 'Unassigned',
        activityType: `Task: ${task.title}`,
        date: task.updatedAt,
        status: task.status,
        icon: 'task',
        taskTitle: task.title,
        projectName: task.projectId?.name,
      });
    });

    const recentActivity = recentActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);

    res.json({
      success: true,
      data: {
        role: 'manager',
        stats: {
          teamSize,
          teamLeads,
          teamOrders,
          teamRevenue,
          myLeads,
          myOrders,
          myTasks,
          myActiveTasks,
          unreadMessages,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching manager dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
};

/**
 * Get dashboard statistics for Client
 */
const getClientDashboard = async (req, res) => {
  try {
    const companyId = req.companyId;
    const userId = req.user._id;
    const userEmail = req.user.email;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    console.log(`[getClientDashboard] User: ${userId}, Email: ${userEmail}, Company: ${companyId}`);
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required for client dashboard',
      });
    }

    // Find Client records that match the user's email
    const clientRecords = await Client.find({
      companyId,
      email: userEmail,
      isActive: true,
    }).select('_id').lean();

    const clientIds = clientRecords.map((c) => c._id);

    // Get client's orders (orders where clientId matches a Client with user's email)
    const myOrders = await Order.find({
      companyId,
      clientId: { $in: clientIds },
    })
      .populate('assignedTo', 'name email')
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const totalOrders = myOrders.length;
    const pendingOrders = myOrders.filter((o) => ['pending', 'processing'].includes(o.status)).length;
    const completedOrders = myOrders.filter((o) => o.status === 'delivered').length;

    // Calculate total spent
    const totalSpent = myOrders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Get unread messages
    const unreadMessages = await Message.countDocuments({
      companyId,
      recipientId: userId,
      isRead: false,
    });

    // Get recent orders
    const recentOrders = myOrders.slice(0, 10).map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      assignedTo: order.assignedTo?.name || order.assignedTo?.email || 'N/A',
    }));

    // Get recent messages
    const recentMessages = await Message.find({
      companyId,
      $or: [
        { senderId: userId },
        { recipientId: userId },
      ],
    })
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentActivity = recentMessages.map((msg) => ({
      id: msg._id,
      type: 'message',
      activityType: msg.senderId?._id.toString() === userId.toString() ? 'You sent a message' : 'You received a message',
      date: msg.createdAt,
      status: msg.isRead ? 'read' : 'unread',
      icon: 'message',
      content: msg.subject,
    }));

    res.json({
      success: true,
      data: {
        role: 'client',
        stats: {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalSpent,
          unreadMessages,
        },
        recentOrders,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching client dashboard stats:', error);
    // Return empty but valid response instead of crashing
    return res.status(200).json({
      success: true,
      data: {
        role: 'client',
        stats: {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalSpent: 0,
          unreadMessages: 0,
        },
        recentOrders: [],
        recentActivity: [],
      },
    });
  }
};

