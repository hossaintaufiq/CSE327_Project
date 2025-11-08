import React from "react";

// Mock data
const kpis = [
  { id: 1, title: "Monthly Revenue", value: "$42,800", delta: "+12%" },
  { id: 2, title: "New Leads", value: "1,240", delta: "+8%" },
  { id: 3, title: "Active Conversations", value: "3,102", delta: "-2%" },
  { id: 4, title: "Avg. Response Time", value: "18m", delta: "-25%" },
];

const pipeline = [
  { stage: "Prospect", count: 412 },
  { stage: "Qualified", count: 220 },
  { stage: "Proposal", count: 74 },
  { stage: "Negotiation", count: 28 },
  { stage: "Closed", count: 19 },
];

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

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <button className="px-4 py-2 rounded-md bg-indigo-600 text-white shadow hover:bg-indigo-700">
            Refresh Data
          </button>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {kpis.map((k) => (
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

        {/* Revenue & Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue chart */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold">Revenue & Growth</h3>
              <span className="text-xs text-zinc-500">Last 12 months</span>
            </div>
            <div className="h-48 flex items-center justify-center">
              <svg viewBox="0 0 600 200" className="w-full h-full">
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,150 C80,120 160,90 240,110 C320,130 400,80 480,60 C560,40 600,30 L600,200 L0,200 Z"
                  fill="url(#g1)"
                />
                <path
                  d="M0,150 C80,120 160,90 240,110 C320,130 400,80 480,60 C560,40 600,30"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Pipeline Overview */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
            <h3 className="font-semibold mb-3">Pipeline Overview</h3>
            <div className="grid grid-cols-5 gap-3">
              {pipeline.map((p, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center"
                >
                  <div className="text-xs text-zinc-500">{p.stage}</div>
                  <div className="text-xl font-semibold mt-2">{p.count}</div>
                  <div className="h-12 mt-2 flex items-end justify-center">
                    <div
                      style={{ height: `${Math.max(6, (p.count / 450) * 100)}%` }}
                      className="w-3 bg-indigo-500 rounded-t-md"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-zinc-500">
              Conversion: 4.6% • Avg. deal size: $6.2k
            </div>
          </div>
        </div>

        {/* Recent Deals Table */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow overflow-x-auto">
          <h3 className="font-semibold mb-3">Recent Deals</h3>
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left pb-2">Client</th>
                <th className="text-left pb-2">Deal Size</th>
                <th className="text-left pb-2">Stage</th>
                <th className="text-left pb-2">Owner</th>
                <th className="text-left pb-2">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <tr>
                <td className="py-3">Acme Corp</td>
                <td>$12,400</td>
                <td>Proposal</td>
                <td>Sam A</td>
                <td>2025-11-12</td>
              </tr>
              <tr>
                <td className="py-3">BrightTech</td>
                <td>$6,200</td>
                <td>Negotiation</td>
                <td>Riya K</td>
                <td>2025-11-20</td>
              </tr>
              <tr>
                <td className="py-3">Marina Co</td>
                <td>$3,500</td>
                <td>Qualified</td>
                <td>Imran H</td>
                <td>2025-11-26</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
