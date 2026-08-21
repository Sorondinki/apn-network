// app/privacy-policy/page.tsx
"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-gray-300 font-sans">
      
      {/* HEADER SECTION WITH LOGOS */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 border border-gray-800 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect behind header */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-xs font-mono text-emerald-400 hover:underline">
            ← Back to Main Protocol
          </Link>

          {/* APN Network Badge */}
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shadow-lg shadow-emerald-950/50">
            <img 
              src="/images/apn-network192x192.png" 
              alt="APN Network Logo" 
              className="w-4 h-4 object-contain" 
            />
            <span className="text-[10px] font-extrabold text-emerald-400 font-mono tracking-wider uppercase">
              APN PRIVACY STANDARD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 pt-2">
          {/* Main Token Logo Badge */}
          <div className="p-3 bg-slate-950 border border-gray-800 rounded-2xl shadow-xl flex-shrink-0">
            <img 
              src="/images/apn-token512x512.png" 
              alt="APN Token Logo" 
              className="w-12 h-12 md:w-14 md:h-14 object-contain" 
            />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Global Privacy Policy
            </h1>
            <p className="text-xs text-emerald-400 mt-1 font-mono">
              Alpha Proficiency Network (APN) • Decentralized Foundation Standard
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="p-8 rounded-3xl bg-gray-900/40 border border-gray-800 space-y-6 text-sm leading-relaxed backdrop-blur-md shadow-xl">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">1.</span> Decentralized Data Principles
          </h2>
          <p className="text-gray-400">
            Alpha Proficiency Network (APN) operates as an autonomous, decentralized blockchain protocol. We prioritize user sovereignty, zero-knowledge privacy, and cryptographic security.
          </p>
        </section>

        <section className="space-y-2 border-t border-gray-800/80 pt-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">2.</span> Information Collection
          </h2>
          <p className="text-gray-400">
            APN Network does not store personal identity records, national identification numbers, or precise geo-location metadata. All network interactions are mapped via cryptographic wallet hashes and decentralized peer-to-peer node sync mechanisms.
          </p>
        </section>

        <section className="space-y-2 border-t border-gray-800/80 pt-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">3.</span> Global Encryption & Security
          </h2>
          <p className="text-gray-400">
            All node synchronization requests and balance updates are protected using standard TLS/SSL encryption and decentralized consensus engines distributed globally across independent validation nodes.
          </p>
        </section>
      </div>

      {/* FOOTER NOTE */}
      <div className="pt-4 px-2 text-xs text-gray-500 font-mono flex justify-between items-center border-t border-gray-900">
        <span>© {new Date().getFullYear()} APN Foundation. All Rights Reserved.</span>
        <span className="text-emerald-500/80">Decentralized & Encrypted</span>
      </div>
    </div>
  );
}