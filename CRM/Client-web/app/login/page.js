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
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#f5f5f5"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h1 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Login</h1>
        
        {error && (
          <div style={{
            padding: "0.75rem",
            backgroundColor: "#fee",
            color: "#c33",
            borderRadius: "4px",
            marginBottom: "1rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center", color: "#666" }}>
          Don't have an account?{" "}
          <a href="/signup" style={{ color: "#0070f3" }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}
