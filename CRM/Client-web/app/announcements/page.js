"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import { Bell, Plus, Trash2, Eye } from "lucide-react";

function AnnouncementsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
    type: "announcement",
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");

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
        const isSuperAdminUser = parsedUser.globalRole === 'super_admin';
        setIsSuperAdmin(isSuperAdminUser);

        if (!isSuperAdminUser) {
          const companies = parsedUser.companies || [];
          const activeCompanyId = localStorage.getItem("companyId");
          
          if (companies.length === 0 && !activeCompanyId) {
            router.push("/company-selection");
            return;
          }
          
          if (companies.length > 0 && !activeCompanyId) {
            router.push("/company-selection");
            return;
          }

          // Check if user is company admin
          const activeCompany = companies.find(c => c.companyId === activeCompanyId);
          setIsAdmin(activeCompany?.role === 'company_admin');
        } else {
          setIsAdmin(true);
        }

        loadAnnouncements();
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const loadAnnouncements = async () => {
    try {
      setError("");
      const response = await apiClient.get('/company/announcements');
      
      if (response.data.success) {
        setAnnouncements(response.data.data.announcements || []);
      }
    } catch (error) {
      console.error("Error loading announcements:", error);
      setError("Failed to load announcements");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompose = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const response = await apiClient.post('/company/announcements', formData);
      
      if (response.data.success) {
        setShowCompose(false);
        setFormData({
          title: "",
          content: "",
          priority: "medium",
          type: "announcement",
        });
        loadAnnouncements();
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      setError(error.response?.data?.message || "Failed to create announcement");
    }
  };

  const handleDelete = async (announcementId) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await apiClient.delete(`/company/announcements/${announcementId}`);
      if (selectedAnnouncement?._id === announcementId) {
        setSelectedAnnouncement(null);
      }
      loadAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setError("Failed to delete announcement");
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading announcements...</p>
        </div>
      </div>
    );
  }

  const priorityColors = {
    low: "bg-gray-500/20 text-gray-400",
    medium: "bg-blue-500/20 text-blue-400",
    high: "bg-orange-500/20 text-orange-400",
    urgent: "bg-red-500/20 text-red-400",
  };

  const typeColors = {
    info: "bg-blue-500/20 text-blue-400",
    announcement: "bg-green-500/20 text-green-400",
    warning: "bg-yellow-500/20 text-yellow-400",
    alert: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500" />
              Announcements
            </h1>
            <p className="text-gray-400">
              {isSuperAdmin ? "Platform-wide announcements" : "Company announcements and updates"}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCompose(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Announcement
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Announcements List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 bg-gray-900">
              <h2 className="font-semibold text-white">All Announcements</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No announcements yet</p>
                </div>
              ) : (
                announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                      selectedAnnouncement?._id === announcement._id ? "bg-blue-500/20" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {announcement.createdBy?.name || "System"}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[announcement.priority] || priorityColors.medium}`}>
                        {announcement.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {announcement.content?.substring(0, 60)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcement Detail */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6">
            {selectedAnnouncement ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-white">{selectedAnnouncement.title}</h2>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                      <span>
                        <strong>From:</strong> {selectedAnnouncement.createdBy?.name || "System"}
                      </span>
                      <span>
                        <strong>Date:</strong> {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 text-sm rounded-full ${priorityColors[selectedAnnouncement.priority] || priorityColors.medium}`}>
                      {selectedAnnouncement.priority}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${typeColors[selectedAnnouncement.type] || typeColors.info}`}>
                      {selectedAnnouncement.type}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(selectedAnnouncement._id)}
                        className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-300">{selectedAnnouncement.content}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select an announcement to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-white">New Announcement</h2>
              <form onSubmit={handleCompose} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Content *</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Announcement content..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="info">Info</option>
                      <option value="announcement">Announcement</option>
                      <option value="warning">Warning</option>
                      <option value="alert">Alert</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Create Announcement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompose(false);
                      setFormData({
                        title: "",
                        content: "",
                        priority: "medium",
                        type: "announcement",
                      });
                    }}
                    className="flex-1 bg-gray-700 text-gray-300 py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnnouncementsPage;
