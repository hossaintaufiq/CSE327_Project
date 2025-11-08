import React from "react";

// Mock data
const kpis = [
  { id: 1, title: "Monthly Recurring Revenue", value: "$42,800", delta: "+12%" },
  { id: 2, title: "New Leads (30d)", value: "1,240", delta: "+8%" },
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

export default function SalesDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Sales Dashboard</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Overview of leads, revenue, and pipelines
            </p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left KPIs */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
              <h2 className="text-sm font-semibold mb-3">Key Metrics</h2>
              <div className="grid grid-cols-2 gap-3">
                {kpis.map((k) => (
                  <div key={k.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
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
            </div>
          </aside>

          {/* Main Content */}
          <section className="lg:col-span-3 space-y-6">
            {/* Pipeline Overview */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
              <h3 className="font-semibold mb-3">Pipeline Overview</h3>
              <div className="grid grid-cols-5 gap-3">
                {pipeline.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
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
              <div className="mt-4 text-sm text-zinc-500">Conversion: 4.6% • Avg. deal size: $6.2k</div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
