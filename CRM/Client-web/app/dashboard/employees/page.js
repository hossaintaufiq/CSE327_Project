"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import { Search, Mail, User, Calendar, Shield, Users, UserCheck, Briefcase, X, Phone, Building, FileText, TrendingUp, MessageSquare, ShoppingCart, UserCheck as UserCheckIcon, RefreshCw, AlertCircle } from "lucide-react";

export default function EmployeesPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, companies, isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Redirect super admin
    if (isSuperAdmin()) {
      router.push("/super-admin");
      return;
    }
    
    if (!activeCompanyId) {
      router.push("/company-selection");
      return;
    }
    
    loadEmployees();
  }, [activeCompanyId, router, isSuperAdmin]);

  const loadEmployees = async (showError = true) => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/company/members");
      if (response?.data?.success === true) {
        setEmployees(response.data.data.members || []);
      } else {
        const errorMsg = response?.data?.message || response?.data?.error?.message || "Failed to load employees";
        if (showError) {
          setError(errorMsg);
        }
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      let errorMessage = "Failed to load employees. Please try again.";
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
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getRoleLabel = (role) => {
    switch (role) {
      case "company_admin":
        return "Company Admin";
      case "manager":
        return "Manager";
      case "employee":
        return "Employee";
      case "client":
        return "Client";
      default:
        return role;
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

  const handleViewProfile = async (employee) => {
    setSelectedEmployee(employee);
    setLoadingProfile(true);
    setError("");
    try {
      const response = await apiClient.get(`/company/members/${employee.userId}/profile`);
      if (response?.data?.success === true) {
        setEmployeeProfile(response.data.data);
      } else {
        const errorMsg = response?.data?.message || 
                        response?.data?.error?.message || 
                        "Failed to load employee profile";
        setError(errorMsg);
        setEmployeeProfile(null);
      }
    } catch (error) {
      console.error("Error loading employee profile:", error);
      let errorMessage = "Failed to load employee profile. Please try again.";
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
      setError(errorMessage);
      setEmployeeProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCloseProfile = () => {
    setSelectedEmployee(null);
    setEmployeeProfile(null);
    // Keep error for employees list, don't clear it when closing profile
  };

  // Group employees by role
  const employeesByRole = {
    company_admin: filteredEmployees.filter((e) => e.role === "company_admin"),
    manager: filteredEmployees.filter((e) => e.role === "manager"),
    employee: filteredEmployees.filter((e) => e.role === "employee"),
    client: filteredEmployees.filter((e) => e.role === "client"),
  };

  const activeCompany = companies.find((c) => c.companyId === activeCompanyId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Employees</h1>
              <p className="text-gray-400">
                Manage employees for {activeCompany?.companyName || "your company"}
              </p>
            </div>
            <button
              onClick={() => loadEmployees()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
              title="Refresh employees"
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

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Company Admins</h3>
              <p className="text-3xl font-bold text-white">{employeesByRole.company_admin.length}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Managers</h3>
              <p className="text-3xl font-bold text-white">{employeesByRole.manager.length}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Employees</h3>
              <p className="text-3xl font-bold text-white">{employeesByRole.employee.length}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Total Members</h3>
              <p className="text-3xl font-bold text-white">{filteredEmployees.length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Employees Grid */}
          {filteredEmployees.length === 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No employees found</p>
              {searchTerm && (
                <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => {
                const RoleIcon = getRoleIcon(employee.role);
                return (
                  <div
                    key={employee.userId}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    {/* Employee Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {employee.name?.charAt(0)?.toUpperCase() || employee.email?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {employee.name || "No Name"}
                          </h3>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getRoleColor(employee.role)}`}>
                            {getRoleLabel(employee.role)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Employee Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{employee.email}</span>
                      </div>

                      {employee.joinedAt && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">Joined: {formatDate(employee.joinedAt)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-300">
                        <RoleIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Role: {getRoleLabel(employee.role)}</span>
                      </div>
                    </div>

                    {/* Employee Actions */}
                    {(activeCompanyRole === "company_admin" || activeCompanyRole === "manager") && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <button 
                          onClick={() => handleViewProfile(employee)}
                          className="w-full px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                        >
                          View Profile
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl border border-gray-700 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {selectedEmployee.name?.charAt(0)?.toUpperCase() || selectedEmployee.email?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedEmployee.name || "No Name"}
                  </h2>
                  <p className="text-gray-400">{selectedEmployee.email}</p>
                </div>
              </div>
              <button
                onClick={handleCloseProfile}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error && !employeeProfile ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => handleViewProfile(selectedEmployee)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : employeeProfile ? (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Full Name</label>
                      <p className="text-white font-medium">{employeeProfile.employee.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white font-medium">{employeeProfile.employee.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Role</label>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium border ${getRoleColor(employeeProfile.employee.membership.role)}`}>
                        {getRoleLabel(employeeProfile.employee.membership.role)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Joined Date</label>
                      <p className="text-white font-medium">
                        {formatDate(employeeProfile.employee.membership.joinedAt)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Account Created</label>
                      <p className="text-white font-medium">
                        {formatDate(employeeProfile.employee.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        employeeProfile.employee.isActive 
                          ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}>
                        {employeeProfile.employee.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheckIcon className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-400">Assigned Leads</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{employeeProfile.statistics.assignedLeads}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-gray-400">Assigned Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{employeeProfile.statistics.assignedOrders}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-gray-400">Sent Messages</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{employeeProfile.statistics.sentMessages}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-orange-400" />
                        <span className="text-sm text-gray-400">Received Messages</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{employeeProfile.statistics.receivedMessages}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Leads */}
                {employeeProfile.recentLeads && employeeProfile.recentLeads.length > 0 && (
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Assigned Leads</h3>
                    <div className="space-y-2">
                      {employeeProfile.recentLeads.map((lead) => (
                        <div key={lead._id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{lead.name}</p>
                              {lead.email && <p className="text-sm text-gray-400">{lead.email}</p>}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              lead.status === "active" ? "bg-green-500/20 text-green-400" :
                              lead.status === "customer" ? "bg-blue-500/20 text-blue-400" :
                              lead.status === "lead" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-gray-500/20 text-gray-400"
                            }`}>
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Orders */}
                {employeeProfile.recentOrders && employeeProfile.recentOrders.length > 0 && (
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Assigned Orders</h3>
                    <div className="space-y-2">
                      {employeeProfile.recentOrders.map((order) => (
                        <div key={order._id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">Order #{order.orderNumber || order._id.toString().substring(0, 8)}</p>
                              {order.clientId && (
                                <p className="text-sm text-gray-400">
                                  Client: {order.clientId.name || order.clientId.email}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold">${order.totalAmount?.toFixed(2) || "0.00"}</p>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                order.status === "delivered" ? "bg-green-500/20 text-green-400" :
                                order.status === "processing" ? "bg-blue-500/20 text-blue-400" :
                                order.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-gray-500/20 text-gray-400"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">Failed to load employee profile</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
