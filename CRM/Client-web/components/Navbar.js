"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";
import NotificationDropdown from "./NotificationDropdown";

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav 
      id="main-navbar"
      className="bg-gray-900 border-b border-gray-700 px-4 md:px-8 py-4 shadow-sm fixed top-0 left-0 right-0 z-50 w-full min-h-[60px]"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo - Left Side */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="text-xl md:text-2xl font-bold text-blue-400 no-underline hover:text-blue-300 transition-colors"
          >
            CRM Prime
          </Link>
        </div>

        {/* Desktop Navigation - Right Side */}
        <div className="hidden md:flex items-center gap-6">
          {/* Public navigation links - show when not logged in */}
          {!user && (
            <>
              <Link
                href="/"
                className={`no-underline px-3 py-2 rounded transition-all text-sm ${
                  isActive("/")
                    ? "text-blue-400 font-semibold bg-blue-500/20"
                    : "text-gray-400 font-normal hover:text-blue-400 hover:bg-gray-800"
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`no-underline px-3 py-2 rounded transition-all text-sm ${
                  isActive("/about")
                    ? "text-blue-400 font-semibold bg-blue-500/20"
                    : "text-gray-400 font-normal hover:text-blue-400 hover:bg-gray-800"
                }`}
              >
                About
              </Link>
              <Link
                href="/pricing"
                className={`no-underline px-3 py-2 rounded transition-all text-sm ${
                  isActive("/pricing")
                    ? "text-blue-400 font-semibold bg-blue-500/20"
                    : "text-gray-400 font-normal hover:text-blue-400 hover:bg-gray-800"
                }`}
              >
                Pricing
              </Link>
            </>
          )}

          {/* Logged in user navigation */}
          {user && !pathname?.startsWith("/dashboard") && (
            <>
              {isSuperAdmin() && (
                <Link
                  href="/super-admin"
                  className={`no-underline px-3 py-2 rounded transition-all text-sm ${
                    isActive("/super-admin")
                      ? "text-blue-400 font-semibold bg-blue-500/20"
                      : "text-gray-400 font-normal hover:text-blue-400 hover:bg-gray-800"
                  }`}
                >
                  Super Admin
                </Link>
              )}
              {!isSuperAdmin() && !activeCompanyId && companies.length === 0 && (
                <Link
                  href="/company-selection"
                  className={`no-underline px-3 py-2 rounded transition-all text-sm ${
                    isActive("/company-selection")
                      ? "text-blue-400 font-semibold bg-blue-500/20"
                      : "text-gray-400 font-normal hover:text-blue-400 hover:bg-gray-800"
                  }`}
                >
                  Select Company
                </Link>
              )}
            </>
          )}

          {/* Auth Buttons / User Info */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notifications - only show for logged in users */}
              <NotificationDropdown />

              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
                <span className="text-xs md:text-sm text-gray-300">
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
                className="px-3 py-2 bg-red-600 text-white border-none rounded cursor-pointer text-xs md:text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className={`no-underline px-3 py-2 rounded text-sm ${
                  isActive("/login")
                    ? "text-blue-400 font-semibold"
                    : "text-gray-400 font-normal hover:text-blue-400"
                }`}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="no-underline bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {!user && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-gray-400 text-sm px-2 py-1 hover:text-blue-400"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-300 px-2 py-1 bg-gray-800 rounded">
                {user.name || user.email}
              </div>
              <button
                onClick={handleLogout}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-400 hover:text-white p-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-800">
          <div className="flex flex-col gap-2 pt-4">
            {!user && (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded transition-all ${
                    isActive("/")
                      ? "text-blue-400 font-semibold bg-blue-500/20"
                      : "text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded transition-all ${
                    isActive("/about")
                      ? "text-blue-400 font-semibold bg-blue-500/20"
                      : "text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded transition-all ${
                    isActive("/pricing")
                      ? "text-blue-400 font-semibold bg-blue-500/20"
                      : "text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                  }`}
                >
                  Pricing
                </Link>
              </>
            )}
            {user && !pathname?.startsWith("/dashboard") && (
              <>
                {isSuperAdmin() && (
                  <Link
                    href="/super-admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded transition-all ${
                      isActive("/super-admin")
                        ? "text-blue-400 font-semibold bg-blue-500/20"
                        : "text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                    }`}
                  >
                    Super Admin
                  </Link>
                )}
                {!isSuperAdmin() && !activeCompanyId && companies.length === 0 && (
                  <Link
                    href="/company-selection"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded transition-all ${
                      isActive("/company-selection")
                        ? "text-blue-400 font-semibold bg-blue-500/20"
                        : "text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                    }`}
                  >
                    Select Company
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
