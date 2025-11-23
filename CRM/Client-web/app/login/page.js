"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import apiClient from "@/utils/api";

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
        
        console.log("Login successful, user data:", user);
        console.log("User globalRole:", user.globalRole);
        
        // Store user data
        localStorage.setItem("user", JSON.stringify(user));
        
        // Import and update auth store
        const { default: useAuthStore } = await import("@/store/authStore");
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().setIdToken(idToken);

        // Redirect based on user state
        if (user.globalRole === 'super_admin') {
          console.log("Redirecting to super-admin dashboard");
          router.push("/super-admin");
        } else if (user.companies && user.companies.length > 0) {
          // User has companies - automatically select first company and go to dashboard
          const firstCompany = user.companies.find((c) => c.isActive) || user.companies[0];
          if (firstCompany) {
            useAuthStore.getState().setActiveCompany(firstCompany.companyId, firstCompany.role);
            localStorage.setItem("companyId", firstCompany.companyId);
            console.log("User has companies, redirecting to dashboard");
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
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block mb-2 text-gray-300">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-gray-300">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
