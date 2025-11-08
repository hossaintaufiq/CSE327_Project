"use client";

import React, { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const toggleNotification = (type) =>
    setNotifications({ ...notifications, [type]: !notifications[type] });

  const handleProfileChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen p-6 font-sans bg-zinc-900 text-zinc-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </header>

        {/* Profile Settings */}
        <section className="bg-zinc-800 rounded-2xl p-6 shadow space-y-4">
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Full Name"
              className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              placeholder="Email Address"
              className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-zinc-800 rounded-2xl p-6 shadow space-y-3">
          <h2 className="text-xl font-semibold">Notifications</h2>
          {["email", "sms", "push"].map((type) => (
            <label
              key={type}
              className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg shadow-sm"
            >
              <span className="capitalize">{type} notifications</span>
              <input
                type="checkbox"
                checked={notifications[type]}
                onChange={() => toggleNotification(type)}
                className="w-4 h-4 accent-indigo-500"
              />
            </label>
          ))}
        </section>

        {/* Additional Settings Card */}
        <section className="bg-zinc-800 rounded-2xl p-6 shadow flex items-center justify-between">
          <span className="font-semibold">Dark Mode</span>
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white">
            Enabled
          </button>
        </section>
      </div>
    </div>
  );
}
