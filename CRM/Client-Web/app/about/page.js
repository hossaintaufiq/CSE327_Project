"use client";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-zinc-900 rounded-2xl p-10 max-w-2xl w-full shadow-[0_0_40px_rgba(0,0,0,0.6)]
                   border border-zinc-800 hover:shadow-[0_0_60px_rgba(99,102,241,0.3)]
                   transition-shadow duration-300"
      >
        <h1 className="text-4xl font-extrabold mb-4 text-indigo-400">
          About AI CRM
        </h1>

        <p className="text-zinc-300 leading-relaxed mb-6">
          AI CRM is a modern customer relationship management system designed to
          help teams stay productive, automate workflows, and smartly manage business operations.
        </p>

        <div className="space-y-4">
          <Feature
            title="⚡ Real-time Analytics"
            desc="Track customer interactions and performance instantly with smart dashboards."
          />
          <Feature
            title="🤖 AI Automation"
            desc="Boost productivity by letting AI manage repetitive communication tasks."
          />
          <Feature
            title="🔒 Secure & Scalable"
            desc="Built with top-tier security and future-ready architecture."
          />
        </div>

        <p className="text-zinc-400 mt-8 text-sm text-center">
          © {new Date().getFullYear()} AI-Powered CRM — Built for the future 🚀
        </p>
      </motion.div>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <motion.div
      whileHover={{ x: 6 }}
      transition={{ type: "spring", stiffness: 150 }}
      className="p-4 rounded-xl bg-zinc-800 border border-zinc-700
                 shadow-lg shadow-black/40"
    >
      <h3 className="text-lg font-semibold text-indigo-300">{title}</h3>
      <p className="text-zinc-400 text-sm mt-1">{desc}</p>
    </motion.div>
  );
}
