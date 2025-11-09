// "use client";

// import { useEffect, useState } from "react";
// import { auth } from "@/firebase/config";
// import { useRouter } from "next/navigation";

// export default function ProfilePage() {
//   const [user, setUser] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(currentUser => {
//       if (!currentUser) {
//         router.push("/auth/login"); // redirect if not logged in
//       } else {
//         setUser(currentUser);
//       }
//     });

//     return () => unsubscribe();
//   }, [router]);

//   const handleLogout = async () => {
//     await auth.signOut();
//     router.push("/auth/login");
//   };

//   if (!user) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-black text-white">
//         <p>Loading profile...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-6">
//       <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
//       <p className="text-lg mb-2">
//         <strong>Name:</strong> {user.displayName || "N/A"}
//       </p>
//       <p className="text-lg mb-6">
//         <strong>Email:</strong> {user.email}
//       </p>
//       <button
//         onClick={handleLogout}
//         className="py-2 px-6 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
//       >
//         Logout
//       </button>
//     </div>
//   );
// }


// new code 
"use client";

import { useState } from "react";

export default function ProfilePage() {
  // Simulated logged-in user
  const [user, setUser] = useState({
    name: "Alice Johnson",
    email: "alice@crm.com",
    role: "manager", // Try changing this to "admin" | "sales" | "user"
  });

  const handleLogout = () => {
    alert("You have been logged out! (Demo)");
    // In a real app, you would call auth.signOut() or similar
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-6">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
        <p className="text-lg mb-2">
          <strong>Name:</strong> {user.name}
        </p>
        <p className="text-lg mb-2">
          <strong>Email:</strong> {user.email}
        </p>
        <p className="text-lg mb-6">
          <strong>Role:</strong>{" "}
          <span className="capitalize text-blue-500 font-semibold">
            {user.role}
          </span>
        </p>

        {/* Role-Based Sections */}
        {user.role === "admin" && <AdminDashboard />}
        {user.role === "manager" && <ManagerDashboard />}
        {user.role === "sales" && <SalesDashboard />}
        {user.role === "user" && (
          <p className="text-gray-500">No special role permissions yet.</p>
        )}

        <button
          onClick={handleLogout}
          className="mt-6 py-2 px-6 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

/* ROLE-BASED COMPONENTS */
function AdminDashboard() {
  return (
    <div className="border-t border-zinc-700 mt-6 pt-4 text-left">
      <h2 className="text-xl font-semibold mb-2">👑 Admin Controls</h2>
      <ul className="list-disc list-inside text-sm space-y-2">
        <li>Manage Users</li>
        <li>View System Analytics</li>
        <li>Configure CRM Settings</li>
      </ul>
    </div>
  );
}

function ManagerDashboard() {
  return (
    <div className="border-t border-zinc-700 mt-6 pt-4 text-left">
      <h2 className="text-xl font-semibold mb-2">📊 Manager Panel</h2>
      <ul className="list-disc list-inside text-sm space-y-2">
        <li>Assign Leads to Sales Team</li>
        <li>Track Team Performance</li>
        <li>Approve Discounts or Deals</li>
      </ul>
    </div>
  );
}

function SalesDashboard() {
  return (
    <div className="border-t border-zinc-700 mt-6 pt-4 text-left">
      <h2 className="text-xl font-semibold mb-2">💼 Sales Dashboard</h2>
      <ul className="list-disc list-inside text-sm space-y-2">
        <li>View Assigned Clients</li>
        <li>Update Deal Status</li>
        <li>Track Monthly Targets</li>
      </ul>
    </div>
  );
}
