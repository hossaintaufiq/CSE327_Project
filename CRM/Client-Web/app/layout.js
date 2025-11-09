
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";
import "./globals.css";
import Footer from "./components/footer/page";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/auth/login");
  };

  return (
    <html lang="en">
      <body className="bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
        <header className="w-full py-4 px-6 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="font-bold text-lg">
            CRM Prime
          </Link>

          <nav className="flex gap-4 text-sm items-center">
            <Link href="/" className="hover:text-indigo-600">
              Home
            </Link>

            {/* Dashboard only visible when logged in */}
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

            {/* Login/Signup visible only when not logged in */}
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

            {/* Profile/Logout visible only when logged in */}
            {user && (
              <>
                <Link href="/profile" className="hover:text-indigo-600">
                  {user.displayName || "Profile"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm hover:text-red-500 transition"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </header>

        <main className="pt-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
