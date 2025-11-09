
"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/firebase/config"; // make sure this path matches your setup
import { useRouter } from "next/navigation";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: form.name,
      });

      alert("Account created successfully! 🎉");
      router.push("/dashboard"); // redirect wherever you want
    } catch (error) {
      console.error("Signup error:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/20 to-transparent blur-3xl animate-pulse"></div>
      <div className="absolute top-24 -left-10 w-28 h-28 bg-indigo-600/40 rounded-3xl animate-spin-slow [transform:rotateX(25deg)] shadow-2xl"></div>
      <div className="absolute bottom-32 right-10 w-16 h-16 bg-indigo-500/40 rounded-xl animate-bounce"></div>
      <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-indigo-800/30 rounded-lg animate-slow-bounce"></div>

      {/* Form */}
      <div className="relative bg-white/10 backdrop-blur-xl p-10 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl transform hover:scale-[1.02] transition">
        <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
        <p className="text-zinc-300 text-center text-sm mb-6">
          AI-powered CRM — Automate & Grow Faster 🚀
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-700 focus:border-indigo-500 outline-none pr-12"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-zinc-300 hover:text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold shadow-lg transition transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Redirect */}
        <p className="text-center mt-6 text-sm text-zinc-400">
          Already registered?{" "}
          <a href="/auth/login" className="text-indigo-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
