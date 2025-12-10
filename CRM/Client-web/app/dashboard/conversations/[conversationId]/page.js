"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Bot,
  Clock,
  Building2,
  Package,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  UserPlus,
  Phone,
  Paperclip,
  MoreVertical,
  Loader2,
  XCircle,
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

const statusConfig = {
  active: { label: "AI Handling", color: "bg-blue-500/20 text-blue-400" },
  pending_representative: { label: "Needs Assignment", color: "bg-yellow-500/20 text-yellow-400" },
  with_representative: { label: "With Representative", color: "bg-green-500/20 text-green-400" },
  resolved: { label: "Resolved", color: "bg-gray-500/20 text-gray-400" },
  closed: { label: "Closed", color: "bg-gray-600/20 text-gray-500" },
};

export default function ConversationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId;
  const { user, activeCompanyRole, activeCompanyId } = useAuthStore();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callToken, setCallToken] = useState(null);
  const [callRoomName, setCallRoomName] = useState(null);
  const [callIdentity, setCallIdentity] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if user is logged in using localStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    if (conversationId) {
      loadConversation();
      loadEmployees();
    }

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
        setIncomingCall(data);
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [mounted, conversationId, user?.firebaseUid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/conversations/${conversationId}`);
      const conv = res.data?.data?.conversation;
      setConversation(conv);
      setMessages(conv?.messages || []);
    } catch (err) {
      console.error("Error loading conversation:", err);
      // Mock data
      setConversation({
        _id: conversationId,
        clientUserId: { _id: "c1", name: "John Doe", email: "john@example.com", phone: "+1234567890" },
        type: "inquiry",
        status: "with_representative",
        assignedRepresentative: { _id: user?._id, name: user?.name || "You" },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastActivity: new Date().toISOString(),
      });
      setMessages([
        { _id: "m1", content: "Hi, I need help with my recent order.", senderType: "client", createdAt: new Date(Date.now() - 3600000).toISOString() },
        { _id: "m2", content: "Hello! I'd be happy to help you with your order. Could you please provide your order number?", senderType: "ai", createdAt: new Date(Date.now() - 3500000).toISOString() },
        { _id: "m3", content: "It's ORD-12345", senderType: "client", createdAt: new Date(Date.now() - 3400000).toISOString() },
        { _id: "m4", content: "I've escalated this to a representative who will assist you further.", senderType: "ai", createdAt: new Date(Date.now() - 3300000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get("/company/members");
      const assignable = (res.data?.data?.members || []).filter(
        m => ["company_admin", "manager", "employee"].includes(m.role)
      );
      setEmployees(assignable);
    } catch (err) {
      console.error("Error loading employees:", err);
      setEmployees([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    // Optimistic update
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: messageContent,
      senderType: "representative",
      senderId: user?._id,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await api.post(`/conversations/${conversationId}/message`, {
        content: messageContent,
        messageType: "text",
      });
      
      if (res.data?.data?.conversation) {
        setMessages(res.data.data.conversation.messages || []);
        setConversation(res.data.data.conversation);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Keep the optimistic message for demo
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAssignRepresentative = async (representativeId) => {
    try {
      await api.post(`/conversations/${conversationId}/assign`, { representativeId });
      await loadConversation();
      setShowAssignModal(false);
    } catch (err) {
      console.error("Error assigning:", err);
      // Demo update
      const rep = employees.find(e => e._id === representativeId);
      setConversation(prev => ({ ...prev, status: "with_representative", assignedRepresentative: rep }));
      setShowAssignModal(false);
    }
  };

  const handleResolveConversation = async () => {
    try {
      await api.post(`/conversations/${conversationId}/resolve`, { notes: resolveNotes });
      await loadConversation();
      setShowResolveModal(false);
      setResolveNotes("");
    } catch (err) {
      console.error("Error resolving:", err);
      // Demo update
      setConversation(prev => ({ ...prev, status: "resolved" }));
      setShowResolveModal(false);
    }
  };

  const handleStartCall = async () => {
    if (!conversation) return;

    // Check if AI is active (no representative assigned)
    if (conversation.status === 'active' && !conversation.assignedRepresentative) {
      alert('Audio calls are only available when a representative is assigned to the conversation.');
      return;
    }

    try {
      const token = localStorage.getItem('idToken');
      
      if (!token) {
        alert('You are not logged in. Please refresh the page and log in again.');
        return;
      }
      
      const res = await api.post(`/audio-calls/${conversationId}/create`);
      if (res.data?.success) {
        setCallToken(res.data.data.token);
        setCallRoomName(res.data.data.room.name);
        setCallIdentity(res.data.data.identity);
        setShowVideoCall(true);
      }
    } catch (error) {
      console.error('[handleStartCall] Error:', error.response?.status, error.response?.data?.message || error.message);
      
      // Handle specific error cases
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
      
      alert(errorMessage);
    }
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      setCallToken(incomingCall.token);
      setCallRoomName(incomingCall.roomName);
      setCallIdentity(incomingCall.identity);
      setShowVideoCall(true);
      setIncomingCall(null);
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

  const handleCloseCall = async () => {
    if (conversationId) {
      try {
        await api.post(`/audio-calls/${conversationId}/end`);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    setShowVideoCall(false);
    setCallToken(null);
    setCallRoomUrl(null);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
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
      case "representative": return "bg-green-600 text-white";
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

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <Sidebar />
        <main className="lg:ml-64 pt-16 p-6 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Conversation not found</p>
            <button
              onClick={() => router.push("/dashboard/conversations")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Conversations
            </button>
          </div>
        </main>
      </div>
    );
  }

  const TypeIcon = conversationTypes[conversation.type]?.icon || MessageSquare;
  const statusInfo = statusConfig[conversation.status] || statusConfig.active;
  const isResolved = ["resolved", "closed"].includes(conversation.status);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <Sidebar />
      
      <main className="lg:ml-64 pt-16">
        <div className="h-[calc(100vh-64px)] flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/dashboard/conversations")}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {conversation.clientUserId?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-white">{conversation.clientUserId?.name}</h2>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{conversation.clientUserId?.email}</span>
                      <span className="flex items-center gap-1">
                        <TypeIcon className="w-3 h-3" />
                        {conversationTypes[conversation.type]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Assign Button - Only for admin/manager */}
                {["company_admin", "manager"].includes(activeCompanyRole) && !isResolved && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    {conversation.assignedRepresentative ? "Reassign" : "Assign"}
                  </button>
                )}
                
                {/* Resolve Button */}
                {!isResolved && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve
                  </button>
                )}
                
                {/* Audio Call Button - Only when representative assigned */}
                {conversation.assignedRepresentative && !isResolved && (
                  <button 
                    onClick={handleStartCall}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    title="Start audio call"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                )}
                
                <button className="p-2 hover:bg-gray-700 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Assigned Rep Info */}
            {conversation.assignedRepresentative && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400 pl-16">
                <User className="w-4 h-4" />
                <span>Assigned to: {conversation.assignedRepresentative.name}</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
            {/* Date Header */}
            <div className="text-center">
              <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full">
                {formatDate(conversation.createdAt)}
              </span>
            </div>
            
            {messages.map((message) => {
              const isClient = message.senderType === "client";
              
              return (
                <div
                  key={message._id}
                  className={`flex ${isClient ? "justify-start" : "justify-end"}`}
                >
                  <div className={`flex items-end gap-2 max-w-[75%] ${isClient ? "" : "flex-row-reverse"}`}>
                    {/* Avatar for non-client messages */}
                    {!isClient && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        message.senderType === "ai" ? "bg-purple-500/20 text-purple-400" :
                        message.senderType === "representative" ? "bg-green-500/20 text-green-400" :
                        "bg-gray-700 text-gray-400"
                      }`}>
                        {getSenderIcon(message.senderType)}
                      </div>
                    )}
                    
                    {/* Client Avatar */}
                    {isClient && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {conversation.clientUserId?.name?.charAt(0) || "?"}
                      </div>
                    )}
                    
                    <div>
                      {!isClient && (
                        <p className={`text-xs mb-1 ${isClient ? "text-left" : "text-right"} text-gray-500`}>
                          {message.senderType === "ai" ? "AI Assistant" :
                           message.senderType === "representative" ? (message.senderId === user?._id ? "You" : "Representative") :
                           "System"}
                        </p>
                      )}
                      <div className={`px-4 py-2 rounded-2xl ${getSenderColor(message.senderType)} ${
                        isClient ? "rounded-bl-md" : "rounded-br-md"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isClient ? "text-left" : "text-right"}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {sendingMessage && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-2xl">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-400">Sending...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {!isResolved ? (
            <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type your response..."
                    rows={1}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ minHeight: "42px", maxHeight: "120px" }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-gray-800 border-t border-gray-700 text-center">
              <p className="text-gray-400">This conversation has been resolved</p>
            </div>
          )}
        </div>
      </main>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Assign Representative</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {employees.map((emp) => (
                <button
                  key={emp._id}
                  onClick={() => handleAssignRepresentative(emp._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    conversation.assignedRepresentative?._id === emp._id
                      ? "bg-blue-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {emp.name?.charAt(0) || "?"}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{emp.name}</p>
                    <p className="text-gray-400 text-sm">{emp.role}</p>
                  </div>
                  {conversation.assignedRepresentative?._id === emp._id && (
                    <CheckCircle2 className="w-5 h-5 text-white ml-auto" />
                  )}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Resolve Conversation</h3>
            <p className="text-gray-400 mb-4">
              Add any resolution notes before closing this conversation.
            </p>
            
            <textarea
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="Resolution notes (optional)..."
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveConversation}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}

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
        roomName={callRoomName}
        identity={callIdentity}
        conversationId={conversationId}
      />
    </div>
  );
}
