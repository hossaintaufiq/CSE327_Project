"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in via localStorage
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Loading...</h1>
    </div>
  );
}

