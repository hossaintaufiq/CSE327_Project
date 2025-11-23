"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/api";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validatePassword = (password) => {
    const errors = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
    setPasswordErrors(errors);
    return Object.values(errors).every(Boolean);
  };

  const isPasswordValid = () => {
    return Object.values(passwordErrors).every(Boolean);
  };

  const passwordsMatch = () => {
    return formData.password === formData.confirmPassword;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!mounted || typeof window === "undefined") return;
    
    // Validate password
    if (!isPasswordValid()) {
      setError("Please ensure your password meets all requirements.");
      return;
    }

    // Validate password match
    if (!passwordsMatch()) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // Call backend signup endpoint
      const response = await apiClient.post("/auth/signup", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        companyName: undefined,
      });

      if (response.data.success) {
        const { customToken, user } = response.data.data;

        // Dynamically import Firebase auth functions
        const { signInWithCustomToken } = await import("firebase/auth");
        const { auth } = await import("@/lib/firebase");
        
        if (!auth) {
          throw new Error("Firebase not initialized");
        }

        // Sign in with custom token
        const userCredential = await signInWithCustomToken(auth, customToken);
        const idToken = await userCredential.user.getIdToken();

        // Store token and user data
        localStorage.setItem("idToken", idToken);
        localStorage.setItem("user", JSON.stringify(user));
        
        // Update auth store
        const { default: useAuthStore } = await import("@/store/authStore");
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().setIdToken(idToken);

        // Redirect based on user state
        if (user.globalRole === 'super_admin') {
          router.push("/super-admin");
        } else if (user.companies && user.companies.length > 0) {
          // User just created a company - automatically select it and go to dashboard
          const newCompany = user.companies[0];
          if (newCompany) {
            useAuthStore.getState().setActiveCompany(newCompany.companyId, newCompany.role);
            localStorage.setItem("companyId", newCompany.companyId);
            router.push("/dashboard");
          } else {
            router.push("/company-selection");
          }
        } else {
          // New user with no companies - go to company selection
          router.push("/company-selection");
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Signup failed. Please try again.";
      setError(errorMessage);
      
      // Show more detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Full error:", err.response?.data || err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4">
      <div className="w-full max-w-md bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Create Account</h1>
          <p className="text-gray-400 text-sm">Join CRM Prime and get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700/50 text-red-300 rounded-lg text-sm flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                validatePassword(e.target.value);
              }}
              onBlur={() => setPasswordTouched(true)}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                passwordTouched && !isPasswordValid() ? "border-red-600" : "border-gray-700"
              }`}
              placeholder="Create a strong password"
            />
            {passwordTouched && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-400 mb-2">Password must contain:</p>
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-2 text-xs ${
                    passwordErrors.length ? "text-green-400" : "text-gray-500"
                  }`}>
                    <svg className={`w-4 h-4 ${passwordErrors.length ? "text-green-400" : "text-gray-600"}`} fill="currentColor" viewBox="0 0 20 20">
                      {passwordErrors.length ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${
                    passwordErrors.uppercase ? "text-green-400" : "text-gray-500"
                  }`}>
                    <svg className={`w-4 h-4 ${passwordErrors.uppercase ? "text-green-400" : "text-gray-600"}`} fill="currentColor" viewBox="0 0 20 20">
                      {passwordErrors.uppercase ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${
                    passwordErrors.lowercase ? "text-green-400" : "text-gray-500"
                  }`}>
                    <svg className={`w-4 h-4 ${passwordErrors.lowercase ? "text-green-400" : "text-gray-600"}`} fill="currentColor" viewBox="0 0 20 20">
                      {passwordErrors.lowercase ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${
                    passwordErrors.number ? "text-green-400" : "text-gray-500"
                  }`}>
                    <svg className={`w-4 h-4 ${passwordErrors.number ? "text-green-400" : "text-gray-600"}`} fill="currentColor" viewBox="0 0 20 20">
                      {passwordErrors.number ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>One number</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${
                    passwordErrors.special ? "text-green-400" : "text-gray-500"
                  }`}>
                    <svg className={`w-4 h-4 ${passwordErrors.special ? "text-green-400" : "text-gray-600"}`} fill="currentColor" viewBox="0 0 20 20">
                      {passwordErrors.special ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span>One special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              onBlur={() => setConfirmPasswordTouched(true)}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                confirmPasswordTouched && !passwordsMatch() ? "border-red-600" : "border-gray-700"
              }`}
              placeholder="Re-enter your password"
            />
            {confirmPasswordTouched && formData.confirmPassword && (
              <div className="mt-2">
                {passwordsMatch() ? (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Passwords match
                  </p>
                ) : (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Passwords do not match
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid() || !passwordsMatch()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

