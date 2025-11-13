import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem("authToken");
      // Optionally redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// User API endpoints
export const userAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get("/users/me");
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await apiClient.post("/users/register", userData);
    return response.data;
  },

  // Get all users (admin only)
  getAll: async () => {
    const response = await apiClient.get("/users");
    return response.data;
  },

  // Update user profile
  update: async (userId, userData) => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },
};

// Export axios instance for custom requests
export default apiClient;

// Backup simple fetch-based api function (deprecated, use userAPI instead)
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api";

export const api = async (url, token, method = "GET", body = null) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${url}`, options);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

