"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import { Shield, Users, UserCheck, Briefcase, User, Edit, Trash2, Save, X, AlertCircle, Clock, Check, RefreshCw, CheckCircle } from "lucide-react";

export default function RolesPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [handlingRequest, setHandlingRequest] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [editingMember, setEditingMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
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
    loadRolesAndPermissions();
    loadPendingRequests();
  }, [activeCompanyId, router, isSuperAdmin, activeCompanyRole]);

  const loadRolesAndPermissions = async (showError = true) => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const response = await apiClient.get("/company/roles");
      if (response?.data?.success === true) {
        setMembers(response.data.data.members || []);
        setRolePermissions(response.data.data.rolePermissions || {});
      } else {
        const errorMsg = response?.data?.message || response?.data?.error?.message || "Failed to load roles and permissions";
        if (showError) {
          setError(errorMsg);
        }
      }
    } catch (error) {
      console.error("Error loading roles and permissions:", error);
      let errorMessage = "Failed to load roles and permissions. Please try again.";
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

  const loadPendingRequests = async () => {
    try {
      const response = await apiClient.get("/company/join-requests");
      if (response?.data?.success === true) {
        setPendingRequests(response.data.data.pendingRequests || []);
      }
    } catch (error) {
      console.error("Error loading pending requests:", error);
      // Don't show error for pending requests to avoid noise
    }
  };

  const handleJoinRequest = async (userId, action) => {
    try {
      setHandlingRequest(userId);
      setError("");
      
      const response = await apiClient.post("/company/join-requests/handle", {
        userId,
        action, // 'approve' or 'reject'
      });

      if (response?.data?.success === true) {
        setSuccessMessage(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        setError("");
        await loadPendingRequests();
        if (action === 'approve') {
          await loadRolesAndPermissions(false); // Refresh members list
        }
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorMsg = response?.data?.error?.message || 
                        response?.data?.message || 
                        `Failed to ${action} request. Please try again.`;
        setError(errorMsg);
        setSuccessMessage("");
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      let errorMessage = `Failed to ${action} request`;
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
      setHandlingRequest(null);
    }
  };

  const handleEditRole = (member) => {
    setEditingMember(member);
    setSelectedRole(member.role);
  };

  const handleSaveRole = async () => {
    if (!editingMember || !selectedRole) return;
    
    try {
      setSubmitting(editingMember.userId);
      setError("");

      const response = await apiClient.put(`/company/roles/${editingMember.userId}`, {
        role: selectedRole,
      });

      if (response?.data?.success === true) {
        setSuccessMessage("Role updated successfully!");
        setError("");
        await loadRolesAndPermissions(false);
        setEditingMember(null);
        setSelectedRole("");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorMsg = response?.data?.error?.message || 
                        response?.data?.message || 
                        "Failed to update role. Please try again.";
        setError(errorMsg);
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      let errorMessage = "Failed to update role";
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
      setSubmitting(null);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm("Are you sure you want to remove this user from the company?")) return;
    
    try {
      setDeleting(userId);
      setError("");

      const response = await apiClient.delete(`/company/roles/${userId}`);

      if (response?.data?.success === true) {
        setSuccessMessage("User removed successfully!");
        setError("");
        await loadRolesAndPermissions(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const errorMsg = response?.data?.error?.message || 
                        response?.data?.message || 
                        "Failed to remove user. Please try again.";
        setError(errorMsg);
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      let errorMessage = "Failed to remove user";
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
      setDeleting(null);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "company_admin":
        return Shield;
      case "manager":
        return Briefcase;
      case "employee":
        return UserCheck;
      case "client":
        return User;
      default:
        return User;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "company_admin":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "manager":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "employee":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "client":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Group members by role
  const membersByRole = {
    company_admin: members.filter((m) => m.role === "company_admin"),
    manager: members.filter((m) => m.role === "manager"),
    employee: members.filter((m) => m.role === "employee"),
    client: members.filter((m) => m.role === "client"),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading roles and permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Roles & Permissions</h1>
              <p className="text-gray-400">Manage user roles and permissions for your company</p>
            </div>
            <button
              onClick={() => {
                loadRolesAndPermissions();
                loadPendingRequests();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
              title="Refresh roles"
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

          {/* Pending Join Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">Pending Join Requests</h2>
                <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                  {pendingRequests.length} pending
                </span>
              </div>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.userId} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4">
                    <div>
                      <p className="text-white font-medium">{request.name}</p>
                      <p className="text-gray-400 text-sm">{request.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested role: <span className="text-yellow-400 capitalize">{request.requestedRole}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinRequest(request.userId, 'approve')}
                        disabled={handlingRequest === request.userId}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {handlingRequest === request.userId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleJoinRequest(request.userId, 'reject')}
                        disabled={handlingRequest === request.userId}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role Permissions Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(rolePermissions).map(([roleKey, roleInfo]) => {
              const RoleIcon = getRoleIcon(roleKey);
              return (
                <div key={roleKey} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${getRoleColor(roleKey)}`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{roleInfo.name}</h3>
                      <p className="text-xs text-gray-400">{membersByRole[roleKey]?.length || 0} members</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">{roleInfo.description}</p>
                  <div className="space-y-2">
                    {Object.entries(roleInfo.permissions).map(([perm, allowed]) => (
                      <div key={perm} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 capitalize">{perm.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={allowed ? "text-green-400" : "text-red-400"}>
                          {allowed ? "✓" : "✗"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Members List */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Company Members</h2>
            
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No members found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => {
                  const RoleIcon = getRoleIcon(member.role);
                  const isEditing = editingMember?.userId === member.userId;
                  const isCurrentUser = member.userId === user?._id;
                  
                  return (
                    <div
                      key={member.userId}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {member.name?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">{member.name || "No Name"}</h3>
                            <p className="text-sm text-gray-400">{member.email}</p>
                            {isEditing ? (
                              <div className="mt-3 flex items-center gap-3">
                                <select
                                  value={selectedRole}
                                  onChange={(e) => setSelectedRole(e.target.value)}
                                  className="px-3 py-1 bg-gray-600 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                  <option value="company_admin">Company Admin</option>
                                  <option value="manager">Manager</option>
                                  <option value="employee">Employee</option>
                                  <option value="client">Client</option>
                                </select>
                                <button
                                  onClick={handleSaveRole}
                                  disabled={submitting === member.userId}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                >
                                  {submitting === member.userId ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMember(null);
                                    setSelectedRole("");
                                  }}
                                  className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2 flex items-center gap-2">
                                <RoleIcon className="w-4 h-4 text-gray-400" />
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getRoleColor(member.role)}`}>
                                  {rolePermissions[member.role]?.name || member.role}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Joined: {formatDate(member.joinedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!isEditing && !isCurrentUser && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRole(member)}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveUser(member.userId)}
                              disabled={deleting === member.userId}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleting === member.userId ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                        {isCurrentUser && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>You</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
