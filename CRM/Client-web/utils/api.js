import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('idToken');
    const companyId = localStorage.getItem('companyId');
    
    // Check if token exists and is not expired
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        // If token expires within 5 minutes, refresh it
        if (payload.exp - currentTime < 300) {
          console.log("Token expiring soon, refreshing...");
          const { auth } = await import('@/lib/firebase');
          const user = auth.currentUser;
          
          if (user) {
            const newToken = await user.getIdToken(true); // Force refresh
            localStorage.setItem('idToken', newToken);
            token = newToken;
            
            // Update auth store
            try {
              const { default: useAuthStore } = await import('@/store/authStore');
              useAuthStore.getState().setIdToken(newToken);
            } catch (e) {
              // Store not available
            }
          }
        }
      } catch (error) {
        console.error("Error checking token expiry:", error);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (companyId) {
      config.headers['X-Company-Id'] = companyId;
    }
  }
  return config;
});

export default apiClient;

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only auto-logout on 401 if:
    // 1. It's an actual authentication failure (not a missing header or expired token that can be refreshed)
    // 2. The current page isn't already the login page
    if (error.response?.status === 401) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      
      // Don't auto-redirect if already on login page or if the error is from a background request
      if (currentPath === '/login' || currentPath === '/signup') {
        return Promise.reject(error);
      }
      
      // Check if this is a token refresh scenario or a real auth failure
      const errorMessage = error.response?.data?.message || '';
      
      // Only logout on definitive auth failures
      if (errorMessage.includes('Invalid token') || 
          errorMessage.includes('Token expired') ||
          errorMessage.includes('No token provided')) {
        console.log("401 error detected - clearing auth and redirecting to login");

        // Clear authentication data
        localStorage.removeItem('idToken');
        localStorage.removeItem('user');
        localStorage.removeItem('companyId');

        // Clear auth store
        try {
          const { default: useAuthStore } = await import('@/store/authStore');
          useAuthStore.getState().logout();
        } catch (e) {
          // Store not available
        }

        // Clear notification store
        try {
          const { default: useNotificationStore } = await import('@/store/notificationStore');
          useNotificationStore.getState().clearNotifications();
        } catch (e) {
          // Store not available
        }

        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else {
        console.log("401 error (non-auth):", errorMessage);
      }
    }

    return Promise.reject(error);
  }
);

// Notification API functions
export const notificationAPI = {
  // Get all notifications for the user
  getNotifications: async (params = {}) => {
    const { limit = 50, offset = 0, isRead } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (isRead !== undefined) {
      queryParams.append('isRead', isRead.toString());
    }

    const response = await apiClient.get(`/notifications?${queryParams}`);
    return response.data;
  },

  // Get specific notification by ID
  getNotificationById: async (notificationId) => {
    const response = await apiClient.get(`/notifications/${notificationId}`);
    return response.data;
  },

  // Create a new notification
  createNotification: async (notificationData) => {
    const response = await apiClient.post('/notifications', notificationData);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

// Chat API functions
export const chatApi = {
  // Get all chat rooms for the user
  getChatRooms: async (params = {}) => {
    const response = await apiClient.get('/chat/rooms', { params });
    return response.data;
  },

  // Get messages for a specific chat room
  getChatMessages: async (roomId, params = {}) => {
    const response = await apiClient.get(`/chat/rooms/${roomId}/messages`, { params });
    return response.data;
  },

  // Create a new chat room
  createChatRoom: async (roomData) => {
    const response = await apiClient.post('/chat/rooms', roomData);
    return response.data;
  },

  // Send a message to a chat room
  sendMessage: async (roomId, messageData) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/messages`, messageData);
    return response.data;
  },

  // Add participant to chat room
  addParticipant: async (roomId, userId, role = 'member') => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/participants`, { userId, role });
    return response.data;
  },

  // Update chat room
  updateChatRoom: async (roomId, updates) => {
    const response = await apiClient.put(`/chat/rooms/${roomId}`, updates);
    return response.data;
  },

  // Set typing status
  setTypingStatus: async (roomId, isTyping) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/typing`, { isTyping });
    return response.data;
  },
};

// AI API functions
export const aiApi = {
  // Check AI service health
  checkHealth: async () => {
    const response = await apiClient.get('/ai/health');
    return response.data;
  },

  // Generate text
  generateText: async (prompt) => {
    const response = await apiClient.post('/ai/generate', { prompt });
    return response.data;
  },

  // Summarize content
  summarize: async (content, maxLength) => {
    const response = await apiClient.post('/ai/summarize', { content, maxLength });
    return response.data;
  },

  // Get task suggestions for a project
  suggestTasks: async (projectId) => {
    const response = await apiClient.post(`/ai/projects/${projectId}/suggest-tasks`);
    return response.data;
  },

  // Generate email draft for a client
  generateEmailDraft: async (clientId, { purpose, context, tone }) => {
    const response = await apiClient.post(`/ai/clients/${clientId}/email-draft`, { purpose, context, tone });
    return response.data;
  },

  // Analyze client
  analyzeClient: async (clientId) => {
    const response = await apiClient.get(`/ai/clients/${clientId}/analyze`);
    return response.data;
  },

  // Smart search
  smartSearch: async (query, entityType) => {
    const response = await apiClient.post('/ai/smart-search', { query, entityType });
    return response.data;
  },

  // Generate project description
  generateProjectDescription: async (title, briefDescription) => {
    const response = await apiClient.post('/ai/generate-description', { title, briefDescription });
    return response.data;
  },

  // Suggest responses for chat
  suggestResponses: async (message, clientName, conversationContext) => {
    const response = await apiClient.post('/ai/suggest-responses', { message, clientName, conversationContext });
    return response.data;
  },

  // Get company dashboard insights and recommendations
  getCompanyInsights: async () => {
    const response = await apiClient.get('/ai/company/insights');
    return response.data;
  },
};

// MCP API functions
export const mcpApi = {
  // List available tools
  listTools: async () => {
    const response = await apiClient.get('/mcp/tools');
    return response.data;
  },

  // Execute a tool
  executeTool: async (tool, params) => {
    const response = await apiClient.post('/mcp/execute', { tool, params });
    return response.data;
  },

  // Get context
  getContext: async (type) => {
    const response = await apiClient.get(`/mcp/context/${type}`);
    return response.data;
  },

  // Batch execute tools
  batchExecute: async (operations) => {
    const response = await apiClient.post('/mcp/batch', { operations });
    return response.data;
  },
};

// Pipeline API functions
export const pipelineApi = {
  // Get all pipeline configurations
  getAllConfigs: async () => {
    const response = await apiClient.get('/pipeline/config');
    return response.data;
  },

  // Get specific pipeline config
  getConfig: async (pipelineType) => {
    const response = await apiClient.get(`/pipeline/config/${pipelineType}`);
    return response.data;
  },

  // Get dashboard summary (all pipelines)
  getDashboardSummary: async () => {
    const response = await apiClient.get('/pipeline/dashboard');
    return response.data;
  },

  // Get summary for a pipeline type
  getSummary: async (pipelineType) => {
    const response = await apiClient.get(`/pipeline/${pipelineType}/summary`);
    return response.data;
  },

  // Get entities in a specific stage
  getEntitiesInStage: async (pipelineType, stage, limit) => {
    const response = await apiClient.get(`/pipeline/${pipelineType}/stage/${stage}`, { params: { limit } });
    return response.data;
  },

  // Validate a transition (preview)
  validateTransition: async (pipelineType, currentStage, targetStage) => {
    const response = await apiClient.post(`/pipeline/${pipelineType}/validate`, { currentStage, targetStage });
    return response.data;
  },

  // Move entity to a stage
  moveToStage: async (pipelineType, entityId, targetStage, notes) => {
    const response = await apiClient.post(`/pipeline/${pipelineType}/${entityId}/move`, { targetStage, notes });
    return response.data;
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    const response = await apiClient.get('/pipeline/approvals/pending');
    return response.data;
  },

  // Process an approval
  processApproval: async (approvalId, approved, reason) => {
    const response = await apiClient.post(`/pipeline/approvals/${approvalId}`, { approved, reason });
    return response.data;
  },
};

// Voice Chat API functions
export const voiceChatApi = {
  // Check if voice chat is enabled
  getStatus: async () => {
    const response = await apiClient.get('/voice-chat/status');
    return response.data;
  },

  // Create a new call room
  createRoom: async (options = {}) => {
    const response = await apiClient.post('/voice-chat/rooms', options);
    return response.data;
  },

  // Get active calls
  getActiveCalls: async () => {
    const response = await apiClient.get('/voice-chat/active');
    return response.data;
  },

  // Get meeting token for a room
  getMeetingToken: async (roomName, isOwner = false) => {
    const response = await apiClient.get(`/voice-chat/rooms/${roomName}/token`, { params: { isOwner } });
    return response.data;
  },

  // Get room participants
  getRoomParticipants: async (roomName) => {
    const response = await apiClient.get(`/voice-chat/rooms/${roomName}/participants`);
    return response.data;
  },

  // Get room recordings
  getRecordings: async (roomName) => {
    const response = await apiClient.get(`/voice-chat/rooms/${roomName}/recordings`);
    return response.data;
  },

  // End a call
  endCall: async (roomName) => {
    const response = await apiClient.delete(`/voice-chat/rooms/${roomName}`);
    return response.data;
  },

  // Initiate a call to another user
  initiateCall: async (recipientId, recipientName) => {
    const response = await apiClient.post('/voice-chat/call', { recipientId, recipientName });
    return response.data;
  },

  // Create a group call
  createGroupCall: async (name, participants) => {
    const response = await apiClient.post('/voice-chat/group-call', { name, participants });
    return response.data;
  },

  // Answer an incoming call
  answerCall: async (roomName) => {
    const response = await apiClient.post(`/voice-chat/call/${roomName}/answer`);
    return response.data;
  },

  // Decline an incoming call
  declineCall: async (roomName, reason) => {
    const response = await apiClient.post(`/voice-chat/call/${roomName}/decline`, { reason });
    return response.data;
  },
};

// Voice AI API functions
export const voiceAIApi = {
  // Process voice input (text)
  process: async (text, sessionId) => {
    const response = await apiClient.post('/voice-ai/process', { text, sessionId });
    return response.data;
  },

  // Get conversation history
  getHistory: async (sessionId) => {
    const response = await apiClient.get(`/voice-ai/history/${sessionId || ''}`);
    return response.data;
  },

  // Clear conversation history
  clearHistory: async (sessionId) => {
    const response = await apiClient.delete(`/voice-ai/history/${sessionId || ''}`);
    return response.data;
  },

  // Get quick commands
  getCommands: async () => {
    const response = await apiClient.get('/voice-ai/commands');
    return response.data;
  },
};
