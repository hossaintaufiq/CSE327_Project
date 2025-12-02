"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  MessageSquare,
  ShoppingCart,
  Star,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Package,
  ChevronRight,
  Filter,
  Grid,
  List,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import useAuthStore from "@/store/authStore";
import api from "@/utils/api";

export default function CompaniesPage() {
  const router = useRouter();
  const { user, activeCompanyRole, isAuthenticated, loading: authLoading } = useAuthStore();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && activeCompanyRole !== "client") {
      router.push("/dashboard");
      return;
    }

    if (isAuthenticated) {
      fetchCompanies();
    }
  }, [isAuthenticated, authLoading, activeCompanyRole]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      // Fetch companies the client has interacted with
      const [companiesRes, statsRes] = await Promise.all([
        api.get("/conversations/client-companies"),
        api.get("/conversations/stats")
      ]);
      
      setCompanies(companiesRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (err) {
      console.error("Error fetching companies:", err);
      // Set mock data for demo if API fails
      setCompanies([
        {
          _id: "1",
          name: "TechCorp Solutions",
          description: "Enterprise software solutions",
          industry: "Technology",
          logo: null,
          orderCount: 5,
          conversationCount: 3,
          lastInteraction: new Date().toISOString(),
          rating: 4.5,
          contact: { email: "contact@techcorp.com", phone: "+1234567890" }
        },
        {
          _id: "2",
          name: "Global Supplies Inc",
          description: "Industrial equipment and supplies",
          industry: "Manufacturing",
          logo: null,
          orderCount: 12,
          conversationCount: 7,
          lastInteraction: new Date(Date.now() - 86400000).toISOString(),
          rating: 4.8,
          contact: { email: "sales@globalsupplies.com", phone: "+0987654321" }
        },
        {
          _id: "3",
          name: "Digital Marketing Pro",
          description: "Marketing and advertising services",
          industry: "Marketing",
          logo: null,
          orderCount: 2,
          conversationCount: 1,
          lastInteraction: new Date(Date.now() - 172800000).toISOString(),
          rating: 4.2,
          contact: { email: "hello@digitalmarketingpro.com" }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || company.industry === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];

  const handleStartConversation = (companyId) => {
    router.push(`/conversations/new?company=${companyId}`);
  };

  const handleViewOrders = (companyId) => {
    router.push(`/orders?company=${companyId}`);
  };

  const handleViewCompany = (companyId) => {
    router.push(`/companies/${companyId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-2">
              View and manage your interactions with companies
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
                  <p className="text-sm text-gray-500">Companies</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {companies.reduce((sum, c) => sum + (c.orderCount || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Orders</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {companies.reduce((sum, c) => sum + (c.conversationCount || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500">Conversations</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {companies.length > 0 
                      ? (companies.reduce((sum, c) => sum + (c.rating || 0), 0) / companies.length).toFixed(1)
                      : "N/A"
                    }
                  </p>
                  <p className="text-sm text-gray-500">Avg Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 items-center">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Industries</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Companies Grid/List */}
          {filteredCompanies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies yet</h3>
              <p className="text-gray-500 mb-6">
                Start by placing an order or starting a conversation with a company
              </p>
              <button
                onClick={() => router.push("/companies/browse")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Companies
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <div
                  key={company._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Company Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        {company.name?.charAt(0) || "C"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
                        <p className="text-sm text-gray-500">{company.industry}</p>
                        {company.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-gray-700">{company.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {company.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{company.description}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 divide-x divide-gray-100 bg-gray-50">
                    <div className="p-4 text-center">
                      <p className="text-lg font-bold text-gray-900">{company.orderCount || 0}</p>
                      <p className="text-xs text-gray-500">Orders</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-lg font-bold text-gray-900">{company.conversationCount || 0}</p>
                      <p className="text-xs text-gray-500">Conversations</p>
                    </div>
                  </div>

                  {/* Last Interaction */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Last interaction: {formatDate(company.lastInteraction)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex gap-2 border-t border-gray-100">
                    <button
                      onClick={() => handleStartConversation(company._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                    <button
                      onClick={() => handleViewOrders(company._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Package className="w-4 h-4" />
                      Orders
                    </button>
                    <button
                      onClick={() => handleViewCompany(company._id)}
                      className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredCompanies.map((company) => (
                  <div
                    key={company._id}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {company.name?.charAt(0) || "C"}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{company.name}</h3>
                        {company.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{company.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{company.orderCount || 0}</p>
                        <p className="text-xs">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{company.conversationCount || 0}</p>
                        <p className="text-xs">Chats</p>
                      </div>
                      <div className="hidden md:block text-right">
                        <p className="text-xs text-gray-400">Last activity</p>
                        <p className="text-sm">{formatDate(company.lastInteraction)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartConversation(company._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Start Conversation"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleViewOrders(company._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Orders"
                      >
                        <Package className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleViewCompany(company._id)}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
