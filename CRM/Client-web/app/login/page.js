"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import apiClient from "@/utils/api";
import { Mail, Lock } from "lucide-react";

// Helper function to get user-friendly error messages
const getErrorMessage = (error) => {
  // First, check if error message contains Firebase error patterns (highest priority)
  if (error.message) {
    const message = error.message;
    
    // Match patterns like "Firebase: Error (auth/invalid-credential)" or "auth/invalid-credential"
    // Try multiple regex patterns to catch all variations
    let errorCode = null;
    
    // Pattern 1: "Firebase: Error (auth/invalid-credential)"
    let match = message.match(/\(auth\/[\w-]+\)/i);
    if (match) {
      errorCode = match[0].replace(/[()]/g, '');
    }
    
    // Pattern 2: "auth/invalid-credential" without parentheses
    if (!errorCode) {
      match = message.match(/auth\/[\w-]+/i);
      if (match) {
        errorCode = match[0];
      }
    }
    
    if (errorCode) {
      
      // Handle specific Firebase error codes
      switch (errorCode.toLowerCase()) {
        case 'auth/invalid-credential':
          return 'Invalid email or password. Please check your credentials and try again.';
        case 'auth/user-not-found':
          return 'No account found with this email address. Please check your email or sign up.';
        case 'auth/wrong-password':
          return 'Incorrect password. Please try again or reset your password.';
        case 'auth/invalid-email':
          return 'Invalid email address. Please check and try again.';
        case 'auth/user-disabled':
          return 'This account has been disabled. Please contact support.';
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please try again later or reset your password.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection and try again.';
        default:
          if (errorCode.toLowerCase().startsWith('auth/')) {
            return 'Invalid email or password. Please check your credentials and try again.';
          }
      }
    }
    
    // Check for Firebase error keywords in message
    const lowerMessage = message.toLowerCase();
    if ((lowerMessage.includes('firebase') || lowerMessage.includes('auth/')) && 
        (lowerMessage.includes('error') || lowerMessage.includes('invalid'))) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
  }

  // Extract Firebase error code from error.code
  let errorCode = error.code;
  
  // If no code, try to extract from message string (e.g., "Firebase: Error (auth/invalid-credential)")
  if (!errorCode && error.message) {
    const match = error.message.match(/auth\/[\w-]+/);
    if (match) {
      errorCode = match[0];
    }
  }

  // Handle Firebase auth errors
  if (errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or reset your password.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check and try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later or reset your password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      default:
        // If it's a Firebase auth error but unknown code, show generic message
        if (errorCode.startsWith('auth/')) {
          return 'Invalid email or password. Please check your credentials and try again.';
        }
    }
  }
  
  // Check if error message contains Firebase error patterns (check FIRST before API errors)
  if (error.message) {
    const message = error.message;
    const lowerMessage = message.toLowerCase();
    
    // Try to extract error code from message using multiple patterns
    // Pattern 1: "Firebase: Error (auth/invalid-credential)"
    // Pattern 2: "auth/invalid-credential"
    // Pattern 3: "Invalid credential"
    const authErrorMatch = message.match(/\(?(auth\/[\w-]+)\)?/i) || 
                          message.match(/auth\/[\w-]+/i);
    
    if (authErrorMatch) {
      const extractedCode = authErrorMatch[0].replace(/[()]/g, '');
      switch (extractedCode.toLowerCase()) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          return 'Invalid email or password. Please check your credentials and try again.';
        case 'auth/user-not-found':
          return 'No account found with this email address. Please check your email or sign up.';
        case 'auth/invalid-email':
          return 'Invalid email address. Please check and try again.';
        default:
          if (extractedCode.toLowerCase().startsWith('auth/')) {
            return 'Invalid email or password. Please check your credentials and try again.';
          }
      }
    }
    
    // Check for Firebase error patterns in message text
    if (lowerMessage.includes('firebase') && (lowerMessage.includes('error') || lowerMessage.includes('auth'))) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lowerMessage.includes('invalid-credential') || lowerMessage.includes('invalid credential')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lowerMessage.includes('user-not-found') || lowerMessage.includes('user not found')) {
      return 'No account found with this email address. Please check your email or sign up.';
    }
    if (lowerMessage.includes('wrong-password') || lowerMessage.includes('wrong password')) {
      return 'Incorrect password. Please try again or reset your password.';
    }
  }

  // Handle API response errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const message = data?.message || data?.error?.message || data?.error?.code;
    
    // Check for specific error messages about account availability
    const lowerMessage = (message || '').toLowerCase();
    if (lowerMessage.includes('not found') || lowerMessage.includes('not available') || lowerMessage.includes('user not found')) {
      return 'Account not found. Please check your email address or sign up for a new account.';
    }
    
    if (status === 401) {
      return message || 'Invalid credentials. Please check your email and password.';
    }
    if (status === 403) {
      return message || 'Access denied. Your account may not have permission to access this system.';
    }
    if (status === 404) {
      return 'Account not found. Please check your credentials or sign up.';
    }
    if (status >= 500) {
      return 'Server error. Please try again later or contact support.';
    }
    
    // Return a user-friendly message instead of raw error
    if (message && !message.includes('Error') && !message.includes('error') && !message.includes('at ') && !message.includes('Exception')) {
      return message;
    }
    return 'Login failed. Please check your credentials and try again.';
  }

  // Handle network errors
  if (error.message && error.message.includes('Network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Handle generic errors - filter out technical/terminal error messages
  if (error.message) {
    const lowerMessage = error.message.toLowerCase();
    
    // Don't show raw error messages that look like terminal/technical errors
    if (lowerMessage.includes('firebase not initialized')) {
      return 'Authentication service is not available. Please refresh the page.';
    }
    if (lowerMessage.includes('invalid token') || lowerMessage.includes('token')) {
      return 'Session expired. Please try logging in again.';
    }
    
    // Filter out technical error patterns
    if (lowerMessage.includes('firebase:') || 
        lowerMessage.includes('error (') || 
        lowerMessage.includes('at ') ||
        lowerMessage.includes('exception') ||
        lowerMessage.includes('stack trace') ||
        lowerMessage.includes('typeerror') ||
        lowerMessage.includes('referenceerror')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    // Return generic message for other technical errors
    return 'Login failed. Please check your credentials and try again.';
  }

  return 'Invalid email or password. Please check your credentials and try again.';
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!auth) {
        throw new Error("Firebase not initialized");
      }

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Get ID token
      const idToken = await userCredential.user.getIdToken();

      // Store token
      localStorage.setItem("idToken", idToken);

      // Verify with backend and get user data
      const response = await apiClient.post("/auth/login", { idToken });
      
      if (response.data.success) {
        const { user } = response.data.data;
        
        // Store user data
        localStorage.setItem("user", JSON.stringify(user));
        
        // Import and update auth store
        const { default: useAuthStore } = await import("@/store/authStore");
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().setIdToken(idToken);

        // Redirect based on user state
        if (user.globalRole === 'super_admin') {
          router.push("/super-admin");
        } else if (user.companies && user.companies.length > 0) {
          // User has companies - automatically select first company and go to dashboard
          const firstCompany = user.companies.find((c) => c.isActive) || user.companies[0];
          if (firstCompany) {
            useAuthStore.getState().setActiveCompany(firstCompany.companyId, firstCompany.role);
            localStorage.setItem("companyId", firstCompany.companyId);
            router.push("/dashboard");
          } else {
            // No active company found, go to company selection
            router.push("/company-selection");
          }
        } else {
          // New user with no companies - go to company selection
          router.push("/company-selection");
        }
      }
    } catch (err) {
      // Log error to console for debugging (not shown to user)
      console.error("Login error:", err);
      
      // Always use error handler to get user-friendly message
      // This ensures no raw Firebase/technical errors are shown to users
      let userFriendlyError = getErrorMessage(err);
      
      // Safety check: if error handler returns something that looks like a technical error,
      // replace it with a generic user-friendly message
      const errorText = userFriendlyError || err.message || '';
      if (errorText.includes('Firebase:') || 
          errorText.includes('auth/') || 
          errorText.includes('Error (') ||
          errorText.match(/\(auth\/[\w-]+\)/)) {
        userFriendlyError = 'Invalid email or password. Please check your credentials and try again.';
      }
      
      setError(userFriendlyError || 'Invalid email or password. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account to continue</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-800/50 text-red-300 rounded-lg text-sm flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <a href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
