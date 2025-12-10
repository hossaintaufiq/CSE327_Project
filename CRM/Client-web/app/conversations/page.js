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
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AudioCallModal from "@/components/AudioCallModal";
import IncomingCallNotification from "@/components/IncomingCallNotification";
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
  active: "bg-blue-500/20 text-blue-400",
  pending_representative: "bg-yellow-500/20 text-yellow-400",
  with_representative: "bg-green-500/20 text-green-400",
  resolved: "bg-gray-500/20 text-gray-400",
  closed: "bg-gray-500/20 text-gray-500",
};

export default function ConversationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, activeCompanyRole, activeCompanyId } = useAuthStore();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callToken, setCallToken] = useState(null);
  const [callRoomUrl, setCallRoomUrl] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    fetchConversations();

    // Initialize Socket.IO for incoming call notifications
    if (user?.firebaseUid) {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      socketRef.current = io(socketUrl, {
        auth: {
          userId: user.firebaseUid,
          token: localStorage.getItem('idToken')
        }
      });

      // Listen for incoming calls
      socketRef.current.on('call:incoming', (data) => {
        console.log('[Socket] Incoming call:', data);
        setIncomingCall(data);
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [mounted, activeCompanyId, activeCompanyRole, user?.firebaseUid, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      const companyId = activeCompanyId || (typeof window !== 'undefined' ? localStorage.getItem('companyId') : null);
      let endpoint = "/conversations/my-conversations";
      const config = {};

      console.log('[fetchConversations] User role:', activeCompanyRole, 'CompanyId:', companyId);

      // If user is an employee/admin of the active company, fetch company conversations
      if (activeCompanyRole && ['employee', 'manager', 'company_admin'].includes(activeCompanyRole)) {
        endpoint = "/conversations/company/list";
        console.log('[fetchConversations] Using company endpoint:', endpoint);
      } else {
        console.log('[fetchConversations] Using client endpoint:', endpoint);
      }

      if (companyId) {
        config.params = { companyId };
      }

      console.log('[fetchConversations] Fetching from:', endpoint, 'with config:', config);
      const res = await api.get(endpoint, config);
      console.log('[fetchConversations] Response:', res.data);
      const conversationsList = res.data.data?.conversations || [];
      console.log('[fetchConversations] Extracted', conversationsList.length, 'conversations');
      setConversations(conversationsList);
      
      // If conversation ID in URL, select it
      const conversationId = searchParams.get("id");
      if (conversationId) {
        const conv = conversationsList.find(c => c._id === conversationId);
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
          companyId: { _id: "c1", name: "TechCorp Solutions" },
          type: "inquiry",
          title: "Product Information Request",
          status: "active",
          messages: [
            { _id: "m1", content: "Hi, I'd like to know more about your enterprise software solutions.", senderType: "client", createdAt: new Date(Date.now() - 3600000).toISOString() },
            { _id: "m2", content: "Hello! I'd be happy to help you learn about our enterprise solutions. We offer a comprehensive suite including CRM, ERP, and custom development services. What specific area are you most interested in?", senderType: "ai", createdAt: new Date(Date.now() - 3500000).toISOString() },
          ],
          lastActivity: new Date(Date.now() - 3500000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          _id: "2",
          companyId: { _id: "c2", name: "Global Supplies Inc" },
          type: "order",
          title: "Order #12345 Status",
          status: "with_representative",
          assignedRepresentative: { name: "John Smith" },
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
          companyId: { _id: "c1", name: "TechCorp Solutions" },
          type: "complaint",
          title: "Software Bug Report",
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
      const res = await api.post(`/conversations/${selectedConversation._id}/message`, {
        content: messageContent
      });
      
      // Update with actual response including AI reply if any
      if (res.data?.data?.conversation) {
        setMessages(res.data.data.conversation.messages || []);
        setSelectedConversation(res.data.data.conversation);
        
        // Also update in conversations list
        setConversations(prev => prev.map(c => 
          c._id === res.data.data.conversation._id ? res.data.data.conversation : c
        ));
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

  const handleStartCall = async () => {
    if (!selectedConversation) return;

    // Check if AI is active (no representative assigned)
    if (selectedConversation.status === 'active' && !selectedConversation.assignedRepresentative) {
      alert('Audio calls are only available when talking with a representative. Please request a human representative first.');
      return;
    }

    try {
      const token = localStorage.getItem('idToken');
      const storedUser = localStorage.getItem('user');
      console.log('[handleStartCall] Auth check:', {
        hasToken: !!token,
        hasUser: !!storedUser,
        userId: user?.firebaseUid,
        conversationId: selectedConversation._id
      });
      
      if (!token) {
        alert('You are not logged in. Please refresh the page and log in again.');
        return;
      }
      
      console.log('[handleStartCall] Starting audio call for conversation:', selectedConversation._id);
      const res = await api.post(`/audio-calls/${selectedConversation._id}/create`);
      console.log('[handleStartCall] Call created successfully:', res.data);
      
      if (res.data?.success) {
        setCallToken(res.data.data.token);
        setCallRoomUrl(res.data.data.room.url);
        setShowVideoCall(true);
      }
    } catch (error) {
      console.error('[handleStartCall] Error:', error.response?.status, error.response?.data?.message || error.message);
      
      // Handle specific error cases with user-friendly messages
      const errorData = error.response?.data;
      const status = error.response?.status;
      
      let errorMessage = 'Failed to start audio call';
      
      if (status === 503 && errorData?.error === 'service-not-configured') {
        errorMessage = 'Audio/Video calls require payment setup. This feature will be available after upgrading your account.';
      } else if (status === 503) {
        errorMessage = 'Call service is temporarily unavailable. Please try again later.';
      } else if (status === 401) {
        errorMessage = 'Authentication error. Please refresh the page and log in again.';
      } else if (status === 403) {
        errorMessage = 'You do not have permission to start this call.';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      }
      
      alert(errorMessage);
      
      // Don't let the error propagate to avoid redirect
      return;
    }
  };

  const handleCloseCall = async () => {
    if (selectedConversation) {
      try {
        await api.post(`/audio-calls/${selectedConversation._id}/end`);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    setShowVideoCall(false);
    setCallToken(null);
    setCallRoomUrl(null);
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      setCallToken(incomingCall.token);
      setCallRoomUrl(incomingCall.roomUrl);
      setShowVideoCall(true);
      setIncomingCall(null);
      // Also select the conversation if not already selected
      if (incomingCall.conversationId !== selectedConversation?._id) {
        const conv = conversations.find(c => c._id === incomingCall.conversationId);
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    }
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
    // Optionally notify the caller that the call was rejected
    if (socketRef.current && incomingCall) {
      socketRef.current.emit('call:rejected', {
        conversationId: incomingCall.conversationId
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          conv.companyId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || conv.type === filterType;
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
      case "ai": return "bg-purple-500/20 text-purple-200";
      case "representative": return "bg-green-500/20 text-green-200";
      case "system": return "bg-gray-700 text-gray-300";
      default: return "bg-gray-700 text-gray-200";
    }
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
      
      <main className="lg:ml-64 pt-[60px]">
        <div className="h-[calc(100vh-64px)] flex">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-700 bg-gray-800`}>
            {/* List Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Conversations</h2>
                <button
                  onClick={() => router.push("/conversations/new")}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 mt-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white"
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
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active (AI)</option>
                  <option value="pending_representative">Needs Rep</option>
                  <option value="with_representative">With Rep</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400">No conversations yet</p>
                  <button
                    onClick={() => router.push("/conversations/new")}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Start a Conversation
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const TypeIcon = conversationTypes[conv.type]?.icon || MessageSquare;
                  const lastMessage = conv.messages?.[conv.messages.length - 1];
                  
                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors ${
                        selectedConversation?._id === conv._id ? "bg-blue-600/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          conversationTypes[conv.type]?.color === "blue" ? "bg-blue-500/20 text-blue-400" :
                          conversationTypes[conv.type]?.color === "green" ? "bg-green-500/20 text-green-400" :
                          conversationTypes[conv.type]?.color === "red" ? "bg-red-500/20 text-red-400" :
                          conversationTypes[conv.type]?.color === "purple" ? "bg-purple-500/20 text-purple-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-white truncate">{conv.title}</h3>
                            <span className="text-xs text-gray-500">{formatTime(conv.lastActivity)}</span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">{conv.companyId?.name}</p>
                          {lastMessage && (
                            <p className="text-sm text-gray-500 truncate mt-1">
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
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-gray-900`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSelectedConversation(null);
                      router.push("/conversations", { scroll: false });
                    }}
                    className="md:hidden p-2 hover:bg-gray-700 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-300" />
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{selectedConversation.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Building2 className="w-4 h-4" />
                      <span>{selectedConversation.companyId?.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[selectedConversation.status]}`}>
                        {selectedConversation.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedConversation.status === "active" && !selectedConversation.assignedRepresentative && (
                      <button
                        onClick={handleRequestRepresentative}
                        className="px-3 py-1.5 text-sm bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                      >
                        Talk to Human
                      </button>
                    )}
                    {/* Show call button only when representative is assigned */}
                    {selectedConversation.assignedRepresentative && selectedConversation.status !== 'resolved' && selectedConversation.status !== 'closed' && (
                      <button 
                        onClick={handleStartCall}
                        className="p-2 hover:bg-gray-700 rounded-lg group"
                        title="Start audio call with representative"
                      >
                        <Phone className="w-5 h-5 text-gray-400 group-hover:text-green-400" />
                      </button>
                    )}
                    <button className="p-2 hover:bg-gray-700 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-gray-400" />
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
                              message.senderType === "ai" ? "bg-purple-500/20 text-purple-400" :
                              message.senderType === "representative" ? "bg-green-500/20 text-green-400" :
                              "bg-gray-700 text-gray-400"
                            }`}>
                              {getSenderIcon(message.senderType)}
                            </div>
                          )}
                          
                          <div>
                            {!isClient && (
                              <p className="text-xs text-gray-500 mb-1 ml-1">
                                {message.senderType === "ai" ? "AI Assistant" :
                                 message.senderType === "representative" ? selectedConversation.assignedRepresentative?.name || "Representative" :
                                 "System"}
                              </p>
                            )}
                            <div className={`px-4 py-2 rounded-2xl ${getSenderColor(message.senderType)} ${
                              isClient ? "rounded-br-md" : "rounded-bl-md"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className={`text-xs text-gray-500 mt-1 ${isClient ? "text-right" : "text-left"}`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {sendingMessage && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-2xl">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">AI is typing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 border-t border-gray-700">
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg"
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
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ minHeight: "42px", maxHeight: "120px" }}
                      />
                    </div>

                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg"
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
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
                <p className="text-gray-400 mb-6 max-w-sm">
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

      {/* Incoming Call Notification */}
      {incomingCall && (
        <IncomingCallNotification
          caller={incomingCall.caller}
          conversationTitle={incomingCall.conversation?.title}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Audio Call Modal */}
      <AudioCallModal
        isOpen={showVideoCall}
        onClose={handleCloseCall}
        callToken={callToken}
        roomUrl={callRoomUrl}
        conversationId={selectedConversation?._id}
      />
    </div>
  );
}
