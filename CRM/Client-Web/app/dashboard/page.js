import React from "react";

export default function DashboardPage() {
  // Mock KPI data
  const kpis = [
    {
      id: 1,
      title: "Monthly Recurring Revenue",
      value: "$42,800",
      delta: "+12%",
    },
    { id: 2, title: "New Leads (30d)", value: "1,240", delta: "+8%" },
    { id: 3, title: "Active Conversations", value: "3,102", delta: "-2%" },
    { id: 4, title: "Avg. Response Time", value: "18m", delta: "-25%" },
  ];

  // Mock activity feed
  const activities = [
    { time: "2m ago", text: "Lead John Doe replied on WhatsApp (Sales)" },
    {
      time: "10m ago",
      text: "Meeting summary saved for Acme Corp (auto-generated)",
    },
    { time: "30m ago", text: "Email sequence A started for 120 contacts" },
    { time: "2h ago", text: "Call summary added by AI for Client: BrightTech" },
  ];

  // Mock pipeline stages
  const pipeline = [
    { stage: "Prospect", count: 412 },
    { stage: "Qualified", count: 220 },
    { stage: "Proposal", count: 74 },
    { stage: "Negotiation", count: 28 },
    { stage: "Closed", count: 19 },
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
        const x = values.length > 1 ? (i / (values.length - 1)) * w : w / 2;
        const y = h - ((v - min) / range) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Service365 CRM — Dashboard
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Unified workspace • AI-driven insights • Meetings, Calls &
              Messaging
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-white/80 dark:bg-zinc-800 shadow hover:scale-[1.01] transition">
              New Lead
            </button>
            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 transition">
              Quick Brief
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-400 flex items-center justify-center text-white font-medium">
              SA
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left column */}
          <aside className="lg:col-span-1 space-y-6">
            {/* KPI cards */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
              <h2 className="text-sm font-semibold mb-3">Key Metrics</h2>
              <div className="grid grid-cols-2 gap-3">
                {kpis.map((k) => (
                  <div
                    key={k.id}
                    className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900"
                  >
                    <div className="text-xs text-zinc-500">{k.title}</div>
                    <div className="flex items-end justify-between mt-1">
                      <div className="text-lg font-semibold">{k.value}</div>
                      <div
                        className={`text-sm font-medium ${
                          k.delta.startsWith("+")
                            ? "text-green-500"
                            : "text-rose-500"
                        }`}
                      >
                        {k.delta}
                      </div>
                    </div>
                    <div className="mt-2">
                      <svg
                        width="120"
                        height="36"
                        viewBox="0 0 120 36"
                        fill="none"
                      >
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

            {/* Next Meeting Brief */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
              <h2 className="text-sm font-semibold mb-3">Next Meeting Brief</h2>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Acme Corp — Discovery Call · 10:30 AM
              </div>
              <ul className="mt-3 text-sm space-y-2">
                <li>• Recent activity: Email opened 2x</li>
                <li>• Priority: High (Deal value: $12.4k)</li>
                <li>
                  • Suggested talking points: Pricing tiers, Integration
                  timeline
                </li>
              </ul>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 rounded-md bg-emerald-600 text-white">
                  Voice Brief
                </button>
                <button className="px-3 py-2 rounded-md bg-white/80 dark:bg-zinc-700">
                  Summary
                </button>
              </div>
            </div>

            {/* Omni-channel Bots */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
              <h2 className="text-sm font-semibold mb-3">Omni-channel Bots</h2>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                WhatsApp • Telegram • SMS • Messenger
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span>WhatsApp Bot</span>
                  <span className="text-xs text-green-500">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Telegram Bot</span>
                  <span className="text-xs text-green-500">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Email Automation</span>
                  <span className="text-xs text-amber-500">Idle</span>
                </div>
              </div>
            </div>

            {/* Activity feed */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
              <h2 className="text-sm font-semibold mb-3">Activity</h2>
              <ul className="space-y-3 text-sm">
                {activities.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                    <div>
                      <div className="text-xs text-zinc-500">{a.time}</div>
                      <div>{a.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <section className="lg:col-span-3 space-y-6">
            {/* Top charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Revenue & Growth</h3>
                  <div className="text-xs text-zinc-500">Last 12 months</div>
                </div>
                <div className="h-56 flex items-center justify-center">
                  <svg viewBox="0 0 600 200" className="w-full h-full">
                    <defs>
                      <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#7c3aed"
                          stopOpacity="0.45"
                        />
                        <stop
                          offset="100%"
                          stopColor="#7c3aed"
                          stopOpacity="0.05"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,150 C80,120 160,90 240,110 C320,130 400,80 480,60 C560,40 600,30 600,30 L600,200 L0,200 Z"
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
                <div className="mt-4 grid grid-cols-3 text-sm text-zinc-600">
                  <div>
                    <div className="font-medium">ARR</div>
                    <div>$1.3M</div>
                  </div>
                  <div>
                    <div className="font-medium">MRR</div>
                    <div>$42.8k</div>
                  </div>
                  <div>
                    <div className="font-medium">Churn</div>
                    <div className="text-rose-500">3.2%</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Pipeline Overview</h3>
                  <div className="text-xs text-zinc-500">Real-time</div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {pipeline.map((p, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center"
                    >
                      <div className="text-xs text-zinc-500">{p.stage}</div>
                      <div className="text-xl font-semibold mt-2">
                        {p.count}
                      </div>
                      <div className="h-12 mt-2 flex items-end justify-center">
                        <div
                          style={{
                            height: `${Math.max(6, (p.count / 450) * 100)}%`,
                          }}
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

            {/* Conversations & AI Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Conversations & Channels</h3>
                  <div className="text-xs text-zinc-500">Unified Inbox</div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <div className="text-xs text-zinc-500 mb-2">Channels</div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center justify-between">
                        <span>WhatsApp</span>
                        <span className="text-xs text-zinc-500">1,120</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Telegram</span>
                        <span className="text-xs text-zinc-500">420</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Email</span>
                        <span className="text-xs text-zinc-500">1,230</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Calls (auto-summarized)</span>
                        <span className="text-xs text-zinc-500">332</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-zinc-500 mb-2">
                      Recent Messages
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            John D • WhatsApp
                          </div>
                          <div className="text-xs text-zinc-500">10:12</div>
                        </div>
                        <div className="text-sm mt-1">
                          Hi, can we get a demo of the integration this week?
                        </div>
                        <div className="mt-2 flex gap-2 text-xs">
                          <button className="px-2 py-1 rounded bg-indigo-600 text-white">
                            Reply
                          </button>
                          <button className="px-2 py-1 rounded bg-white/80 dark:bg-zinc-700">
                            Create Lead
                          </button>
                          <button className="px-2 py-1 rounded bg-white/80 dark:bg-zinc-700">
                            Add to Sequence
                          </button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            Acme Corp • Call
                          </div>
                          <div className="text-xs text-zinc-500">08:40</div>
                        </div>
                        <div className="text-sm mt-1">
                          AI Summary: Client interested in 3rd-party
                          integration. Follow up with pricing tiers.
                        </div>
                        <div className="mt-2 flex gap-2 text-xs">
                          <button className="px-2 py-1 rounded bg-emerald-600 text-white">
                            View Summary
                          </button>
                          <button className="px-2 py-1 rounded bg-white/80 dark:bg-zinc-700">
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
                <h3 className="font-semibold">AI Suggestions</h3>
                <ul className="mt-3 space-y-3 text-sm">
                  <li className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                    <div className="font-medium">Follow-up recommended</div>
                    <div className="text-zinc-500">
                      Lead: Marina Co • Score: 82 • Suggested channel: WhatsApp
                    </div>
                  </li>
                  <li className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                    <div className="font-medium">Upsell opportunity</div>
                    <div className="text-zinc-500">
                      Client: BrightTech • Product: Enterprise • Probability:
                      47%
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom row: Recent Deals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              {/* Notes / Tasks */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow">
                <h3 className="font-semibold mb-3">Tasks & Notes</h3>
                <ul className="space-y-3 text-sm">
                  <li className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
                    Follow up with Acme Corp
                    <span className="text-xs text-zinc-500">Today</span>
                  </li>
                  <li className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
                    Send proposal to BrightTech
                    <span className="text-xs text-zinc-500">Tomorrow</span>
                  </li>
                  <li className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
                    Review AI-generated lead scoring
                    <span className="text-xs text-zinc-500">Nov 12</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
