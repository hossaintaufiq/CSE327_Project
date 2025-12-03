"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import { Settings, Bell, ToggleLeft, ToggleRight, Save, Mail, ShoppingCart, UserCheck, FolderKanban, CheckSquare, RefreshCw, AlertCircle, CheckCircle, X } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    notifications: {
      emailNotifications: true,
      orderNotifications: true,
      leadNotifications: true,
      taskNotifications: true,
      projectNotifications: true,
    },
    features: {
      enableProjects: true,
      enableTasks: true,
      enableOrders: true,
      enableLeads: true,
    },
    preferences: {
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      currency: "USD",
    },
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isSuperAdmin()) {
      router.push("/super-admin");
      return;
    }
    if (!activeCompanyId) {
      router.push("/company-selection");
      return;
    }
    if (activeCompanyRole !== "company_admin") {
      router.push("/dashboard");
      return;
    }
    loadSettings();
  }, [activeCompanyId, router, isSuperAdmin, activeCompanyRole]);

  const loadSettings = async (showError = true) => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const response = await apiClient.get("/company/settings");
      if (response?.data?.success === true) {
        const loadedSettings = response.data.data.settings;
        setSettings(loadedSettings);
        setFormData({
          notifications: loadedSettings.notifications || formData.notifications,
          features: loadedSettings.features || formData.features,
          preferences: loadedSettings.preferences || formData.preferences,
        });
      } else {
        const errorMsg = response?.data?.message || response?.data?.error?.message || "Failed to load settings";
        if (showError) {
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      let errorMessage = "Failed to load settings. Please try again.";
      if (error.response) {
        const errorData = error.response.data;
        errorMessage = errorData?.message || 
                      errorData?.error?.message || 
                      `Server error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message.includes("Network") 
          ? "Network error. Please check your connection."
          : error.message;
      }
      if (showError) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const response = await apiClient.put("/company/settings", formData);
      if (response?.data?.success === true) {
        setSuccessMessage("Settings saved successfully!");
        setError("");
        await loadSettings(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorMsg = response?.data?.error?.message || 
                        response?.data?.message || 
                        "Failed to update settings. Please try again.";
        setError(errorMsg);
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      let errorMessage = "Failed to update settings";
      if (error.response) {
        const errorData = error.response.data;
        errorMessage = errorData?.message ||
                      errorData?.error?.message ||
                      errorData?.error?.code ||
                      `Server error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      setSuccessMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleNotification = (key) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [key]: !formData.notifications[key],
      },
    });
  };

  const toggleFeature = (key) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [key]: !formData.features[key],
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen pt-[60px]">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-400">Manage your company settings and preferences</p>
            </div>
            <button
              onClick={() => loadSettings()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
              title="Refresh settings"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <p className="text-green-400">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-green-400 hover:text-green-300 shrink-0"
                aria-label="Dismiss success message"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-400">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-300 shrink-0"
                aria-label="Dismiss error"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Notifications Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Notifications</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-white font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-400">Receive email notifications for important updates</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification("emailNotifications")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.notifications.emailNotifications ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-white font-medium">Order Notifications</h3>
                      <p className="text-sm text-gray-400">Get notified when orders are created or updated</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification("orderNotifications")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.notifications.orderNotifications ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-white font-medium">Lead Notifications</h3>
                      <p className="text-sm text-gray-400">Get notified when new leads are added</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification("leadNotifications")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.notifications.leadNotifications ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-white font-medium">Task Notifications</h3>
                      <p className="text-sm text-gray-400">Get notified when tasks are assigned or updated</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification("taskNotifications")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.notifications.taskNotifications ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-white font-medium">Project Notifications</h3>
                      <p className="text-sm text-gray-400">Get notified when projects are created or updated</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification("projectNotifications")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.notifications.projectNotifications ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Features</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Enable Projects</h3>
                    <p className="text-sm text-gray-400">Allow project management features</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeature("enableProjects")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.features.enableProjects ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Enable Tasks</h3>
                    <p className="text-sm text-gray-400">Allow task management features</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeature("enableTasks")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.features.enableTasks ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Enable Orders</h3>
                    <p className="text-sm text-gray-400">Allow order management features</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeature("enableOrders")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.features.enableOrders ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Enable Leads</h3>
                    <p className="text-sm text-gray-400">Allow lead management features</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeature("enableLeads")}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formData.features.enableLeads ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Preferences</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                  <select
                    value={formData.preferences.timezone}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, timezone: e.target.value },
                    })}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Dhaka">Dhaka</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
                  <select
                    value={formData.preferences.dateFormat}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, dateFormat: e.target.value },
                    })}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD MMM YYYY">DD MMM YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                  <select
                    value={formData.preferences.currency}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, currency: e.target.value },
                    })}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="BDT">BDT (৳)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {submitting ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
