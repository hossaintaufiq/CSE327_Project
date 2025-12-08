"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  MessageSquare,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import useAuthStore from "@/store/authStore";
import api from "@/utils/api";

export default function AIAssistantPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole } = useAuthStore();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check authentication
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    // Wait for store to hydrate
    if (!activeCompanyId || !activeCompanyRole) {
      return;
    }
    
    // Only employees, managers, and admins can access
    if (!["employee", "manager", "company_admin"].includes(activeCompanyRole)) {
      router.push("/dashboard");
      return;
    }

    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your AI Assistant powered by Gemini. I can help you with:\n\n• Search and manage clients\n• View and update orders\n• Create and manage tasks\n• Access project information\n• Analyze CRM data and provide insights\n• Generate content like emails and descriptions\n\nJust ask me anything about your CRM!`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [mounted, activeCompanyId, activeCompanyRole, router, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const companyId = localStorage.getItem("companyId");
      
      const response = await api.post("/ai/process-request", {
        prompt: userMessage.content,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }, {
        params: { companyId },
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.data.response,
        timestamp: response.data.data.timestamp,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      let errorMsg = "";
      
      if (error.response?.status === 401) {
        errorMsg = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMsg = "You don't have permission to access this feature.";
      } else if (error.response?.status === 429) {
        errorMsg = error.response?.data?.message || "You have exceeded the API rate limit. Please wait about 1 minute and try again.";
      } else if (error.response?.status === 503) {
        errorMsg = error.response?.data?.message || "AI service is not configured. Please contact your administrator.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message;
      } else if (error.message) {
        errorMsg = error.message;
      } else {
        errorMsg = "An unknown error occurred. Please try again.";
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMsg,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm your AI Assistant powered by Gemini. I can help you with:\n\n• Search and manage clients\n• View and update orders\n• Create and manage tasks\n• Access project information\n• Analyze CRM data and provide insights\n• Generate content like emails and descriptions\n\nJust ask me anything about your CRM!`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const suggestedPrompts = [
    "Show me my recent clients",
    "What are the pending orders?",
    "Create a task for follow-up",
    "Analyze this week's sales",
    "Generate an email for a client",
  ];

  const handleSuggestedPrompt = (prompt) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">AI Assistant</h1>
                  <p className="text-gray-400 mt-1">Powered by Gemini with MCP Tools</p>
                </div>
              </div>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-2xl">
            {/* Messages Area */}
            <div className="h-[600px] overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                        : message.isError
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-gray-700/50 text-gray-100 border border-gray-600/30"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className="text-xs mt-2 opacity-60">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gray-700/50 border border-gray-600/30 rounded-2xl p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    <p className="text-sm text-gray-300">Thinking...</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts (only show when no messages except welcome) */}
            {messages.length === 1 && (
              <div className="px-6 pb-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-400 mb-3 mt-4">Suggested prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-700/50 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything about your CRM..."
                  className="flex-1 bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2 text-center">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-medium">Natural Language</h3>
              </div>
              <p className="text-sm text-gray-400">
                Ask questions in plain English - no need for complex queries
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">MCP Tools</h3>
              </div>
              <p className="text-sm text-gray-400">
                Integrated with your CRM data for real-time insights
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-medium">Context Aware</h3>
              </div>
              <p className="text-sm text-gray-400">
                Remembers your conversation for better assistance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
