"use client";

import React from "react";

export default function LandingPage() {
  return (
    <div className="bg-zinc-900 text-zinc-100 font-sans">

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-6 py-32 gap-12">
        <div className="lg:w-1/2 space-y-6">
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
            CRM Prime: AI Powered CRM 
          </h1>
          <p className="text-zinc-300 text-lg lg:text-xl">
            The unified AI-powered CRM that turns your customer data into actionable insights, automates communication, and accelerates your sales productivity.
          </p>
          <div className="flex gap-4 mt-6">
            <a
              href="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 hover:scale-105 transition transform"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="px-6 py-3 border border-zinc-600 rounded-xl hover:scale-105 transition transform"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero 3D Card */}
        <div className="lg:w-1/2 perspective-1000">
          <div className="relative w-full max-w-md mx-auto">
            <div className="bg-gradient-to-r from-indigo-500 to-pink-500 rounded-3xl shadow-2xl p-1 transform rotate-3 hover:rotate-0 transition-all duration-700">
              <div className="bg-zinc-900 rounded-3xl p-6 shadow-inner flex flex-col gap-4">
                <h2 className="text-xl font-semibold">Dashboard Preview</h2>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-zinc-400">Monthly Revenue</p>
                    <p className="text-lg font-bold">$42,800</p>
                  </div>
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-sm">
                    +12%
                  </div>
                </div>
                <div className="bg-zinc-800 h-24 rounded-xl flex items-center justify-center text-zinc-400">
                  Graph Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 space-y-12">
        <h2 className="text-4xl font-bold text-center">The Solution: A Unified, Intelligent, and Fast AI CRM</h2>
        <p className="text-zinc-400 text-lg text-center max-w-3xl mx-auto">
          Service365 AI CRM delivers a unified workspace where AI powers actionable insights, automates repetitive tasks, and enhances productivity. We transform data clutter into intelligence, making every customer interaction smarter and faster.
        </p>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-800 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
            <h3 className="text-xl font-semibold mb-2">Unified Workspace</h3>
            <p className="text-zinc-400">
              One source of truth combining Sales Pipeline, Marketing Campaigns, and Support Tickets.
            </p>
          </div>
          <div className="bg-zinc-800 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
            <h3 className="text-xl font-semibold mb-2">AI-Driven Insights</h3>
            <p className="text-zinc-400">
              Predictive analytics for sales forecasting, lead scoring, and automated task prioritization.
            </p>
          </div>
          <div className="bg-zinc-800 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
            <h3 className="text-xl font-semibold mb-2">Clean UX/UI</h3>
            <p className="text-zinc-400">
              Designed for speed and simplicity across desktop and mobile, ensuring high adoption.
            </p>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="bg-zinc-800 py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <h2 className="text-4xl font-bold text-center">AI-Powered Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
              <h3 className="text-xl font-semibold mb-2">AI Meeting & Communication Assistant</h3>
              <p className="text-zinc-400">
                Automatically generates summaries from meetings, calls, and emails, instantly synced to your dashboard.
              </p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
              <h3 className="text-xl font-semibold mb-2">Voice Navigation & Smart Briefing</h3>
              <p className="text-zinc-400">
                Hands-free voice control. Before any meeting, get a quick briefing of key customer updates, tasks, and opportunities.
              </p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
              <h3 className="text-xl font-semibold mb-2">Omni-Channel Messaging</h3>
              <p className="text-zinc-400">
                Respond to leads directly through automated WhatsApp, Telegram, and Email bots — synced in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 space-y-12">
        <h2 className="text-4xl font-bold text-center">Product Demo: Key Pages Inside Service365 CRM</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-zinc-800 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
            <h3 className="text-xl font-semibold mb-2">Real-Time Dashboard</h3>
            <p className="text-zinc-400">
              Instant overview of Pipeline Value, Lead Generation, and Support Ticket status.
            </p>
          </div>
          <div className="bg-zinc-800 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
            <h3 className="text-xl font-semibold mb-2">Deals Pipeline (Kanban)</h3>
            <p className="text-zinc-400">
              Intuitive drag-and-drop management of sales stages with live totals and automated scoring.
            </p>
          </div>
          <div className="bg-zinc-800 rounded-2xl p-6 shadow hover:shadow-2xl transition transform hover:-translate-y-2">
            <h3 className="text-xl font-semibold mb-2">Interactive Reports</h3>
            <p className="text-zinc-400">
              Seven exportable, data-rich charts covering Sales Forecast, Product Revenue, and Campaign ROI.
            </p>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="bg-indigo-600 text-white py-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to transform your sales?</h2>
          <p className="text-lg">
            Sign up today and experience the full power of Service365 AI CRM.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Footer
      <footer className="bg-zinc-900 text-zinc-400 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2025  CRM Prime. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="/terms" className="hover:text-white transition">Terms</a>
            <a href="/contact" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer> */}

    </div>
  );
}
