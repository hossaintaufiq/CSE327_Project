
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/auth/login");
      } else {
        setLoading(false); // User logged in, allow access
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="text-xl font-bold mb-6">AI CRM</h2>
        <nav className="space-y-3">
          <a href="/dashboard" className="block hover:text-blue-500">
            Dashboard
          </a>
          <a href="/dashboard/leads" className="block hover:text-blue-500">
            Leads
          </a>
          <a href="/dashboard/sales" className="block hover:text-blue-500">
            Sales
          </a>
          <a href="/dashboard/analytics" className="block hover:text-blue-500">
            Analytics
          </a>
          <a href="/dashboard/tasks" className="block hover:text-blue-500">
            Tasks
          </a>
          <a href="/dashboard/settings" className="block hover:text-blue-500">
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>

      {/* Logout button at the bottom */}
  
    </div>
  );
}
