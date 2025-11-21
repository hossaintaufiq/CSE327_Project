"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, companies, activeCompanyId, activeCompanyRole, logout, isSuperAdmin } = useAuthStore();

  useEffect(() => {
    // Sync user from localStorage on mount
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          useAuthStore.getState().setUser(parsedUser);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        const { auth } = await import("@/lib/firebase");
        const { signOut } = await import("firebase/auth");
        
        if (auth) {
          await signOut(auth);
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      router.push("/login");
    }
  };

  const isActive = (path) => pathname === path;

  return (
    <nav 
      id="main-navbar"
      className="bg-gray-900 border-b border-gray-700 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50 w-full min-h-[60px]"
    >
      <div className="flex items-center gap-8">
        <Link 
          href="/" 
          className="text-2xl font-bold text-blue-400 no-underline hover:text-blue-300 transition-colors"
        >
          CRM Platform
        </Link>

        {/* Hide navigation links on dashboard pages - they're in the sidebar */}
        {user && !pathname?.startsWith("/dashboard") && (
          <div className="flex gap-6 items-center">
            {/* Super Admin link */}
            {isSuperAdmin() && (
              <Link
                href="/super-admin"
                className={`no-underline px-4 py-2 rounded transition-all ${
                  isActive("/super-admin")
                    ? "text-blue-400 font-semibold bg-blue-500/20"
                    : "text-gray-400 font-normal hover:text-blue-400 hover:bg-gray-800"
                }`}
              >
                Super Admin
              </Link>
            )}

            {/* Show company selection link if user has no active company */}
            {!isSuperAdmin() && !activeCompanyId && companies.length === 0 && (
              <Link
                href="/company-selection"
                className={`no-underline px-4 py-2 rounded transition-all ${
                  isActive("/company-selection")
                    ? "text-blue-400 font-semibold bg-blue-500/20"
                    : "text-gray-400 font-normal hover:text-blue-400 hover:bg-gray-800"
                }`}
              >
                Select Company
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
              <span className="text-sm text-gray-300">
                {user.name || user.email}
              </span>
              {isSuperAdmin() ? (
                <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded">
                  Super Admin
                </span>
              ) : activeCompanyRole ? (
                <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded capitalize">
                  {activeCompanyRole.replace("_", " ")}
                </span>
              ) : (
                <span className="text-xs px-2 py-1 bg-gray-600 text-white rounded">
                  User
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white border-none rounded cursor-pointer text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex gap-4">
            <Link
              href="/login"
              className={`no-underline px-4 py-2 rounded ${
                isActive("/login")
                  ? "text-blue-400 font-semibold"
                  : "text-gray-400 font-normal hover:text-blue-400"
              }`}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="no-underline bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
