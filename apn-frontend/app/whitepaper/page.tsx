// app/whitepaper/page.tsx
"use client";

import Link from "next/link";

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans max-w-5xl mx-auto space-y-10">

        {/* HEADER WITH CORRECT IMAGE PATHS */}
    <div className="border-b border-slate-800 pb-8 space-y-4">
    <div className="flex items-center justify-between">
        <Link href="/" className="text-xs font-mono text-emerald-400 hover:underline">
        ← Back to Main Protocol
        </Link>
        
        {/* APN LOGO BADGE */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shadow-lg shadow-emerald-950/50">
        <img src="/images/apn-network192x192.png" alt="APN Network" className="w-5 h-5 object-contain" />
        <span className="text-xs font-extrabold text-emerald-400 font-mono tracking-wider">APN NETWORK</span>
        </div>
    </div>

    <div className="flex items-center gap-4 pt-2">
        {/* APN TOKEN DISPLAY */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <img src="/images/apn-token512x512.png" alt="APN Token Logo" className="w-12 h-12 object-contain" />
        </div>

        <div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Alpha Proficiency Network (APN) Whitepaper
        </h1>
        <p className="text-xs md:text-sm text-slate-400 font-mono mt-1">
            Version 1.0.0 | Consensus: Delegated Proof of Stake (DPoS) | Architecture: Go Protocol Engine
        </p>
        </div>
    </div>
    </div>       

      {/* EXECUTIVE SUMMARY */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-emerald-400">1. Executive Summary</h2>
        <p className="text-sm leading-relaxed text-slate-300">
          Alpha Proficiency Network (APN) is a high-throughput, eco-friendly blockchain protocol designed to power decentralized applications (dApps), micropayments, and high-frequency offline synchronization. By leveraging a Delegated Proof-of-Stake (DPoS) consensus mechanism engine built natively in Go, APN achieves millisecond transaction finality with minimal energy footprint.
        </p>
      </section>

      {/* ARCHITECTURE */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-emerald-400">2. Technical Architecture & Consensus</h2>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 text-sm">
          <p className="text-slate-300">
            <strong>Node Infrastructure:</strong> Powered by standalone Go RPC nodes with peer-to-peer (P2P) discovery mechanisms.
          </p>
          <p className="text-slate-300">
            <strong>Consensus Engine:</strong> DPoS consensus algorithm allowing token holders to delegate stake to validator nodes, reducing block generation times while securing state sync.
          </p>
          <p className="text-slate-300">
            <strong>Tokenomics & Utility:</strong> Native APN token acts as gas for smart executions, node staking rewards, and peer-to-peer asset transfers across the ecosystem.
          </p>
        </div>
      </section>

      {/* SECURITY & GOVERNANCE */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-emerald-400">3. Governance & Security</h2>
        <p className="text-sm leading-relaxed text-slate-300">
          Network parameter updates and validator authorizations are executed via Founder Master Key cryptographic validation alongside community delegation weight. Security patches follow automated fallback routes to guarantee continuous uptime and zero transaction rollbacks.
        </p>
      </section>

      {/* FOOTER NOTE */}
      <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 font-mono flex justify-between items-center">
        <span>© {new Date().getFullYear()} APN Core Team. All Rights Reserved.</span>
        <Link href="/roadmap" className="text-emerald-400 hover:underline">
          View APN Roadmap →
        </Link>
      </div>
    </div>
  );
}