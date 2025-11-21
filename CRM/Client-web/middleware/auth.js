"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }

      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return { user, loading };
}

