"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  Filter,
  User,
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  TrendingUp,
  UserPlus,
  ChevronRight,
  RefreshCw,
  Phone,
  Package,
  HelpCircle,
  MoreVertical,
  Eye,
  UserCheck,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import useAuthStore from "@/store/authStore";
import api from "@/utils/api";

const conversationTypes = {
  inquiry: { label: "Inquiry", icon: HelpCircle, color: "blue" },
  order: { label: "Order", icon: Package, color: "green" },
  complaint: { label: "Complaint", icon: AlertCircle, color: "red" },
  general: { label: "General", icon: MessageSquare, color: "gray" },
  support: { label: "Support", icon: User, color: "purple" },
};

const statusConfig = {
  active: { label: "Active (AI)", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  pending_representative: { label: "Needs Assignment", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  with_representative: { label: "With Rep", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  resolved: { label: "Resolved", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  closed: { label: "Closed", color: "bg-gray-600/20 text-gray-500 border-gray-600/30" },
};

export default function AdminConversationsPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole } = useAuthStore();
  
  const [conversations, setConversations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningConversation, setAssigningConversation] = useState(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if user is logged in using localStorage
    const storedUser = localStorage.getItem("user");
    const storedCompanyId = localStorage.getItem("companyId");
    
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    // Wait for store to hydrate with role info - need both activeCompanyId and activeCompanyRole
    if (!activeCompanyId || !activeCompanyRole) {
      // Store is still hydrating, wait for next re-render
      return;
    }
    
    // Check if user has required role for this page
    if (!["company_admin", "manager", "employee"].includes(activeCompanyRole)) {
      router.push("/dashboard");
      return;
    }

    loadData();
  }, [mounted, activeCompanyId, activeCompanyRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Wrap all API calls with individual catch to prevent one failure from breaking all
      const [conversationsRes, statsRes, employeesRes] = await Promise.all([
        api.get("/conversations/company/list").catch((e) => { 
          console.error("Conversations error:", e.response?.status, e.message); 
          return { data: { data: { conversations: [] } } }; 
        }),
        api.get("/conversations/company/stats").catch((e) => { 
          return { data: { data: { stats: {} } } }; 
        }),
        api.get("/company/members").catch((e) => { 
          return { data: { data: { members: [] } } }; 
        }),
      ]);
      
      setConversations(conversationsRes.data?.data?.conversations || []);
      setStats(statsRes.data?.data?.stats || {});
      
      // Filter to only employees/managers who can handle conversations
      const assignable = (employeesRes.data?.data?.members || []).filter(
        m => ["company_admin", "manager", "employee"].includes(m.role)
      );
      setEmployees(assignable);
    } catch (err) {
      console.error("Error loading data:", err);
      // Mock data for demo
      setConversations([
        {
          _id: "1",
          clientUserId: { _id: "c1", name: "John Doe", email: "john@example.com" },
          type: "inquiry",
          status: "pending_representative",
          lastActivity: new Date().toISOString(),
          messages: [{ content: "I need help with my order" }],
        },
        {
          _id: "2",
          clientUserId: { _id: "c2", name: "Jane Smith", email: "jane@example.com" },
          type: "complaint",
          status: "with_representative",
          assignedRepresentative: { _id: "e1", name: "Mike Rep" },
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          messages: [{ content: "Product not working" }],
        },
        {
          _id: "3",
          clientUserId: { _id: "c3", name: "Bob Wilson", email: "bob@example.com" },
          type: "order",
          status: "active",
          lastActivity: new Date(Date.now() - 7200000).toISOString(),
          messages: [{ content: "When will my order arrive?" }],
        },
      ]);
      setStats({
        total: 15,
        active: 5,
        pendingRepresentative: 3,
        withRepresentative: 4,
        resolved: 3,
        avgSatisfaction: 4.2,
      });
      setEmployees([
        { _id: "e1", name: "Mike Rep", email: "mike@company.com", role: "employee" },
        { _id: "e2", name: "Sarah Manager", email: "sarah@company.com", role: "manager" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRepresentative = async (conversationId, representativeId) => {
    try {
      await api.post(`/conversations/${conversationId}/assign`, { representativeId });
      await loadData();
      setShowAssignModal(false);
      setAssigningConversation(null);
    } catch (err) {
      console.error("Error assigning representative:", err);
      // Demo: update locally
      setConversations(prev => prev.map(c => 
        c._id === conversationId 
          ? { ...c, status: "with_representative", assignedRepresentative: employees.find(e => e._id === representativeId) }
          : c
      ));
      setShowAssignModal(false);
      setAssigningConversation(null);
    }
  };

  const handleViewConversation = (conversation) => {
    router.push(`/dashboard/conversations/${conversation._id}`);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.clientUserId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.clientUserId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
    const matchesType = typeFilter === "all" || conv.type === typeFilter;
    const matchesAssignee = assigneeFilter === "all" || 
      (assigneeFilter === "unassigned" && !conv.assignedRepresentative) ||
      (assigneeFilter === "mine" && conv.assignedRepresentative?._id === user?._id) ||
      conv.assignedRepresentative?._id === assigneeFilter;
    
    // For employees, only show their assigned conversations
    if (activeCompanyRole === "employee") {
      return matchesSearch && matchesStatus && matchesType && 
        conv.assignedRepresentative?._id === user?._id;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesAssignee;
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Conversation Management</h1>
              <p className="text-gray-400 mt-1">
                {activeCompanyRole === "employee" 
                  ? "Manage your assigned customer conversations"
                  : "Manage and assign customer conversations"}
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats Cards - Only for admin/manager */}
          {["company_admin", "manager"].includes(activeCompanyRole) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.pendingRepresentative || 0}</p>
                    <p className="text-xs text-gray-400">Needs Assignment</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <UserCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.withRepresentative || 0}</p>
                    <p className="text-xs text-gray-400">With Rep</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.active || 0}</p>
                    <p className="text-xs text-gray-400">AI Handling</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.resolved || 0}</p>
                    <p className="text-xs text-gray-400">Resolved</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by client name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">AI Handling</option>
                  <option value="pending_representative">Needs Assignment</option>
                  <option value="with_representative">With Representative</option>
                  <option value="resolved">Resolved</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="inquiry">Inquiry</option>
                  <option value="order">Order</option>
                  <option value="complaint">Complaint</option>
                  <option value="support">Support</option>
                </select>
                
                {["company_admin", "manager"].includes(activeCompanyRole) && (
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Assignees</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="mine">Assigned to Me</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {filteredConversations.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No conversations found</p>
                <p className="text-gray-500 text-sm mt-1">
                  {activeCompanyRole === "employee" 
                    ? "You have no assigned conversations"
                    : "Adjust your filters or wait for new conversations"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredConversations.map((conv) => {
                  const TypeIcon = conversationTypes[conv.type]?.icon || MessageSquare;
                  const typeColor = conversationTypes[conv.type]?.color || "gray";
                  const statusInfo = statusConfig[conv.status] || statusConfig.active;
                  const lastMessage = conv.messages?.[conv.messages.length - 1];
                  
                  return (
                    <div
                      key={conv._id}
                      className="p-4 hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Client Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {conv.clientUserId?.name?.charAt(0) || "?"}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {conv.clientUserId?.name || "Unknown Client"}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <div className={`p-1 rounded bg-${typeColor}-500/20`}>
                              <TypeIcon className={`w-3 h-3 text-${typeColor}-400`} />
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-400 truncate">
                            {conv.clientUserId?.email}
                          </p>
                          
                          {lastMessage && (
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {lastMessage.content}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(conv.lastActivity)}
                            </span>
                            {conv.assignedRepresentative && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {conv.assignedRepresentative.name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Assign Button - Only for admin/manager when unassigned */}
                          {["company_admin", "manager"].includes(activeCompanyRole) && 
                           (conv.status === "pending_representative" || !conv.assignedRepresentative) && (
                            <button
                              onClick={() => {
                                setAssigningConversation(conv);
                                setShowAssignModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm"
                            >
                              <UserPlus className="w-4 h-4" />
                              Assign
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleViewConversation(conv)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assign Modal */}
      {showAssignModal && assigningConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Assign Representative</h3>
            <p className="text-gray-400 mb-4">
              Assign a representative to handle the conversation with {assigningConversation.clientUserId?.name}
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {employees.map((emp) => (
                <button
                  key={emp._id}
                  onClick={() => handleAssignRepresentative(assigningConversation._id, emp._id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {emp.name?.charAt(0) || "?"}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{emp.name}</p>
                    <p className="text-gray-400 text-sm">{emp.role}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowAssignModal(false);
                setAssigningConversation(null);
              }}
              className="mt-4 w-full py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
