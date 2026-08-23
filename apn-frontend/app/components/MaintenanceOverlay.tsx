"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function MaintenanceOverlay() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
        <Image
          src="/images/apn-token512x512.png"
          alt="APN Network Logo"
          width={120}
          height={120}
          priority
          className="relative object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-spin-slow"
        />
      </div>

      <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        Scheduled Protocol Maintenance
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
        APN Mainnet Engine Upgrade
      </h1>

      <p className="max-w-md text-gray-400 text-sm leading-relaxed mb-8">
        We are executing essential upgrades to the APN Layer-1 Consensus Protocol. All user balances and assets remain fully secure on-chain.
      </p>

      <div className="w-full max-w-sm p-4 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md flex flex-col gap-3">
        <button
          onClick={() => router.push("/register")}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-blue-900/30"
        >
          New Registration / Join APN Network
        </button>

        <p className="text-[11px] text-gray-500">
          New account registrations remain fully operational during maintenance.
        </p>
      </div>
    </div>
  );
}