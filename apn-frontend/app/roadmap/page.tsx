// app/roadmap/page.tsx
"use client";

import Link from "next/link";

export default function RoadmapPage() {
  const milestones = [
    {
      phase: "Phase 1: Foundation & Genesis",
      status: "COMPLETED",
      items: [
        "Architecture Design & Go Node Core Engine",
        "APN Smart-App PWA Mining Interface",
        "Database Schema & Admin Control Integration",
      ],
    },
    {
      phase: "Phase 2: Node Deployment & Testnet",
      status: "IN PROGRESS",
      items: [
        "Deployment of Primary APN Seed Node on Cloud (DigitalOcean)",
        "RPC Webhook Synchronization & Live Balance Tracking",
        "Community Growth & Social Broadcast Integration",
      ],
    },
    {
      phase: "Phase 3: Ecosystem Expansion",
      status: "UPCOMING",
      items: [
        "Validator Node Staking Mechanisms",
        "P2P Token Transfers & Decentralized Wallet Bridge",
        "API Gateways for Third-party Merchants & Developers",
      ],
    },
    {
      phase: "Phase 4: Mainnet Launch & Exchange Listing",
      status: "UPCOMING",
      items: [
        "Public Mainnet Genesis Block Activation",
        "Security Audits & External Vulnerability Assessment",
        "Centralized & Decentralized Exchange (DEX) Token Listings",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans max-w-5xl mx-auto space-y-10">
            {/* HEADER WITH CORRECT IMAGE PATHS */}
        <div className="border-b border-slate-800 pb-8 space-y-4">
        <div className="flex items-center justify-between">
            <Link href="/" className="text-xs font-mono text-emerald-400 hover:underline">
            ← Back to Main Protocol
            </Link>
            
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full">
            <img src="/images/apn-network192x192.png" alt="APN Network" className="w-5 h-5 object-contain" />
            <span className="text-xs font-extrabold text-purple-400 font-mono tracking-wider">APN ROADMAP</span>
            </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <img src="/images/apn-token512x512.png" alt="APN Token" className="w-12 h-12 object-contain animate-pulse" />
            </div>

            <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                APN Protocol Roadmap
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-mono mt-1">
                Execution milestones for protocol maturity, node scalability, and ecosystem adoption.
            </p>
            </div>
        </div>
        </div>
        
      {/* ROADMAP TIMELINE */}
      <div className="space-y-6">
        {milestones.map((m, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border ${
              m.status === "IN PROGRESS"
                ? "bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/40"
                : m.status === "COMPLETED"
                ? "bg-slate-900/40 border-slate-800 opacity-80"
                : "bg-slate-900/20 border-slate-800/60"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{m.phase}</h3>
              <span
                className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${
                  m.status === "IN PROGRESS"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                    : m.status === "COMPLETED"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {m.status}
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              {m.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={m.status === "COMPLETED" ? "text-emerald-400" : "text-slate-500"}>
                    {m.status === "COMPLETED" ? "✓" : "⚡"}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* FOOTER NOTE */}
      <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 font-mono flex justify-between items-center">
        <span>Updated: August 2026</span>
        <Link href="/whitepaper" className="text-emerald-400 hover:underline">
          Read APN Whitepaper →
        </Link>
      </div>
    </div>
  );
}