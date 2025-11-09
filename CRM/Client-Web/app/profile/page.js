"use client";

import { useEffect, useState } from "react";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (!currentUser) {
        router.push("/auth/login"); // redirect if not logged in
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/auth/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
      <p className="text-lg mb-2">
        <strong>Name:</strong> {user.displayName || "N/A"}
      </p>
      <p className="text-lg mb-6">
        <strong>Email:</strong> {user.email}
      </p>
      <button
        onClick={handleLogout}
        className="py-2 px-6 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}
