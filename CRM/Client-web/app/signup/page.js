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
    companyName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!mounted || typeof window === "undefined") return;
    
    setLoading(true);
    setError("");

    try {
      // Call backend signup endpoint
      const response = await apiClient.post("/auth/signup", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        companyName: formData.companyName || undefined,
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
        <h1 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Sign Up</h1>

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

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>

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

          <div style={{ marginBottom: "1rem" }}>
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

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Company Name (optional - leave blank to join existing company)
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Create new company"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
            <small style={{ color: "#666", fontSize: "0.875rem" }}>
              {formData.companyName
                ? "You will be assigned as Company Admin"
                : "You will be assigned as Employee"}
            </small>
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
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center", color: "#666" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#0070f3" }}>Login</a>
        </p>
      </div>
    </div>
  );
}

