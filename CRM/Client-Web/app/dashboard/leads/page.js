import React from "react";

// Mock leads data
const leads = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "New", owner: "Sam A", created: "2025-11-01" },
  { id: 2, name: "Marina Co", email: "marina@example.com", status: "Contacted", owner: "Riya K", created: "2025-10-28" },
  { id: 3, name: "BrightTech", email: "bright@example.com", status: "Converted", owner: "Imran H", created: "2025-10-25" },
  { id: 4, name: "Acme Corp", email: "acme@example.com", status: "New", owner: "Sam A", created: "2025-11-02" },
];

const statusColors = {
  New: "bg-blue-100 text-blue-800",
  Contacted: "bg-yellow-100 text-yellow-800",
  Converted: "bg-green-100 text-green-800",
  Lost: "bg-rose-100 text-rose-800",
};

export default function LeadsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Leads Management</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Track, filter, and manage your leads efficiently.</p>
          </div>
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700">
            Add New Lead
          </button>
        </header>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <input
            type="text"
            placeholder="Search leads..."
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            {["All", "New", "Contacted", "Converted"].map((f) => (
              <button
                key={f}
                className="px-3 py-1 rounded-md bg-white/80 dark:bg-zinc-800 text-sm shadow hover:bg-indigo-50 dark:hover:bg-zinc-700"
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left pb-2">Name</th>
                <th className="text-left pb-2">Email</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-left pb-2">Owner</th>
                <th className="text-left pb-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="py-3 font-medium">{lead.name}</td>
                  <td className="py-3">{lead.email}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3">{lead.owner}</td>
                  <td className="py-3">{lead.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
