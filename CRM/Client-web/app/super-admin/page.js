"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/utils/api";
import useAuthStore from "@/store/authStore";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import {
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  UserCheck,
  Target,
  Activity,
  ArrowRight,
  MessageSquare,
  CreditCard,
  Bell,
  Shield,
  Database,
  ToggleLeft,
  HeadphonesIcon,
  FileText,
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";

function SuperAdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSuperAdmin } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard Data
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [dailySignups, setDailySignups] = useState([]);

  // Companies Data
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);

  // Users Data
  const [allUsers, setAllUsers] = useState([]);
  const [searchUserTerm, setSearchUserTerm] = useState("");

  // Subscriptions Data
  const [subscriptions, setSubscriptions] = useState([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);

  // Activity Logs Data
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState([]);

  // Issues Data
  const [issues, setIssues] = useState([]);
  const [disputes, setDisputes] = useState([]);

  // Announcements Data
  const [announcements, setAnnouncements] = useState([]);

  // Platform Settings Data
  const [platformSettings, setPlatformSettings] = useState({});

  // Feature Toggles Data
  const [featureToggles, setFeatureToggles] = useState([]);

  // Database Monitor Data
  const [dbStats, setDbStats] = useState(null);
  const [apiHitRate, setApiHitRate] = useState([]);

  useEffect(() => {
    const tab = searchParams?.get("tab") || "dashboard";
    setActiveTab(tab);
    
    if (tab === "companies") {
      loadCompanies();
    } else if (tab === "users") {
      loadUsers();
    } else if (tab === "subscriptions") {
      loadSubscriptions();
    } else if (tab === "activity") {
      loadActivityLogs();
    } else if (tab === "issues") {
      loadIssues();
    } else if (tab === "announcements") {
      loadAnnouncements();
    } else if (tab === "settings") {
      loadPlatformSettings();
    } else if (tab === "features") {
      loadFeatureToggles();
    } else if (tab === "database") {
      loadDatabaseStats();
    }
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        
        if (parsedUser.globalRole !== 'super_admin') {
          router.push("/dashboard");
          return;
        }

        setIsAuthorized(true);
        if (activeTab === "dashboard") {
          loadDashboardData();
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/super-admin/stats");
      if (response.data.success) {
        setStats(response.data.data.stats);
        setRevenueTrend(response.data.data.revenueTrend || []);
        setRecentActivity(response.data.data.recentActivity || []);
        setTopCompanies(response.data.data.topCompanies || []);
        setDailySignups(response.data.data.dailySignups || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/super-admin/companies");
      if (response.data.success) {
        setAllCompanies(response.data.data.companies || []);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/super-admin/users");
      if (response.data.success) {
        setAllUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const [subsRes, renewalsRes, failedRes] = await Promise.all([
        apiClient.get("/super-admin/subscriptions"),
        apiClient.get("/super-admin/subscriptions/renewals"),
        apiClient.get("/super-admin/subscriptions/failed-payments"),
      ]);
      if (subsRes.data.success) {
        setSubscriptions(subsRes.data.data.subscriptions || []);
      }
      if (renewalsRes.data.success) {
        setUpcomingRenewals(renewalsRes.data.data.renewals || []);
      }
      if (failedRes.data.success) {
        setFailedPayments(failedRes.data.data.subscriptions || []);
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, loginRes, suspiciousRes] = await Promise.all([
        apiClient.get("/super-admin/activity-logs?limit=100"),
        apiClient.get("/super-admin/activity-logs/login-history"),
        apiClient.get("/super-admin/activity-logs/suspicious"),
      ]);
      if (logsRes.data.success) {
        setActivityLogs(logsRes.data.data.logs || []);
      }
      if (loginRes.data.success) {
        setLoginHistory(loginRes.data.data.logs || []);
      }
      if (suspiciousRes.data.success) {
        setSuspiciousActivity(suspiciousRes.data.data.logs || []);
      }
    } catch (error) {
      console.error("Error loading activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadIssues = async () => {
    try {
      setLoading(true);
      const [issuesRes, disputesRes] = await Promise.all([
        apiClient.get("/super-admin/issues"),
        apiClient.get("/super-admin/issues/disputes"),
      ]);
      if (issuesRes.data.success) {
        setIssues(issuesRes.data.data.issues || []);
      }
      if (disputesRes.data.success) {
        setDisputes(disputesRes.data.data.disputes || []);
      }
    } catch (error) {
      console.error("Error loading issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/super-admin/announcements");
      if (response.data.success) {
        setAnnouncements(response.data.data.announcements || []);
      }
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlatformSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/super-admin/settings");
      if (response.data.success) {
        setPlatformSettings(response.data.data.settings || {});
      }
    } catch (error) {
      console.error("Error loading platform settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatureToggles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/super-admin/features");
      if (response.data.success) {
        setFeatureToggles(response.data.data.toggles || []);
      }
    } catch (error) {
      console.error("Error loading feature toggles:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      setLoading(true);
      const [statsRes, hitRateRes] = await Promise.all([
        apiClient.get("/super-admin/database/stats"),
        apiClient.get("/super-admin/database/api-hit-rate"),
      ]);
      if (statsRes.data.success) {
        setDbStats(statsRes.data.data);
      }
      if (hitRateRes.data.success) {
        setApiHitRate(hitRateRes.data.data.hitRate || []);
      }
    } catch (error) {
      console.error("Error loading database stats:", error);
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

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!mounted || loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueTrend.map((r) => r.revenue), 1);

  return (
    <div className="min-h-screen bg-gray-900">
      <SuperAdminSidebar />

      <main className="lg:ml-64 min-h-screen">
        <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Platform-wide management and analytics</p>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <>
              {/* Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Total Companies</h3>
                  <p className="text-3xl font-bold text-white">{stats?.totalCompanies || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.inactiveCompanies || 0} inactive
                  </p>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Users className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Total Users</h3>
                  <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.newUsers30d || 0} new (30d)
                  </p>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Subscription Revenue</h3>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats?.subscriptionRevenue || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">Monthly recurring</p>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <Activity className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">System Health</h3>
                  <p className="text-lg font-bold text-green-400">Healthy</p>
                  <p className="text-xs text-gray-500 mt-1">All systems operational</p>
                </div>
              </div>

              {/* Daily Signups Chart */}
              {dailySignups.length > 0 && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
                  <h2 className="text-xl font-bold text-white mb-6">Daily Signups (Last 7 Days)</h2>
                  <div className="h-64 relative">
                    <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="signupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={40 + i * 40}
                          x2="700"
                          y2={40 + i * 40}
                          stroke="rgb(55, 65, 81)"
                          strokeWidth="1"
                        />
                      ))}
                      <path
                        d={`M 0,${200 - (dailySignups[0]?.count || 0) / Math.max(...dailySignups.map(d => d.count), 1) * 160} ${dailySignups.map((d, i) => `L ${100 + i * 100},${200 - (d.count / Math.max(...dailySignups.map(d => d.count), 1)) * 160}`).join(' ')} L ${100 + (dailySignups.length - 1) * 100},200 L 0,200 Z`}
                        fill="url(#signupGradient)"
                      />
                      <polyline
                        points={dailySignups.map((d, i) => `${100 + i * 100},${200 - (d.count / Math.max(...dailySignups.map(d => d.count), 1)) * 160}`).join(' ')}
                        fill="none"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {dailySignups.map((d, i) => (
                        <circle
                          key={i}
                          cx={100 + i * 100}
                          cy={200 - (d.count / Math.max(...dailySignups.map(d => d.count), 1)) * 160}
                          r="4"
                          fill="rgb(59, 130, 246)"
                        />
                      ))}
                    </svg>
                    <div className="flex justify-between mt-2">
                      {dailySignups.map((d, i) => (
                        <span key={i} className="text-xs text-gray-400">
                          {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Trend and Top Companies */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Revenue Trend</h2>
                    <span className="text-sm text-gray-400">Last 6 months</span>
                  </div>
                  
                  <div className="h-64 mb-6 relative">
                    <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradient-super" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
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
                      <path
                        d={`M 0,${200 - (revenueTrend[0]?.revenue || 0) / maxRevenue * 160} ${revenueTrend.map((r, i) => `L ${100 + i * 100},${200 - (r.revenue / maxRevenue) * 160}`).join(' ')} L ${100 + (revenueTrend.length - 1) * 100},200 L 0,200 Z`}
                        fill="url(#gradient-super)"
                      />
                      <polyline
                        points={revenueTrend.map((r, i) => `${100 + i * 100},${200 - (r.revenue / maxRevenue) * 160}`).join(' ')}
                        fill="none"
                        stroke="rgb(168, 85, 247)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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
                    <div className="flex justify-between mt-2">
                      {revenueTrend.map((r, i) => (
                        <span key={i} className="text-xs text-gray-400">{r.month}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-700">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Monthly Revenue</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Avg Deal Size</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(stats?.avgDealSize || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                      <Activity className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {recentActivity.slice(0, 8).map((activity, idx) => (
                        <div key={activity.id || idx} className="flex gap-3 p-3 bg-gray-700/50 rounded-lg">
                          <div className="text-xl">📋</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {activity.userName || activity.employeeName || 'System'}
                            </p>
                            <p className="text-gray-300 text-xs line-clamp-2">
                              {activity.description || activity.activityType}
                            </p>
                            {activity.companyName && (
                              <p className="text-gray-500 text-xs mt-1">{activity.companyName}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">{formatTimeAgo(activity.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold text-white">Top Companies</h2>
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-3">
                      {topCompanies.slice(0, 5).map((company) => (
                        <div key={company.id} className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white font-medium">{company.name}</p>
                            <p className="text-gray-400 text-sm">{company.orderCount} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{formatCurrency(company.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Companies Tab */}
          {activeTab === "companies" && (
            <CompaniesTab
              companies={allCompanies}
              loading={loading}
              onCompanySelect={setSelectedCompany}
              selectedCompany={selectedCompany}
              companyDetails={companyDetails}
              onLoadDetails={async (companyId) => {
                try {
                  const response = await apiClient.get(`/super-admin/companies/${companyId}`);
                  if (response.data.success) {
                    setCompanyDetails(response.data.data.company);
                  }
                } catch (error) {
                  console.error("Error loading company details:", error);
                }
              }}
            />
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <UsersTab
              users={allUsers}
              loading={loading}
              searchTerm={searchUserTerm}
              onSearchChange={setSearchUserTerm}
            />
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <SubscriptionsTab
              subscriptions={subscriptions}
              upcomingRenewals={upcomingRenewals}
              failedPayments={failedPayments}
              loading={loading}
            />
          )}

          {/* Activity Logs Tab */}
          {activeTab === "activity" && (
            <ActivityLogsTab
              logs={activityLogs}
              loginHistory={loginHistory}
              suspiciousActivity={suspiciousActivity}
              loading={loading}
            />
          )}

          {/* Issues Tab */}
          {activeTab === "issues" && (
            <IssuesTab
              issues={issues}
              disputes={disputes}
              loading={loading}
            />
          )}

          {/* Announcements Tab */}
          {activeTab === "announcements" && (
            <AnnouncementsTab
              announcements={announcements}
              loading={loading}
              onReload={loadAnnouncements}
            />
          )}

          {/* Platform Settings Tab */}
          {activeTab === "settings" && (
            <PlatformSettingsTab
              settings={platformSettings}
              loading={loading}
              onReload={loadPlatformSettings}
            />
          )}

          {/* Feature Toggles Tab */}
          {activeTab === "features" && (
            <FeatureTogglesTab
              toggles={featureToggles}
              loading={loading}
              onReload={loadFeatureToggles}
            />
          )}

          {/* Database Monitor Tab */}
          {activeTab === "database" && (
            <DatabaseMonitorTab
              dbStats={dbStats}
              apiHitRate={apiHitRate}
              loading={loading}
            />
          )}

          {/* Admin Accounts Tab */}
          {activeTab === "admins" && (
            <AdminAccountsTab loading={loading} />
          )}
        </div>
      </main>
    </div>
  );
}

// Companies Tab Component
function CompaniesTab({ companies, loading, onCompanySelect, selectedCompany, companyDetails, onLoadDetails }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({ name: "", domain: "" });
  const [submitting, setSubmitting] = useState(false);

  const filteredCompanies = companies.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = async (company) => {
    onCompanySelect(company);
    await onLoadDetails(company.id);
  };

  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">All Companies</h2>
            <div className="space-y-4">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(company)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                      <p className="text-sm text-gray-400">{company.domain || "No domain"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Admin: {company.admin?.name || company.admin?.email}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCompany(company);
                        setFormData({ name: company.name, domain: company.domain || "" });
                      }}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedCompany && companyDetails && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Company Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Company Name</label>
                <p className="text-white font-medium">{companyDetails.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Domain</label>
                <p className="text-white font-medium">{companyDetails.domain || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Members</label>
                <p className="text-white font-medium">{companyDetails.members?.length || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users, loading, searchTerm, onSearchChange }) {
  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">All Users</h2>
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{user.name || "No Name"}</h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Companies: {user.companies?.length || 0}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  user.globalRole === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.globalRole}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Subscriptions Tab Component
function SubscriptionsTab({ subscriptions, upcomingRenewals, failedPayments, loading }) {
  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Subscriptions</h3>
          <p className="text-3xl font-bold text-white">{subscriptions.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Upcoming Renewals</h3>
          <p className="text-3xl font-bold text-white">{upcomingRenewals.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Failed Payments</h3>
          <p className="text-3xl font-bold text-red-400">{failedPayments.length}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">All Subscriptions</h2>
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{sub.companyId?.name || "Unknown"}</h3>
                  <p className="text-sm text-gray-400">Plan: {sub.plan} | Status: {sub.status}</p>
                  <p className="text-sm text-gray-400">${sub.amount}/{sub.billingCycle}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  sub.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {sub.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Activity Logs Tab Component
function ActivityLogsTab({ logs, loginHistory, suspiciousActivity, loading }) {
  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">All Activity Logs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log._id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
              <p className="text-white text-sm">{log.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {log.userId?.name || log.userId?.email || 'System'} • {log.companyId?.name || 'System'} • {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Issues Tab Component
function IssuesTab({ issues, disputes, loading }) {
  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">All Issues</h2>
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
                  <p className="text-sm text-gray-400">{issue.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {issue.companyId?.name || 'System'} • {issue.category} • {issue.priority}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  issue.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {issue.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Announcements Tab Component
function AnnouncementsTab({ announcements, loading, onReload }) {
  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          Create Announcement
        </button>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Announcements</h2>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
              <p className="text-sm text-gray-400 mt-2">{announcement.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                Target: {announcement.targetType} • Type: {announcement.type}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Platform Settings Tab Component
function PlatformSettingsTab({ settings, loading, onReload }) {
  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-6">Platform Settings</h2>
      <p className="text-gray-400">Settings management interface coming soon...</p>
    </div>
  );
}

// Feature Toggles Tab Component
function FeatureTogglesTab({ toggles, loading, onReload }) {
  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-6">Feature Toggles</h2>
      <div className="space-y-4">
        {toggles.map((toggle) => (
          <div key={toggle._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">{toggle.feature}</h3>
              <p className="text-sm text-gray-400">{toggle.description}</p>
            </div>
            <span className={`px-3 py-1 rounded text-sm ${
              toggle.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {toggle.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Database Monitor Tab Component
function DatabaseMonitorTab({ dbStats, apiHitRate, loading }) {
  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Records</h3>
          <p className="text-3xl font-bold text-white">{dbStats?.totalRecordsCount || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Storage (Est.)</h3>
          <p className="text-3xl font-bold text-white">{dbStats?.estimatedStorageMB || 0} MB</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Companies</h3>
          <p className="text-3xl font-bold text-white">{dbStats?.totalRecords?.companies || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Users</h3>
          <p className="text-3xl font-bold text-white">{dbStats?.totalRecords?.users || 0}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Company Database Load</h2>
        <div className="space-y-4">
          {dbStats?.companyLoads?.slice(0, 10).map((load) => (
            <div key={load.companyId} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">{load.companyName}</h3>
                  <p className="text-sm text-gray-400">
                    {load.breakdown.clients} clients • {load.breakdown.orders} orders • {load.breakdown.projects} projects
                  </p>
                </div>
                <p className="text-xl font-bold text-white">{load.totalRecords} records</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Admin Accounts Tab Component
function AdminAccountsTab({ loading }) {
  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-6">Admin Accounts</h2>
      <p className="text-gray-400">Admin account management coming soon...</p>
    </div>
  );
}

function SuperAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>}>
      <SuperAdminPageContent />
    </Suspense>
  );
}

export default SuperAdminPage;
