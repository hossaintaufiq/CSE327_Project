"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import { useNotifications } from "@/utils/useNotifications";
import Sidebar from "@/components/Sidebar";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Activity,
  ArrowRight,
  UserCheck,
  ShoppingCart,
  CheckSquare,
  MessageSquare,
  Briefcase,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, companies, isSuperAdmin } = useAuthStore();
  const { refreshNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topDeals, setTopDeals] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dashboardRole, setDashboardRole] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const checkAuthAndCompany = async () => {
      // Check if user is logged in
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }

      // If super admin, redirect to super-admin page
      if (isSuperAdmin()) {
        router.push("/super-admin");
        return;
      }

      // Parse user from localStorage to check companies
      try {
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const userCompanies = parsedUser.companies || [];
          const storedCompanyId = localStorage.getItem("companyId");

          // If no companies at all, redirect to company selection
          if (userCompanies.length === 0) {
            router.push("/company-selection");
            return;
          }

          // If has companies but no active company selected, redirect to company selection
          if (userCompanies.length > 0 && !storedCompanyId && !activeCompanyId) {
            router.push("/company-selection");
            return;
          }

          // If has companies and stored companyId but no activeCompanyId in store, set it
          if (userCompanies.length > 0 && storedCompanyId) {
            // Find company by ID - it should exist if stored
            const company = userCompanies.find((c) => c.companyId === storedCompanyId);
            if (company) {
              // Set active company if not already set or if different
              if (!activeCompanyId || activeCompanyId !== company.companyId) {
                useAuthStore.getState().setActiveCompany(company.companyId, company.role);
                // Wait for state to update before loading dashboard
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } else {
              // Stored companyId not found in user's companies, redirect to selection
              localStorage.removeItem("companyId");
              router.push("/company-selection");
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking user companies:", error);
        router.push("/company-selection");
        return;
      }

      // Load dashboard data if we have an active company
      const finalCompanyId = activeCompanyId || localStorage.getItem("companyId");
      if (finalCompanyId) {
        loadDashboardData();
      } else {
        setLoading(false);
      }
    };

    checkAuthAndCompany();

    // Listen for updates to refresh dashboard
    const handleClientUpdate = () => {
      const currentCompanyId = activeCompanyId || localStorage.getItem("companyId");
      if (currentCompanyId) {
        loadDashboardData();
      }
    };
    const handleOrderUpdate = () => {
      const currentCompanyId = activeCompanyId || localStorage.getItem("companyId");
      if (currentCompanyId) {
        loadDashboardData();
      }
    };
    const handleProjectUpdate = () => {
      const currentCompanyId = activeCompanyId || localStorage.getItem("companyId");
      if (currentCompanyId) {
        loadDashboardData();
      }
    };
    const handleTaskUpdate = () => {
      const currentCompanyId = activeCompanyId || localStorage.getItem("companyId");
      if (currentCompanyId) {
        loadDashboardData();
      }
    };
    window.addEventListener('clientUpdated', handleClientUpdate);
    window.addEventListener('orderUpdated', handleOrderUpdate);
    window.addEventListener('projectUpdated', handleProjectUpdate);
    window.addEventListener('taskUpdated', handleTaskUpdate);
    return () => {
      window.removeEventListener('clientUpdated', handleClientUpdate);
      window.removeEventListener('orderUpdated', handleOrderUpdate);
      window.removeEventListener('projectUpdated', handleProjectUpdate);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
    };
  }, [router, activeCompanyId, companies, isSuperAdmin]);

  const loadDashboardData = async () => {
    const companyId = activeCompanyId || localStorage.getItem("companyId");
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get("/dashboard/stats");
      if (response.data.success) {
        setDashboardRole(response.data.data.role || activeCompanyRole);
        setStats(response.data.data.stats);
        setRevenueTrend(response.data.data.revenueTrend || []);
        setRecentActivity(response.data.data.recentActivity || []);
        setTopDeals(response.data.data.topDeals || []);
        setRecentOrders(response.data.data.recentOrders || []);
      } else {
        console.error("Failed to load dashboard stats:", response.data);
        setStats({
          monthlyRevenue: 0,
          newLeads30d: 0,
          pipelineValue: 0,
          activeTasks: 0,
          totalRevenue: 0,
          avgDealSize: 0,
          conversionRate: 0,
        });
        setRevenueTrend([]);
        setRecentActivity([]);
        setTopDeals([]);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setStats({
        monthlyRevenue: 0,
        newLeads30d: 0,
        pipelineValue: 0,
        activeTasks: 0,
        totalRevenue: 0,
        avgDealSize: 0,
        conversionRate: 0,
      });
      setRevenueTrend([]);
      setRecentActivity([]);
      setTopDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatTimeAgo = (date) => {
    if (!date) return "N/A";
    const now = new Date();
    const dateObj = new Date(date);
    const diff = now - dateObj;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/20 text-green-400";
      case "processing":
        return "bg-blue-500/20 text-blue-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "shipped":
        return "bg-purple-500/20 text-purple-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "message":
        return "💬";
      case "lead":
        return "👤";
      case "order":
        return "🛒";
      case "project":
        return "📁";
      case "task":
        return "✅";
      default:
        return "📋";
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "message":
        return "text-blue-400";
      case "lead":
        return "text-green-400";
      case "order":
        return "text-purple-400";
      case "project":
        return "text-indigo-400";
      case "task":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeCompany = companies.find((c) => c.companyId === activeCompanyId);
  const role = dashboardRole || activeCompanyRole || 'employee';
  
  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...revenueTrend.map((r) => r.revenue), 1);

  // Render role-specific dashboard
  if (role === 'employee') {
    return <EmployeeDashboard user={user} stats={stats} recentActivity={recentActivity} formatCurrency={formatCurrency} formatTimeAgo={formatTimeAgo} getActivityIcon={getActivityIcon} getActivityColor={getActivityColor} />;
  } else if (role === 'manager') {
    return <ManagerDashboard user={user} stats={stats} recentActivity={recentActivity} formatCurrency={formatCurrency} formatTimeAgo={formatTimeAgo} getActivityIcon={getActivityIcon} getActivityColor={getActivityColor} />;
  } else if (role === 'client') {
    return <ClientDashboard user={user} stats={stats} recentOrders={recentOrders} recentActivity={recentActivity} formatCurrency={formatCurrency} formatTimeAgo={formatTimeAgo} getStatusColor={getStatusColor} />;
  }

  // Company Admin Dashboard (default)
  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {activeCompany?.companyName || "Company"} Dashboard
            </h1>
            <p className="text-gray-400">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Monthly Revenue */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+12%</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Monthly Revenue</h3>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
            </div>

            {/* New Leads (30d) */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+8%</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">New Leads (30d)</h3>
              <p className="text-3xl font-bold text-white">{stats?.newLeads30d || 0}</p>
            </div>

            {/* Pipeline Value */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">0% conv.</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Pipeline Value</h3>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats?.pipelineValue || 0)}</p>
            </div>

            {/* Active Tasks */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">0/0 done</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Active Tasks</h3>
              <p className="text-3xl font-bold text-white">{stats?.activeTasks || 0}</p>
            </div>
          </div>

          {/* Bottom Section: Revenue Trend and Activity/Deals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend - Takes 2 columns */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Revenue Trend</h2>
                <span className="text-sm text-gray-400">Last 6 months</span>
              </div>
              
              {/* Simple Line Chart */}
              <div className="h-64 mb-6 relative">
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={40 + i * 40}
                      x2="600"
                      y2={40 + i * 40}
                      stroke="rgb(55, 65, 81)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Area under line */}
                  <path
                    d={`M 0,${200 - (revenueTrend[0]?.revenue || 0) / maxRevenue * 160} ${revenueTrend.map((r, i) => `L ${100 + i * 100},${200 - (r.revenue / maxRevenue) * 160}`).join(' ')} L ${100 + (revenueTrend.length - 1) * 100},200 L 0,200 Z`}
                    fill="url(#gradient)"
                  />
                  {/* Line */}
                  <polyline
                    points={revenueTrend.map((r, i) => `${100 + i * 100},${200 - (r.revenue / maxRevenue) * 160}`).join(' ')}
                    fill="none"
                    stroke="rgb(168, 85, 247)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Data points */}
                  {revenueTrend.map((r, i) => (
                    <circle
                      key={i}
                      cx={100 + i * 100}
                      cy={200 - (r.revenue / maxRevenue) * 160}
                      r="4"
                      fill="rgb(168, 85, 247)"
                    />
                  ))}
                </svg>
                {/* Month labels */}
                <div className="flex justify-between mt-2">
                  {revenueTrend.map((r, i) => (
                    <span key={i} className="text-xs text-gray-400">{r.month}</span>
                  ))}
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-700">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Avg Deal Size</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(stats?.avgDealSize || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Conversion Rate</p>
                  <p className="text-xl font-bold text-white">{stats?.conversionRate?.toFixed(0) || 0}%</p>
                </div>
              </div>
            </div>

            {/* Right Column: Recent Activity and Top Deals */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                  <Activity className="w-5 h-5 text-gray-400" />
                </div>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No recent activities</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentActivity.slice(0, 8).map((activity) => (
                      <div 
                        key={`${activity.type}-${activity.id}`} 
                        className="flex gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className={`text-xl ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {activity.employeeName}
                          </p>
                          <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                            {activity.activityType}
                          </p>
                          {activity.type === 'order' && activity.amount && (
                            <p className="text-blue-400 text-xs mt-1 font-medium">
                              ${activity.amount.toFixed(2)}
                            </p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            {formatTimeAgo(activity.date)}
                          </p>
                        </div>
                        {activity.status && (
                          <div className="shrink-0">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                              {activity.status}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Deals */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">Top Deals</h2>
                  <a href="/orders" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
                {topDeals.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No deals yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topDeals.map((deal) => (
                      <div key={deal.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-white font-medium">{deal.clientName}</p>
                          <p className="text-gray-400 text-sm">{deal.orderNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(deal.amount)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(deal.status)}`}>
                            {deal.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Employee Dashboard Component
function EmployeeDashboard({ user, stats, recentActivity, formatCurrency, formatTimeAgo, getActivityIcon, getActivityColor }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.name || user?.email}</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <UserCheck className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">My Leads</h3>
              <p className="text-3xl font-bold text-white">{stats?.assignedLeads || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{stats?.newAssignedLeads30d || 0} new (30d)</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">My Orders</h3>
              <p className="text-3xl font-bold text-white">{stats?.assignedOrders || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats?.myRevenue || 0)} revenue</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">My Tasks</h3>
              <p className="text-3xl font-bold text-white">{stats?.assignedTasks || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{stats?.activeTasks || 0} active</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Unread Messages</h3>
              <p className="text-3xl font-bold text-white">{stats?.unreadMessages || 0}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No recent activities</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div key={activity.id || idx} className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <div className={`text-xl ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{activity.activityType}</p>
                      {activity.leadName && <p className="text-gray-400 text-xs mt-1">Lead: {activity.leadName}</p>}
                      {activity.orderNumber && <p className="text-gray-400 text-xs mt-1">Order: {activity.orderNumber}</p>}
                      {activity.taskTitle && <p className="text-gray-400 text-xs mt-1">Task: {activity.taskTitle}</p>}
                      {activity.dueDate && (
                        <p className="text-yellow-400 text-xs mt-1">
                          Due: {new Date(activity.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">{formatTimeAgo(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Manager Dashboard Component
function ManagerDashboard({ user, stats, recentActivity, formatCurrency, formatTimeAgo, getActivityIcon, getActivityColor }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Manager Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.name || user?.email}</p>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Team Size</h3>
              <p className="text-3xl font-bold text-white">{stats?.teamSize || 0}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Team Leads</h3>
              <p className="text-3xl font-bold text-white">{stats?.teamLeads || 0}</p>
              <p className="text-xs text-gray-500 mt-1">My leads: {stats?.myLeads || 0}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Team Orders</h3>
              <p className="text-3xl font-bold text-white">{stats?.teamOrders || 0}</p>
              <p className="text-xs text-gray-500 mt-1">My orders: {stats?.myOrders || 0}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Team Revenue</h3>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats?.teamRevenue || 0)}</p>
            </div>
          </div>

          {/* My Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">My Tasks</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Tasks</span>
                  <span className="text-white font-bold">{stats?.myTasks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Tasks</span>
                  <span className="text-orange-400 font-bold">{stats?.myActiveTasks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Unread Messages</span>
                  <span className="text-purple-400 font-bold">{stats?.unreadMessages || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Team Activity</h2>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No recent activities</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity.map((activity, idx) => (
                  <div key={activity.id || idx} className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <div className={`text-xl ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{activity.employeeName || 'System'}</p>
                      <p className="text-gray-300 text-xs mt-1">{activity.activityType}</p>
                      {activity.leadName && <p className="text-gray-400 text-xs mt-1">Lead: {activity.leadName}</p>}
                      {activity.orderNumber && (
                        <p className="text-gray-400 text-xs mt-1">
                          Order: {activity.orderNumber} - {formatCurrency(activity.amount || 0)}
                        </p>
                      )}
                      {activity.taskTitle && <p className="text-gray-400 text-xs mt-1">Task: {activity.taskTitle}</p>}
                      <p className="text-gray-500 text-xs mt-1">{formatTimeAgo(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Client Dashboard Component
function ClientDashboard({ user, stats, recentOrders, recentActivity, formatCurrency, formatTimeAgo, getStatusColor }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.name || user?.email}</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Total Orders</h3>
              <p className="text-3xl font-bold text-white">{stats?.totalOrders || 0}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Pending Orders</h3>
              <p className="text-3xl font-bold text-white">{stats?.pendingOrders || 0}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Completed</h3>
              <p className="text-3xl font-bold text-white">{stats?.completedOrders || 0}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Total Spent</h3>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats?.totalSpent || 0)}</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Orders</h2>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">Order #{order.orderNumber}</p>
                          <p className="text-gray-400 text-sm mt-1">Assigned to: {order.assignedTo}</p>
                          <p className="text-gray-500 text-xs mt-1">{formatTimeAgo(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(order.totalAmount)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Messages */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Messages</h2>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={activity.id || idx} className="bg-gray-700/50 rounded-lg p-4">
                      <p className="text-white font-medium text-sm">{activity.activityType}</p>
                      <p className="text-gray-400 text-xs mt-1">{activity.content}</p>
                      <p className="text-gray-500 text-xs mt-1">{formatTimeAgo(activity.date)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
