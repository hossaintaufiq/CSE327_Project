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
    if (error.response?.status === 401) {
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

