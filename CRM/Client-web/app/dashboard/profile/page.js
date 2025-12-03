"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import { User, Mail, Phone, Building, Calendar, Save, Camera, ArrowLeft, Shield, Briefcase, RefreshCw, AlertCircle, CheckCircle, X, Send, Link2, Unlink, ExternalLink, Copy, Clock } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, isSuperAdmin, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "",
    bio: "",
    avatar: "",
  });
  
  // Telegram linking state
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramLink, setTelegramLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Super admin goes to super-admin page
    if (isSuperAdmin()) {
      router.push("/super-admin");
      return;
    }
    
    loadProfile();
  }, [router, isSuperAdmin]);

  const loadProfile = async (showError = true) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const response = await apiClient.get("/auth/me");
      if (response?.data?.success === true) {
        const userData = response.data.data.user;
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          jobTitle: userData.jobTitle || "",
          department: userData.department || "",
          bio: userData.bio || "",
          avatar: userData.avatar || "",
        });
      } else {
        const errorMsg = response?.data?.message || 
                        response?.data?.error?.message || 
                        "Failed to load profile";
        if (showError) {
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      let errorMessage = "Failed to load profile. Please try again.";
      if (err.response) {
        const errorData = err.response.data;
        errorMessage = errorData?.message || 
                      errorData?.error?.message || 
                      `Server error: ${err.response.status}`;
      } else if (err.message) {
        errorMessage = err.message.includes("Network") 
          ? "Network error. Please check your connection."
          : err.message;
      }
      if (showError) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load Telegram link status
  const loadTelegramStatus = async () => {
    try {
      const response = await apiClient.get("/telegram/link-status");
      if (response?.data?.success) {
        setTelegramStatus(response.data.data);
      }
    } catch (err) {
      console.error("Error loading Telegram status:", err);
    }
  };

  // Generate Telegram link code
  const generateTelegramLink = async () => {
    try {
      setTelegramLoading(true);
      const response = await apiClient.post("/telegram/generate-link");
      if (response?.data?.success) {
        setTelegramLink(response.data.data);
      } else {
        setError(response?.data?.message || "Failed to generate link");
      }
    } catch (err) {
      console.error("Error generating Telegram link:", err);
      setError(err.response?.data?.message || "Failed to generate Telegram link");
    } finally {
      setTelegramLoading(false);
    }
  };

  // Unlink Telegram
  const unlinkTelegram = async () => {
    try {
      setTelegramLoading(true);
      const response = await apiClient.delete("/telegram/unlink");
      if (response?.data?.success) {
        setTelegramStatus(prev => ({ ...prev, linked: false, username: null, linkedAt: null }));
        setTelegramLink(null);
        setSuccess("Telegram unlinked successfully");
      } else {
        setError(response?.data?.message || "Failed to unlink Telegram");
      }
    } catch (err) {
      console.error("Error unlinking Telegram:", err);
      setError(err.response?.data?.message || "Failed to unlink Telegram");
    } finally {
      setTelegramLoading(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    loadTelegramStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (saving) return;
    
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiClient.put("/auth/profile", {
        name: formData.name,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        department: formData.department,
        bio: formData.bio,
        avatar: formData.avatar,
      });

      if (response?.data?.success === true) {
        setSuccess("Profile updated successfully!");
        setError("");
        // Update user in store
        const updatedUser = { ...user, ...formData };
        setUser(updatedUser);
        // Update localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMsg = response?.data?.error?.message || 
                        response?.data?.message || 
                        "Failed to update profile. Please try again.";
        setError(errorMsg);
        setSuccess("");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      let errorMessage = "Failed to update profile";
      if (err.response) {
        const errorData = err.response.data;
        errorMessage = errorData?.message ||
                      errorData?.error?.message ||
                      errorData?.error?.code ||
                      `Server error: ${err.response.status}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setSuccess("");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      company_admin: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "Company Admin", icon: Shield },
      manager: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Manager", icon: Briefcase },
      employee: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Employee", icon: User },
      client: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Client", icon: User },
    };
    return badges[role] || badges.employee;
  };

  const roleBadge = getRoleBadge(activeCompanyRole);
  const RoleIcon = roleBadge.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen pt-[60px]">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                <p className="text-gray-400">Manage your personal information</p>
              </div>
            </div>
            <button
              onClick={() => loadProfile()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
              title="Refresh profile"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

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

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <p className="text-green-400">{success}</p>
              </div>
              <button
                onClick={() => setSuccess("")}
                className="text-green-400 hover:text-green-300 shrink-0"
                aria-label="Dismiss success message"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt={formData.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-bold text-white">
                          {formData.name?.charAt(0)?.toUpperCase() || formData.email?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-1">{formData.name || "User"}</h2>
                  <p className="text-gray-400 mb-4">{formData.email}</p>

                  {/* Role Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${roleBadge.color}`}>
                    <RoleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{roleBadge.label}</span>
                  </div>

                  {/* Stats */}
                  <div className="w-full mt-6 pt-6 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">{user?.companies?.length || 1}</p>
                        <p className="text-sm text-gray-400">Companies</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {user?.createdAt ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0}
                        </p>
                        <p className="text-sm text-gray-400">Days Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-6">Edit Profile</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="Your full name"
                      />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 bg-gray-600 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    {/* Job Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Briefcase className="w-4 h-4 inline mr-2" />
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Sales Manager"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Building className="w-4 h-4 inline mr-2" />
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Sales, Marketing"
                      />
                    </div>

                    {/* Avatar URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Camera className="w-4 h-4 inline mr-2" />
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Telegram Integration Section */}
          <div className="mt-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Send className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Telegram Integration</h3>
              </div>

              {telegramStatus?.linked ? (
                // Linked State
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div className="flex-1">
                      <p className="text-green-400 font-medium">Telegram Connected</p>
                      <p className="text-sm text-gray-400">
                        Linked to @{telegramStatus.username || 'Unknown'} 
                        {telegramStatus.linkedAt && (
                          <span className="ml-2">
                            • {new Date(telegramStatus.linkedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={unlinkTelegram}
                      disabled={telegramLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      <Unlink className="w-4 h-4" />
                      {telegramLoading ? "Unlinking..." : "Unlink"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">
                    You will receive notifications via Telegram when there are updates to your conversations.
                  </p>
                </div>
              ) : telegramLink ? (
                // Link Generated State
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Click the link below or copy it to your browser to connect your Telegram account:
                  </p>
                  
                  <div className="flex items-center gap-2 p-4 bg-gray-700 rounded-lg">
                    <Link2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <code className="flex-1 text-blue-400 text-sm break-all">{telegramLink.linkUrl}</code>
                    <button
                      onClick={() => copyToClipboard(telegramLink.linkUrl)}
                      className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Copy link"
                    >
                      {linkCopied ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <a
                      href={telegramLink.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Open in Telegram"
                    >
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <Clock className="w-4 h-4" />
                    <span>This link expires in 10 minutes</span>
                  </div>

                  <button
                    onClick={generateTelegramLink}
                    disabled={telegramLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${telegramLoading ? 'animate-spin' : ''}`} />
                    Generate New Link
                  </button>
                </div>
              ) : (
                // Not Linked State
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Connect your Telegram account to receive real-time notifications about your conversations, orders, and updates.
                  </p>
                  
                  {!telegramStatus?.botAvailable ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        Telegram bot is not currently configured. Please contact support.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={generateTelegramLink}
                      disabled={telegramLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                      {telegramLoading ? "Generating..." : "Connect Telegram"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
