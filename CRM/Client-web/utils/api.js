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
    
    console.log("API Debug - Request URL:", config.url);
    console.log("API Debug - Token exists:", !!token);
    console.log("API Debug - Company ID:", companyId);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (companyId) {
      config.headers['X-Company-Id'] = companyId;
    }
    
    console.log("API Debug - Final headers:", config.headers);
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

