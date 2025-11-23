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
      
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

