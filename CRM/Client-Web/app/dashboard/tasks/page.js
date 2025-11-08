"use client"; // ✅ MUST be the first line

import React, { useState } from "react";

// Mock KPIs for tasks
const taskKpis = [
  { id: 1, title: "Total Tasks", value: "28", delta: "+10%" },
  { id: 2, title: "Completed", value: "12", delta: "+5%" },
  { id: 3, title: "Pending", value: "16", delta: "-3%" },
  { id: 4, title: "Overdue", value: "2", delta: "-25%" },
];

// Mock tasks
const tasks = [
  { id: 1, title: "Follow up with Acme Corp", status: "Pending", owner: "Sam A", due: "2025-11-12" },
  { id: 2, title: "Prepare sales report", status: "Completed", owner: "Riya K", due: "2025-11-13" },
  { id: 3, title: "Email campaign setup", status: "Pending", owner: "Imran H", due: "2025-11-15" },
  { id: 4, title: "Client onboarding call", status: "Overdue", owner: "Sam A", due: "2025-11-05" },
];

// Sparkline generator
const sparklinePath = (values) => {
  const w = 120;
  const h = 36;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

export default function TasksPage() {
  const [taskList, setTaskList] = useState(tasks);

  const toggleTaskStatus = (id) => {
    setTaskList(
      taskList.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "Completed" ? "Pending" : "Completed",
            }
          : task
      )
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tasks Dashboard</h1>
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700">
            Add New Task
          </button>
        </header>

        {/* Task KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {taskKpis.map((k) => (
            <div
              key={k.id}
              className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow flex flex-col justify-between"
            >
              <div className="text-xs text-zinc-500">{k.title}</div>
              <div className="flex items-end justify-between mt-1">
                <div className="text-lg font-semibold">{k.value}</div>
                <div
                  className={`text-sm font-medium ${
                    k.delta.startsWith("+") ? "text-green-500" : "text-rose-500"
                  }`}
                >
                  {k.delta}
                </div>
              </div>
              <div className="mt-2">
                <svg width="120" height="36">
                  <path
                    d={sparklinePath([3, 5, 7, 6, 8, 9, 12])}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeOpacity="0.7"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Task Table */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow overflow-x-auto">
          <h3 className="font-semibold mb-3">Task List</h3>
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left pb-2">Task</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-left pb-2">Owner</th>
                <th className="text-left pb-2">Due Date</th>
                <th className="text-left pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {taskList.map((task) => (
                <tr key={task.id}>
                  <td className="py-3">{task.title}</td>
                  <td
                    className={`py-3 font-medium ${
                      task.status === "Completed"
                        ? "text-green-500"
                        : task.status === "Overdue"
                        ? "text-rose-500"
                        : "text-yellow-500"
                    }`}
                  >
                    {task.status}
                  </td>
                  <td className="py-3">{task.owner}</td>
                  <td className="py-3">{task.due}</td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="px-3 py-1 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                    >
                      Toggle Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
