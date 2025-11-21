"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import { Plus, Edit, Trash2, Search, UserCheck, Mail, Phone, Building } from "lucide-react";

export default function ClientsPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    assignedTo: "",
    status: "lead",
    notes: "",
  });
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeCompanyId) {
      router.push("/company-selection");
      return;
    }
    
    // Load data sequentially to avoid race conditions
    const loadData = async () => {
      await loadClients();
      await loadEmployees();
    };
    
    loadData();
  }, [activeCompanyId, router]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/clients");
      if (response.data.success) {
        setClients(response.data.data.clients || []);
      } else {
        setError("Failed to load leads");
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setError(error.response?.data?.message || "Failed to load leads");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await apiClient.get("/company/members");
      if (response.data.success) {
        // Filter for employees, managers, and admins who can be assigned leads
        const assignableMembers = (response.data.data.members || []).filter(
          (member) => 
            member.role === "employee" || 
            member.role === "manager" || 
            member.role === "company_admin"
        );
        setEmployees(assignableMembers);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError("");
      
      if (editingClient) {
        await apiClient.put(`/clients/${editingClient._id}`, formData);
      } else {
        await apiClient.post("/clients", formData);
      }
      
      setShowModal(false);
      setEditingClient(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        company: "",
        assignedTo: "",
        status: "lead",
        notes: "",
      });
      
      // Reload clients after successful save
      await loadClients();
      
      // Trigger dashboard refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("clientUpdated"));
      }
    } catch (error) {
      console.error("Error saving client:", error);
      setError(error.response?.data?.message || "Failed to save lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      address: client.address || "",
      company: client.company || "",
      assignedTo: client.assignedTo?._id || "",
      status: client.status,
      notes: client.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (clientId) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    
    // Prevent double deletion
    if (deleting === clientId) return;
    
    try {
      setDeleting(clientId);
      await apiClient.delete(`/clients/${clientId}`);
      await loadClients();
      // Trigger dashboard refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("clientUpdated"));
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      alert(error.response?.data?.message || "Failed to delete lead");
    } finally {
      setDeleting(null);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "customer":
        return "bg-blue-500/20 text-blue-400";
      case "lead":
        return "bg-yellow-500/20 text-yellow-400";
      case "inactive":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };


  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
              <p className="text-gray-400">Manage your company leads</p>
            </div>
            {(activeCompanyRole === "company_admin" || activeCompanyRole === "manager" || activeCompanyRole === "employee") && (
              <button
                onClick={() => {
                  setEditingClient(null);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    company: "",
                    assignedTo: "",
                    status: "lead",
                    notes: "",
                  });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Lead
              </button>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Clients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading leads...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No leads found</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client._id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1">{client.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </div>
                    {(activeCompanyRole === "company_admin" || activeCompanyRole === "manager") && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client._id)}
                          disabled={deleting === client._id}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === client._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{client.phone}</span>
                      </div>
                    )}
                    {client.company && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Building className="w-4 h-4" />
                        <span className="text-sm">{client.company}</span>
                      </div>
                    )}
                    {client.assignedTo && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <UserCheck className="w-4 h-4" />
                        <span className="text-sm">Assigned to: {client.assignedTo.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingClient ? "Edit Lead" : "Add New Lead"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Lead's Company <span className="text-gray-500 text-xs">(Optional - External company name)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Acme Corp, Tech Solutions Inc."
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the company the lead works for, not a CRM company. You can enter any company name.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assigned To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  disabled={loadingEmployees || submitting}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Unassigned</option>
                  {loadingEmployees ? (
                    <option value="">Loading employees...</option>
                  ) : employees.length === 0 ? (
                    <option value="">No employees available</option>
                  ) : (
                    employees.map((emp) => (
                      <option key={emp.userId || emp._id} value={emp.userId || emp._id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="customer">Customer</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Error Message in Modal */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{editingClient ? "Updating..." : "Creating..."}</span>
                    </>
                  ) : (
                    <span>{editingClient ? "Update" : "Create"}</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowModal(false);
                    setEditingClient(null);
                    setError("");
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      address: "",
                      company: "",
                      assignedTo: "",
                      status: "lead",
                      notes: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

