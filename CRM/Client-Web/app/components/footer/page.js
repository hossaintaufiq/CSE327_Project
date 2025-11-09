"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-800 text-zinc-400">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold text-zinc-200">AI CRM</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/" className="hover:text-indigo-400 transition">Home</Link>
          <Link href="/about" className="hover:text-indigo-400 transition">About</Link>
          <Link href="/contact" className="hover:text-indigo-400 transition">Contact</Link>
          <Link href="/terms" className="hover:text-indigo-400 transition">Terms</Link>
        </nav>

        {/* Social */}
        <div className="flex gap-4">
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition">GitHub</a>
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition">Twitter</a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition">LinkedIn</a>
        </div>
      </div>

      <div className="border-t border-zinc-800 text-center py-4 text-sm text-zinc-500">
        © {year} AI CRM. All rights reserved.
      </div>
    </footer>
  );
}
