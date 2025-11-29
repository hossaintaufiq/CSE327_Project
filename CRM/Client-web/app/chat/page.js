"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import apiClient, { chatApi } from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import { Send, Plus, Users, MessageCircle, Search, MoreVertical, Phone, Video } from "lucide-react";

function ChatPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (selectedRoom && e.target.value.trim()) {
      setIsTyping(true);
      // Clear typing indicator after 2 seconds of no typing
      const timeout = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  };

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

        loadChatRooms();
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      
      // Set up polling for new messages
      const interval = setInterval(() => {
        loadMessages(selectedRoom.id);
      }, 3000); // Poll every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatRooms = async () => {
    try {
      const response = await chatApi.getChatRooms();
      if (response.success) {
        setChatRooms(response.data.chatRooms);
      }
    } catch (error) {
      console.error("Error loading chat rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId) => {
    try {
      const response = await chatApi.getChatMessages(roomId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const response = await chatApi.sendMessage(selectedRoom.id, {
        content: newMessage.trim(),
        messageType: 'text',
      });

      if (response.success) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage("");
        // Update chat room's last message
        loadChatRooms();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + (error.response?.data?.message || error.message));
    }
  };

  const createChatRoom = async (type, targetId = null) => {
    try {
      const roomData = {
        type,
        title: type === 'internal' ? 'New Internal Chat' : `New ${type} Chat`,
      };

      if (type === 'lead' && targetId) roomData.leadId = targetId;
      if (type === 'client' && targetId) roomData.clientId = targetId;

      const response = await chatApi.createChatRoom(roomData);
      if (response.success) {
        setChatRooms(prev => [response.data.chatRoom, ...prev]);
        setSelectedRoom(response.data.chatRoom);
        setShowNewChat(false);
      }
    } catch (error) {
      console.error("Error creating chat room:", error);
      alert("Failed to create chat room: " + (error.response?.data?.message || error.message));
    }
  };

  const getRoomDisplayName = (room) => {
    if (room.title) return room.title;
    if (room.type === 'lead' && room.lead) return `Lead: ${room.lead.name}`;
    if (room.type === 'client' && room.client) return `Client: ${room.client.name}`;
    if (room.type === 'internal') return 'Internal Chat';
    return 'Chat Room';
  };

  const getRoomTypeColor = (type) => {
    switch (type) {
      case 'lead': return 'bg-blue-500/20 text-blue-400';
      case 'client': return 'bg-green-500/20 text-green-400';
      case 'internal': return 'bg-purple-500/20 text-purple-400';
      case 'support': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredRooms = chatRooms.filter(room =>
    getRoomDisplayName(room).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Chat Rooms Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Chat</h1>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* New Chat Options */}
          {showNewChat && (
            <div className="p-4 border-b border-gray-700 bg-gray-750">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Start New Conversation</h3>
              <div className="space-y-2">
                <button
                  onClick={() => createChatRoom('internal')}
                  className="w-full p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-medium">Internal Chat</div>
                      <div className="text-sm text-gray-400">Chat with team members</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => createChatRoom('client')}
                  className="w-full p-3 bg-green-600/20 hover:bg-green-600/30 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="font-medium">Client Support</div>
                      <div className="text-sm text-gray-400">Chat with clients</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => createChatRoom('lead')}
                  className="w-full p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium">Lead Conversation</div>
                      <div className="text-sm text-gray-400">Chat with potential leads</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Chat Rooms List */}
          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to get connected</p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium truncate">{getRoomDisplayName(room)}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoomTypeColor(room.type)}`}>
                      {room.type}
                    </span>
                  </div>
                  {room.lastMessage && (
                    <p className="text-sm text-gray-400 truncate">
                      {room.lastMessage.sender.name}: {room.lastMessage.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(room.lastActivity).toLocaleDateString()}
                    </span>
                    {room.participants.length > 2 && (
                      <span className="text-xs text-gray-500">
                        {room.participants.length} members
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-medium">{getRoomDisplayName(selectedRoom)}</h2>
                      <p className="text-sm text-gray-400">
                        {selectedRoom.participants.length} members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium">
                        {message.sender.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white">{message.sender.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3 max-w-md">
                        <p className="text-gray-200">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium">?</span>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700 bg-gray-800">
                <form onSubmit={sendMessage} className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a chat room from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;