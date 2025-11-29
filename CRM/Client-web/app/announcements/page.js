"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";

function AnnouncementsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [formData, setFormData] = useState({
    recipientId: "",
    subject: "",
    content: "",
    priority: "medium",
    category: "general",
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

        // If not super admin, check if user has a company
        if (!isSuperAdminUser) {
          const companies = parsedUser.companies || [];
          const activeCompanyId = localStorage.getItem("companyId");
          
          // If no companies and no active company, redirect to company selection
          if (companies.length === 0 && !activeCompanyId) {
            router.push("/company-selection");
            return;
          }
          
          // If has companies but no active company selected, redirect to company selection
          if (companies.length > 0 && !activeCompanyId) {
            router.push("/company-selection");
            return;
          }
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
      const response = await apiClient.get('/company/announcements');
      
      if (response.data.success) {
        setAnnouncements(response.data.data.announcements);
      }
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompose = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/company/announcements', formData);
      setShowCompose(false);
      setFormData({
        recipientId: "",
        subject: "",
        content: "",
        priority: "medium",
        category: "general",
      });
      loadAnnouncements();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + (error.response?.data?.message || error.message));
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await apiClient.patch(`/messages/${messageId}/read`);
      loadAnnouncements();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, isRead: true });
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await apiClient.delete(`/messages/${messageId}`);
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      loadAnnouncements();
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
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

  const unreadCount = announcements.filter((m) => !m.isRead).length;
  const priorityColors = {
    low: "bg-gray-500/20 text-gray-400",
    medium: "bg-blue-500/20 text-blue-400",
    high: "bg-orange-500/20 text-orange-400",
    urgent: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Announcements</h1>
            <p className="text-gray-400 mb-6">
              {isSuperAdmin ? "All platform announcements" : "Company-wide announcements and updates"}
            </p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Compose Message
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Announcements List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 bg-gray-900">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-white">Inbox</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p>No messages found</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.isRead) {
                        handleMarkAsRead(message.id);
                      }
                    }}
                    className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                      selectedMessage?.id === message.id ? "bg-blue-500/20" : ""
                    } ${!message.isRead ? "bg-blue-500/10 font-semibold" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {message.subject}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {isSuperAdmin && message.companyName && (
                            <span className="text-purple-400 font-medium">
                              {message.companyName} •{" "}
                            </span>
                          )}
                          {message.sender?.name || message.sender?.email}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${priorityColors[message.priority]}`}
                      >
                        {message.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {message.content.substring(0, 60)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6">
            {selectedMessage ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-white">{selectedMessage.subject}</h2>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-300">
                      <span>
                        <strong>From:</strong> {selectedMessage.sender?.name || selectedMessage.sender?.email}
                      </span>
                      {selectedMessage.recipient && (
                        <span>
                          <strong>To:</strong> {selectedMessage.recipient?.name || selectedMessage.recipient?.email}
                        </span>
                      )}
                      {isSuperAdmin && selectedMessage.companyName && (
                        <span className="text-purple-400">
                          <strong>Company:</strong> {selectedMessage.companyName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${priorityColors[selectedMessage.priority]}`}
                    >
                      {selectedMessage.priority}
                    </span>
                    <span className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full">
                      {selectedMessage.category}
                    </span>
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-300">{selectedMessage.content}</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-4">
                    Sent: {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <p>Select a message to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-white">Compose Message</h2>
              <form onSubmit={handleCompose} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Message subject"
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
                    placeholder="Type your message here..."
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
                    <label className="block text-sm font-medium mb-1 text-gray-300">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="support">Support</option>
                      <option value="order">Order</option>
                      <option value="complaint">Complaint</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompose(false);
                      setFormData({
                        recipientId: "",
                        subject: "",
                        content: "",
                        priority: "medium",
                        category: "general",
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
