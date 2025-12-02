"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Filter,
  Clock,
  Building2,
  Package,
  AlertCircle,
  HelpCircle,
  User,
  Bot,
  Phone,
  Video,
  Paperclip,
  Smile,
  MoreVertical,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Loader2,
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

const statusColors = {
  ai_handling: "bg-blue-100 text-blue-700",
  waiting_representative: "bg-yellow-100 text-yellow-700",
  representative_assigned: "bg-green-100 text-green-700",
  resolved: "bg-gray-100 text-gray-700",
  closed: "bg-gray-100 text-gray-500",
};

export default function ConversationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, activeCompanyRole, isAuthenticated, loading: authLoading } = useAuthStore();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/conversations");
      setConversations(res.data.data || []);
      
      // If conversation ID in URL, select it
      const conversationId = searchParams.get("id");
      if (conversationId) {
        const conv = res.data.data.find(c => c._id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
          setMessages(conv.messages || []);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      // Mock data for demo
      const mockConversations = [
        {
          _id: "1",
          company: { _id: "c1", name: "TechCorp Solutions" },
          conversationType: "inquiry",
          subject: "Product Information Request",
          status: "ai_handling",
          messages: [
            { _id: "m1", content: "Hi, I'd like to know more about your enterprise software solutions.", senderType: "client", createdAt: new Date(Date.now() - 3600000).toISOString() },
            { _id: "m2", content: "Hello! I'd be happy to help you learn about our enterprise solutions. We offer a comprehensive suite including CRM, ERP, and custom development services. What specific area are you most interested in?", senderType: "ai", createdAt: new Date(Date.now() - 3500000).toISOString() },
          ],
          lastActivity: new Date(Date.now() - 3500000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          _id: "2",
          company: { _id: "c2", name: "Global Supplies Inc" },
          conversationType: "order",
          subject: "Order #12345 Status",
          status: "representative_assigned",
          representative: { name: "John Smith" },
          messages: [
            { _id: "m3", content: "I placed an order last week but haven't received any updates.", senderType: "client", createdAt: new Date(Date.now() - 172800000).toISOString() },
            { _id: "m4", content: "I apologize for the delay. Let me check the status of your order.", senderType: "ai", createdAt: new Date(Date.now() - 172700000).toISOString() },
            { _id: "m5", content: "I've escalated this to a representative for you. They will be with you shortly.", senderType: "ai", createdAt: new Date(Date.now() - 172600000).toISOString() },
            { _id: "m6", content: "Hi, I'm John from Global Supplies. I've looked into your order and it's currently in transit. Expected delivery is tomorrow.", senderType: "representative", createdAt: new Date(Date.now() - 86400000).toISOString() },
          ],
          lastActivity: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
        {
          _id: "3",
          company: { _id: "c1", name: "TechCorp Solutions" },
          conversationType: "complaint",
          subject: "Software Bug Report",
          status: "resolved",
          messages: [
            { _id: "m7", content: "There's a bug in the latest update.", senderType: "client", createdAt: new Date(Date.now() - 604800000).toISOString() },
            { _id: "m8", content: "Thank you for reporting this. We've fixed the issue.", senderType: "representative", createdAt: new Date(Date.now() - 432000000).toISOString() },
          ],
          lastActivity: new Date(Date.now() - 432000000).toISOString(),
          createdAt: new Date(Date.now() - 604800000).toISOString(),
        },
      ];
      setConversations(mockConversations);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages(conversation.messages || []);
    router.push(`/conversations?id=${conversation._id}`, { scroll: false });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    // Optimistic update
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: messageContent,
      senderType: "client",
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await api.post(`/conversations/${selectedConversation._id}/messages`, {
        content: messageContent
      });
      
      // Update with actual response including AI reply if any
      if (res.data.data) {
        setMessages(res.data.data.messages || []);
        setSelectedConversation(res.data.data);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Simulate AI response for demo
      setTimeout(() => {
        const aiResponse = {
          _id: `ai-${Date.now()}`,
          content: "Thank you for your message! I'm processing your request. How else can I help you today?",
          senderType: "ai",
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRequestRepresentative = async () => {
    if (!selectedConversation) return;

    try {
      const res = await api.post(`/conversations/${selectedConversation._id}/escalate`);
      setSelectedConversation(res.data.data);
      
      // Add system message
      setMessages(prev => [...prev, {
        _id: `sys-${Date.now()}`,
        content: "Your request has been escalated to a human representative. Someone will be with you shortly.",
        senderType: "system",
        createdAt: new Date().toISOString(),
      }]);
    } catch (err) {
      console.error("Error escalating:", err);
      // Demo response
      setMessages(prev => [...prev, {
        _id: `sys-${Date.now()}`,
        content: "Your request has been escalated to a human representative. Someone will be with you shortly.",
        senderType: "system",
        createdAt: new Date().toISOString(),
      }]);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          conv.company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || conv.conversationType === filterType;
    const matchesStatus = filterStatus === "all" || conv.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
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

  const getSenderIcon = (senderType) => {
    switch (senderType) {
      case "ai": return <Bot className="w-5 h-5" />;
      case "representative": return <User className="w-5 h-5" />;
      case "system": return <AlertCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const getSenderColor = (senderType) => {
    switch (senderType) {
      case "client": return "bg-blue-600 text-white";
      case "ai": return "bg-purple-100 text-purple-900";
      case "representative": return "bg-green-100 text-green-900";
      case "system": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-900";
    }
  };

  if (authLoading) {
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
      
      <main className="lg:ml-64 pt-16">
        <div className="h-[calc(100vh-64px)] flex">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-200 bg-white`}>
            {/* List Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Conversations</h2>
                <button
                  onClick={() => router.push("/conversations/new")}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 mt-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                >
                  <option value="all">All Types</option>
                  <option value="inquiry">Inquiry</option>
                  <option value="order">Order</option>
                  <option value="complaint">Complaint</option>
                  <option value="support">Support</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="ai_handling">AI Handling</option>
                  <option value="waiting_representative">Waiting</option>
                  <option value="representative_assigned">Assigned</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No conversations yet</p>
                  <button
                    onClick={() => router.push("/conversations/new")}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Start a Conversation
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const TypeIcon = conversationTypes[conv.conversationType]?.icon || MessageSquare;
                  const lastMessage = conv.messages?.[conv.messages.length - 1];
                  
                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?._id === conv._id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          conversationTypes[conv.conversationType]?.color === "blue" ? "bg-blue-100 text-blue-600" :
                          conversationTypes[conv.conversationType]?.color === "green" ? "bg-green-100 text-green-600" :
                          conversationTypes[conv.conversationType]?.color === "red" ? "bg-red-100 text-red-600" :
                          conversationTypes[conv.conversationType]?.color === "purple" ? "bg-purple-100 text-purple-600" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900 truncate">{conv.subject}</h3>
                            <span className="text-xs text-gray-500">{formatTime(conv.lastActivity)}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{conv.company?.name}</p>
                          {lastMessage && (
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {lastMessage.senderType === "client" ? "You: " : ""}
                              {lastMessage.content}
                            </p>
                          )}
                          <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${statusColors[conv.status]}`}>
                            {conv.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-gray-50`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedConversation(null);
                      router.push("/conversations", { scroll: false });
                    }}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{selectedConversation.subject}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 className="w-4 h-4" />
                      <span>{selectedConversation.company?.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[selectedConversation.status]}`}>
                        {selectedConversation.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedConversation.status === "ai_handling" && (
                      <button
                        onClick={handleRequestRepresentative}
                        className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        Talk to Human
                      </button>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => {
                    const isClient = message.senderType === "client";
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-end gap-2 max-w-[80%] ${isClient ? "flex-row-reverse" : ""}`}>
                          {!isClient && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              message.senderType === "ai" ? "bg-purple-100 text-purple-600" :
                              message.senderType === "representative" ? "bg-green-100 text-green-600" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {getSenderIcon(message.senderType)}
                            </div>
                          )}
                          
                          <div>
                            {!isClient && (
                              <p className="text-xs text-gray-500 mb-1 ml-1">
                                {message.senderType === "ai" ? "AI Assistant" :
                                 message.senderType === "representative" ? selectedConversation.representative?.name || "Representative" :
                                 "System"}
                              </p>
                            )}
                            <div className={`px-4 py-2 rounded-2xl ${getSenderColor(message.senderType)} ${
                              isClient ? "rounded-br-md" : "rounded-bl-md"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className={`text-xs text-gray-400 mt-1 ${isClient ? "text-right" : "text-left"}`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {sendingMessage && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        <span className="text-sm text-gray-500">AI is typing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ minHeight: "42px", maxHeight: "120px" }}
                      />
                    </div>

                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Conversation</h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Choose a conversation from the list or start a new one to begin chatting
                </p>
                <button
                  onClick={() => router.push("/conversations/new")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
