"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import { Building2, Users, UserCheck, ShoppingCart, FolderKanban, CheckSquare, Calendar, Edit, Save, X, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function CompanyProfilePage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
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
    loadCompanyProfile();
  }, [activeCompanyId, router, isSuperAdmin, activeCompanyRole]);

  const loadCompanyProfile = async (showError = true) => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const response = await apiClient.get("/company/profile");
      if (response?.data?.success === true) {
        setCompanyData(response.data.data.company);
        setStatistics(response.data.data.statistics);
        setFormData({
          name: response.data.data.company.name || "",
          domain: response.data.data.company.domain || "",
        });
      } else {
        const errorMsg = response?.data?.message || response?.data?.error?.message || "Failed to load company profile";
        if (showError) {
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error("Error loading company profile:", error);
      let errorMessage = "Failed to load company profile. Please try again.";
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

      if (!formData.name || !formData.name.trim()) {
        setError("Company name is required");
        setSubmitting(false);
        return;
      }

      const payload = {
        name: formData.name.trim(),
        domain: formData.domain && formData.domain.trim() ? formData.domain.trim() : null,
      };

      const response = await apiClient.put("/company/profile", payload);
      if (response?.data?.success === true) {
        setSuccessMessage("Company profile updated successfully!");
        setError("");
        await loadCompanyProfile(false);
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorMsg = response?.data?.error?.message || 
                        response?.data?.message || 
                        "Failed to update company profile. Please try again.";
        setError(errorMsg);
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Error updating company profile:", error);
      let errorMessage = "Failed to update company profile";
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

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen pt-[60px]">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Company Profile</h1>
              <p className="text-gray-400">Manage your company information</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadCompanyProfile()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
                title="Refresh profile"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {!isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </button>
              )}
            </div>
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

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Total Members</h3>
                <p className="text-3xl font-bold text-white">{statistics.totalMembers || 0}</p>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Total Leads</h3>
                <p className="text-3xl font-bold text-white">{statistics.totalClients || 0}</p>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Total Orders</h3>
                <p className="text-3xl font-bold text-white">{statistics.totalOrders || 0}</p>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-500/20 rounded-lg">
                    <FolderKanban className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Total Projects</h3>
                <p className="text-3xl font-bold text-white">{statistics.totalProjects || 0}</p>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <CheckSquare className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Total Tasks</h3>
                <p className="text-3xl font-bold text-white">{statistics.totalTasks || 0}</p>
              </div>
            </div>
          )}

          {/* Company Information */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Company Information</h2>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Domain</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="example.com"
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: companyData?.name || "",
                        domain: companyData?.domain || "",
                      });
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4 inline mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                    <p className="text-white text-lg font-semibold">{companyData?.name || "N/A"}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Domain</label>
                    <p className="text-white text-lg">{companyData?.domain || "Not set"}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Admin</label>
                    <p className="text-white text-lg">{companyData?.adminName || "N/A"}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      companyData?.isActive 
                        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                      {companyData?.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created At</label>
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(companyData?.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Last Updated</label>
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(companyData?.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
