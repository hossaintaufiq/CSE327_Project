
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/firebase/config"; // make sure firebase is configured
import { useRouter } from "next/navigation";
import { UserCircle, LogOut, Briefcase, Shield, BarChart3 } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("manager"); // demo role: admin | manager | sales | user
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
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

  // Extract name from email if displayName not set
  const displayName =
    user.displayName ||
    user.email.split("@")[0].replace(".", " ").replace("_", " ");
  const email = user.email;

  return (
    <div className="min-h-screen flex flex-col items-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-6">
      {/* Profile Card */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="flex items-center gap-4 border-b border-zinc-300 dark:border-zinc-700 pb-4 mb-6">
          <div className="bg-blue-100 dark:bg-zinc-800 p-4 rounded-full">
            <UserCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-zinc-500">{email}</p>
          </div>
        </div>

        {/* Role */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg">
            <strong>Role:</strong>{" "}
            <span className="capitalize text-blue-600 font-semibold">
              {role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Role Based Dashboard */}
        <div className="space-y-4">
          {role === "admin" && <AdminDashboard />}
          {role === "manager" && <ManagerDashboard />}
          {role === "sales" && <SalesDashboard />}
          {role === "user" && <UserDashboard />}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   ROLE-BASED SECTIONS
------------------------------*/
function AdminDashboard() {
  return (
    <Section
      icon={<Shield className="text-yellow-500" />}
      title="Admin Control Center"
      description="Manage the CRM system, control user access, and oversee company-wide performance metrics."
      items={[
        "View all users and permissions",
        "Access company analytics",
        "Configure CRM settings",
      ]}
    />
  );
}

function ManagerDashboard() {
  return (
    <Section
      icon={<BarChart3 className="text-green-500" />}
      title="Manager Dashboard"
      description="Track your team's performance and manage sales pipelines efficiently."
      items={[
        "Assign leads to sales reps",
        "Review performance analytics",
        "Approve client discounts",
      ]}
    />
  );
}

function SalesDashboard() {
  return (
    <Section
      icon={<Briefcase className="text-blue-500" />}
      title="Sales Dashboard"
      description="Manage client relationships, track deals, and update sales progress."
      items={[
        "View assigned clients",
        "Update deal statuses",
        "Monitor monthly targets",
      ]}
    />
  );
}

function UserDashboard() {
  return (
    <Section
      title="User Dashboard"
      description="Basic access to CRM system for viewing personal information and client data."
      items={["View profile", "Access personal CRM data"]}
    />
  );
}

/* -----------------------------
   REUSABLE SECTION COMPONENT
------------------------------*/
function Section({ icon, title, description, items }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <p className="text-sm text-zinc-500 mb-3">{description}</p>
      <ul className="list-disc list-inside text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
