"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  CreditCard,
  FileText,
  Bell,
  Shield,
  Database,
  ToggleLeft,
  HeadphonesIcon,
  Activity,
} from "lucide-react";
import useAuthStore from "@/store/authStore";

export default function SuperAdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentSearch, setCurrentSearch] = useState("");

  useEffect(() => {
    setMounted(true);
    // Update search on mount and when pathname changes
    if (typeof window !== "undefined") {
      setCurrentSearch(window.location.search);
    }
  }, [pathname]);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/super-admin" },
    { icon: Building2, label: "Companies", href: "/super-admin?tab=companies" },
    { icon: Users, label: "Users", href: "/super-admin?tab=users" },
    { icon: CreditCard, label: "Subscriptions", href: "/super-admin?tab=subscriptions" },
    { icon: Bell, label: "Announcements", href: "/super-admin?tab=announcements" },
    { icon: HeadphonesIcon, label: "Support & Issues", href: "/super-admin?tab=issues" },
    { icon: Activity, label: "Activity Logs", href: "/super-admin?tab=activity" },
    { icon: Database, label: "Database Monitor", href: "/super-admin?tab=database" },
    { icon: Settings, label: "Platform Settings", href: "/super-admin?tab=settings" },
    { icon: ToggleLeft, label: "Feature Toggles", href: "/super-admin?tab=features" },
    { icon: Shield, label: "Admin Accounts", href: "/super-admin?tab=admins" },
  ];

  const isActive = (href) => {
    if (!mounted || typeof window === "undefined") return false;
    
    if (href === "/super-admin") {
      return pathname === "/super-admin" && !currentSearch.includes("tab");
    }
    if (href.includes("tab=")) {
      const tab = href.split("tab=")[1];
      return currentSearch.includes(`tab=${tab}`);
    }
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      const { default: useAuthStore } = await import("@/store/authStore");
      useAuthStore.getState().logout();
      
      if (typeof window !== "undefined") {
        const { auth } = await import("@/lib/firebase");
        const { signOut } = await import("firebase/auth");
        if (auth) {
          await signOut(auth);
        }
        localStorage.removeItem("idToken");
        localStorage.removeItem("user");
        localStorage.removeItem("companyId");
      }
      
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-0 left-4 z-50 p-2 bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 transition-colors mt-4"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white z-30
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Super Admin</h2>
            <p className="text-sm text-gray-400 mt-1">Platform Management</p>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || user?.email || "Super Admin"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${
                          active
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

