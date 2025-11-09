"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";
import "./globals.css";
import Footer from "./components/footer/page";
import { ChevronDown, LogOut, User } from "lucide-react";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/auth/login");
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <html lang="en">
      <body className="bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
        <header className="w-full py-4 px-6 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="font-bold text-lg">
            CRM Prime
          </Link>

          <nav className="flex gap-4 text-sm items-center relative">
            <Link href="/" className="hover:text-indigo-600">
              Home
            </Link>

            {user && (
              <Link href="/dashboard" className="hover:text-indigo-600 font-medium">
                Dashboard
              </Link>
            )}

            <Link href="/about" className="hover:text-indigo-600">
              About
            </Link>
            <Link href="/terms" className="hover:text-indigo-600">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-indigo-600">
              Contact
            </Link>

            {!user && (
              <>
                <Link href="/auth/login" className="hover:text-indigo-600">
                  Login
                </Link>
                <Link href="/auth/signup" className="hover:text-indigo-600">
                  Sign Up
                </Link>
              </>
            )}

            {/* Profile Dropdown Menu */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 font-medium hover:text-indigo-600 transition"
                >
                  <User className="w-4 h-4" />
                  {user.displayName || user.email.split("@")[0]}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" /> View Profile
                    </Link>
                    <hr className="border-zinc-200 dark:border-zinc-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </header>

        <main className="pt-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
