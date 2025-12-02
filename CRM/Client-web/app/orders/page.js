"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import JiraIssueCreator from "@/components/JiraIssueCreator";
import JiraIssuesList from "@/components/JiraIssuesList";
import { Plus, Edit, Trash2, Search, ShoppingCart, User, Calendar, DollarSign, Package, X, TrendingUp } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    clientId: "",
    items: [{ productName: "", quantity: 1, price: 0 }],
    status: "pending",
    assignedTo: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isSuperAdmin()) {
      router.push("/super-admin");
      return;
    }
    
    // For clients, don't require active company - they see all orders
    if (activeCompanyRole === 'client') {
      loadClientData();
      return;
    }
    
    if (!activeCompanyId) {
      router.push("/company-selection");
      return;
    }
    
    // Load data sequentially
    const loadData = async () => {
      await loadOrders();
      await loadClients();
      await loadEmployees();
    };
    
    loadData();
  }, [activeCompanyId, activeCompanyRole, router, isSuperAdmin]);

  // Load client-specific data (orders from all companies)
  const loadClientData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Get client orders and companies
      const [ordersRes, companiesRes] = await Promise.all([
        apiClient.get("/orders/my-orders"),
        apiClient.get("/conversations/client-companies").catch(() => ({ data: { data: [] } }))
      ]);
      
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data.orders || []);
      }
      
      setCompanies(companiesRes.data?.data || []);
    } catch (error) {
      console.error("Error loading client data:", error);
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/orders");
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
      } else {
        setError("Failed to load sales");
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setError(error.response?.data?.message || "Failed to load sales");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const response = await apiClient.get("/clients");
      if (response.data.success) {
        setClients(response.data.data.clients || []);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await apiClient.get("/company/members");
      if (response.data.success) {
        const assignableMembers = (response.data.data.members || []).filter(
          (member) => 
            member.role === "employee" || 
            member.role === "manager" || 
            member.role === "company_admin"
        );
        setEmployees(assignableMembers);
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
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError("");

      // Validate items
      if (!formData.clientId) {
        setError("Please select a client");
        return;
      }

      if (!formData.items || formData.items.length === 0) {
        setError("Please add at least one item");
        return;
      }

      // Validate each item
      for (const item of formData.items) {
        if (!item.productName || !item.quantity || item.price === undefined) {
          setError("Please fill in all item fields");
          return;
        }
        if (item.quantity < 1) {
          setError("Quantity must be at least 1");
          return;
        }
        if (item.price < 0) {
          setError("Price cannot be negative");
          return;
        }
      }

      if (editingOrder) {
        // Update order
        const response = await apiClient.put(`/orders/${editingOrder._id}`, formData);
        if (response.data.success) {
          await loadOrders();
          setShowModal(false);
          setEditingOrder(null);
          resetForm();
        } else {
          setError(response.data.message || "Failed to update order");
        }
      } else {
        // Create order
        const response = await apiClient.post("/orders", formData);
        if (response.data.success) {
          await loadOrders();
          setShowModal(false);
          resetForm();
          // Dispatch event to refresh dashboard
          window.dispatchEvent(new CustomEvent('orderUpdated'));
        } else {
          setError(response.data.message || "Failed to create order");
        }
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      setError(error.response?.data?.message || "Failed to save order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      clientId: order.clientId?._id || order.clientId || "",
      items: order.items || [{ productName: "", quantity: 1, price: 0 }],
      status: order.status || "pending",
      assignedTo: order.assignedTo?._id || order.assignedTo || "",
      notes: order.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    
    try {
      setDeleting(orderId);
      const response = await apiClient.delete(`/orders/${orderId}`);
      if (response.data.success) {
        await loadOrders();
        // Dispatch event to refresh dashboard
        window.dispatchEvent(new CustomEvent('orderUpdated'));
      } else {
        setError(response.data.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      setError(error.response?.data?.message || "Failed to delete order");
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: "",
      items: [{ productName: "", quantity: 1, price: 0 }],
      status: "pending",
      assignedTo: "",
      notes: "",
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate total if needed
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + qty * price;
    }, 0);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.companyId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    // For clients, also filter by company
    const matchesCompany = companyFilter === "all" || 
      (order.companyId?._id === companyFilter) || 
      (order.companyId === companyFilter);
    
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "shipped":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "processing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "pending":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
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

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalRevenue: orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{activeCompanyRole === 'client' ? 'Loading orders...' : 'Loading sales...'}</p>
        </div>
      </div>
    );
  }

  // Check if user is a client (they can only view their orders, not manage sales)
  const isClient = activeCompanyRole === 'client';
  const pageTitle = isClient ? 'My Orders' : 'Sales';
  const pageDescription = isClient ? 'View your order history and status' : 'Manage your company sales and orders';

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{pageTitle}</h1>
              <p className="text-gray-400">{pageDescription}</p>
            </div>
            {!isClient && (activeCompanyRole === "company_admin" || activeCompanyRole === "manager" || activeCompanyRole === "employee") && (
              <button
                onClick={() => {
                  setEditingOrder(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Sale
              </button>
            )}
          </div>

          {/* Statistics Cards - Client sees limited stats */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isClient ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 sm:gap-6 mb-8`}>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">{isClient ? 'My Orders' : 'Total Orders'}</h3>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Package className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Pending</h3>
              <p className="text-3xl font-bold text-white">{stats.pending}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Delivered</h3>
              <p className="text-3xl font-bold text-white">{stats.delivered}</p>
            </div>

            {/* Hide revenue from clients */}
            {!isClient && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Total Revenue</h3>
                <p className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={isClient ? "Search your orders..." : "Search by order number, client name, or email..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Company filter for clients */}
            {isClient && companies.length > 0 && (
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No orders found</p>
                {searchTerm && (
                  <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
                )}
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          Order #{order.orderNumber}
                        </h3>
                        <span className={`inline-block px-3 py-1 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      {/* Show company name for clients */}
                      {isClient && order.companyId && (
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                          <Package className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {order.companyId.name || "Company"}
                          </span>
                        </div>
                      )}
                      {/* Show client info for non-clients */}
                      {!isClient && order.clientId && (
                        <div className="flex items-center gap-2 text-gray-300 mb-1">
                          <User className="w-4 h-4" />
                          <span className="text-sm">
                            {order.clientId.name || order.clientId.email || "Unknown Client"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          ${order.totalAmount?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-xs text-gray-400">{order.items?.length || 0} items</p>
                      </div>
                      {(activeCompanyRole === "company_admin" || activeCompanyRole === "manager") && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(order)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {activeCompanyRole === "company_admin" && (
                            <button
                              onClick={() => handleDelete(order._id)}
                              disabled={deleting === order._id}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleting === order._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-sm font-medium text-gray-400 mb-2">Items:</p>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-300">
                            <span>{item.productName} x {item.quantity}</span>
                            <span>${(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assigned To */}
                  {order.assignedTo && (
                    <div className="mt-3 text-sm text-gray-400">
                      Assigned to: {order.assignedTo.name || order.assignedTo.email}
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-3 text-sm text-gray-400">
                      Notes: {order.notes}
                    </div>
                  )}

                  {/* Jira Integration */}
                  <div className="mt-4 flex items-center justify-between">
                    <JiraIssuesList jiraIssues={order.jiraIssues} />
                    <JiraIssueCreator
                      entityType="order"
                      entityId={order._id}
                      entityName={`Order ${order.orderNumber}`}
                      onIssueCreated={() => loadOrders()} // Refresh the order list
                      buttonVariant="outline"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl border border-gray-700 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingOrder ? "Edit Order" : "Create New Order"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(null);
                  resetForm();
                  setError("");
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  disabled={loadingClients || submitting}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a client</option>
                  {loadingClients ? (
                    <option value="">Loading clients...</option>
                  ) : clients.length === 0 ? (
                    <option value="">No clients available</option>
                  ) : (
                    clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name} {client.email && `(${client.email})`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Order Items */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Order Items *</label>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-300">Item {index + 1}</span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Product Name *</label>
                          <input
                            type="text"
                            required
                            value={item.productName}
                            onChange={(e) => updateItem(index, "productName", e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Product name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Quantity *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Price *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs text-gray-400">
                          Subtotal: ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  + Add Item
                </button>
                <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-400">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={submitting}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Assigned To */}
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

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrder(null);
                    resetForm();
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingOrder ? "Update Order" : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
