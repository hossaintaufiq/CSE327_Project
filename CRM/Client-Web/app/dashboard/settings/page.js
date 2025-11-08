import React, { useState } from "react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleNotification = (type) =>
    setNotifications({ ...notifications, [type]: !notifications[type] });

  return (
    <div className={`min-h-screen p-6 font-sans ${darkMode ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Customize your CRM preferences</p>
        </header>

        {/* Profile Settings */}
        <section className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow space-y-4">
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              placeholder="Email Address"
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow space-y-2">
          <h2 className="text-xl font-semibold">Notifications</h2>
          {["email", "sms", "push"].map((type) => (
            <label key={type} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notifications[type]}
                onChange={() => toggleNotification(type)}
                className="w-4 h-4"
              />
              <span className="capitalize">{type} notifications</span>
            </label>
          ))}
        </section>

        {/* Theme */}
        <section className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow flex items-center justify-between">
          <span className="font-semibold">Dark Mode</span>
          <button
            onClick={toggleDarkMode}
            className={`px-4 py-2 rounded-md ${darkMode ? "bg-indigo-600 text-white" : "bg-zinc-200 dark:bg-zinc-700"}`}
          >
            {darkMode ? "Enabled" : "Disabled"}
          </button>
        </section>

        {/* Account Actions */}
        <section className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow space-y-2">
          <h2 className="text-xl font-semibold">Account</h2>
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 w-full">Change Password</button>
          <button className="px-4 py-2 rounded-md bg-rose-500 text-white hover:bg-rose-600 w-full">Delete Account</button>
        </section>
      </div>
    </div>
  );
}
