import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('idToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Get active company ID from Zustand store or localStorage
    let companyId = localStorage.getItem('companyId');
    if (!companyId) {
      // Try to get from Zustand store
      try {
        const { default: useAuthStore } = require('@/store/authStore');
        companyId = useAuthStore.getState().activeCompanyId;
      } catch (e) {
        // Store not available, use localStorage
      }
    }
    
    if (companyId) {
      config.headers['X-Company-Id'] = companyId;
    }
  }
  return config;
});

export default apiClient;

