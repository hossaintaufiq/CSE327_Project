"use client";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Future: Connect with backend API
    setTimeout(() => {
      alert("Message Sent! ✅ We will contact you soon.");
      setLoading(false);
      setForm({ name: "", email: "", message: "" });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="text-zinc-400">
            Need help or have a question? Our team is always here for you 🚀
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
            <h3 className="font-semibold text-lg">Email</h3>
            <p className="text-zinc-400 text-sm mt-1">support@ai-crm.com</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
            <h3 className="font-semibold text-lg">Phone</h3>
            <p className="text-zinc-400 text-sm mt-1">+1 (800) 123-4567</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
            <h3 className="font-semibold text-lg">Location</h3>
            <p className="text-zinc-400 text-sm mt-1">Remote • Worldwide 🌍</p>
          </div>
        </div>

        {/* Message Form */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl space-y-5"
        >
          {/* Name */}
          <div>
            <label className="block text-sm mb-2">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm mb-2">Message</label>
            <textarea
              required
              rows="4"
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Write your message here..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 transition
                       font-semibold rounded-lg text-white shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>

      </div>
    </div>
  );
}
