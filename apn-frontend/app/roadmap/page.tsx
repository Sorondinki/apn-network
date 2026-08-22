"use client";

import Link from "next/link";
import Image from "next/image";

export default function RoadmapPage() {
  const milestones = [
    {
      phase: "Phase 1: Foundation & Architecture Core",
      period: "Q2 2026 (April - June 2026)",
      status: "COMPLETED",
      summary: "Technical architecture design, Go Node Core Engine development, and initial PWA interface launch.",
      items: [
        "Consensus Architecture & Go Node Core Engine Specification",
        "APN Smart-App PWA Mining Interface Deployment",
        "Database Schema & Admin Node Control Hub Integration",
        "Initial Seed Community Launch & Internal Protocol Testing",
      ],
    },
    {
      phase: "Phase 2: Testnet Deployment & Node Scaling",
      period: "Q3 2026 (July - September 2026)",
      status: "IN PROGRESS",
      summary: "Deployment of primary public seed nodes, RPC synchronization setup, and Web3 metrics integration.",
      items: [
        "Deployment of Primary APN Public Seed Node Infrastructure",
        "RPC Webhook Synchronization & Live Balance Tracking Engine",
        "APN Web Mining Console Speed & Security Optimization",
        "Global Referral Network Expansion & Social Channels Broadcast",
      ],
    },
    {
      phase: "Phase 3: Security Audits & Ecosystem Utility",
      period: "Q4 2026 (October - December 2026)",
      status: "UPCOMING",
      summary: "Third-party security audits, identity verification protocol (KYC), and commercial utility API releases.",
      items: [
        "Comprehensive Independent Smart Contract & Core Protocol Audits",
        "Decentralized Identity (KYC/AML) Framework Integration",
        "API Gateways for Third-party Merchants & Developer Integrations",
        "Validator Node Staking Mechanisms & Incentive Testnet",
      ],
    },
    {
      phase: "Phase 4: Decentralized Wallet Bridge & Testnet Airdrop",
      period: "Q1 2027 (January - March 2027)",
      status: "UPCOMING",
      summary: "Integration of native non-custodial wallet and early miner testnet reward distribution allocation.",
      items: [
        "Launch of APN Native Web3 Non-Custodial Mobile & Browser Wallet",
        "P2P Token Micro-Transfers & Cross-Chain Bridge Experiments",
        "Early Miners Testnet Reward Balance Verification & Airdrop Allocation",
        "Developer SDK Release for Decentralized Ecosystem Apps (dApps)",
      ],
    },
    {
      phase: "Phase 5: Public Mainnet Genesis & Exchange Listings",
      period: "Q2 2027 (April - June 2027)",
      status: "UPCOMING",
      summary: "Activation of APN Public Mainnet, staking rewards launch, and listing on CEX and DEX exchanges.",
      items: [
        "Public Mainnet Genesis Block Activation & Token Generation Event (TGE)",
        "Mainnet Token Migration & Mining Rewards Unlocking Schedule",
        "Decentralized Exchange (DEX) & Major Centralized Exchange (CEX) Listings",
        "Delegated Proof-of-Stake (DPoS) Governance Voting Activation",
      ],
    },
    {
      phase: "Phase 6: Enterprise Expansion & Global Adoption",
      period: "Q3 2027 & Beyond",
      status: "UPCOMING",
      summary: "Global institutional partnerships, cross-chain interoperability, and enterprise payment integration.",
      items: [
        "Enterprise Web3 Payment Gateway Integration for Global E-commerce",
        "Cross-Chain Interoperability with Major Layer-1 Blockchain Networks",
        "Alpha Proficiency Network Decentralized Autonomous Organization (DAO)",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-6 md:p-12 font-sans max-w-5xl mx-auto space-y-10 selection:bg-purple-500 selection:text-white">
      
      {/* HEADER WITH CORRECT IMAGE PATHS */}
      <div className="border-b border-slate-800/80 pb-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
            ← Back to Main Protocol
          </Link>
          
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full backdrop-blur-md">
            <Image 
              src="/images/apn-network192x192.png" 
              alt="APN Network" 
              width={20} 
              height={20} 
              className="object-contain" 
            />
            <span className="text-xs font-extrabold text-purple-400 font-mono tracking-wider">APN ROADMAP 2026-2027</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-2">
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shrink-0">
            <Image 
              src="/images/apn-token512x512.png" 
              alt="APN Token" 
              width={48} 
              height={48} 
              className="object-contain animate-pulse" 
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              APN Strategic Roadmap
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed">
              Transparent, execution-driven milestones for protocol maturity, decentralization, node scalability, and global adoption.
            </p>
          </div>
        </div>

        {/* OVERALL PROTOCOL MATURITY PROGRESS */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-bold">Overall Protocol Maturity Progress</span>
            <span className="text-emerald-400 font-extrabold">45% Completed (Phase 2 In-Progress)</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: "45%" }}
            />
          </div>
        </div>
      </div>

      {/* ROADMAP TIMELINE CARDS */}
      <div className="space-y-6">
        {milestones.map((m, idx) => (
          <div
            key={idx}
            className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 ${
              m.status === "IN PROGRESS"
                ? "bg-slate-900/90 border-emerald-500/50 shadow-2xl shadow-emerald-950/30 ring-1 ring-emerald-500/20"
                : m.status === "COMPLETED"
                ? "bg-slate-900/40 border-slate-800/80 opacity-90"
                : "bg-slate-900/20 border-slate-800/50"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/60 pb-4">
              <div>
                <span className="text-[11px] font-mono font-semibold text-purple-400 uppercase tracking-widest block mb-1">
                  {m.period}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">{m.phase}</h3>
              </div>
              
              <span
                className={`self-start sm:self-auto text-[10px] font-mono font-bold px-3 py-1 rounded-full border shrink-0 ${
                  m.status === "IN PROGRESS"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                    : m.status === "COMPLETED"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                    : "bg-slate-800/80 text-slate-400 border-slate-700"
                }`}
              >
                {m.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 italic font-sans">
              {m.summary}
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
              {m.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className={`mt-0.5 shrink-0 font-bold ${
                    m.status === "COMPLETED" 
                      ? "text-emerald-400" 
                      : m.status === "IN PROGRESS" 
                      ? "text-amber-400" 
                      : "text-slate-600"
                  }`}>
                    {m.status === "COMPLETED" ? "✓" : m.status === "IN PROGRESS" ? "⚡" : "○"}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* FOOTER NOTE */}
      <div className="pt-8 border-t border-slate-800/80 text-xs text-slate-500 font-mono flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>Official Protocol Document • Updated: August 2026</span>
        <Link href="/whitepaper" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors flex items-center gap-1">
          Read APN Technical Whitepaper →
        </Link>
      </div>
    </div>
  );
}