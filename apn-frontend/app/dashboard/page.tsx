"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DashboardPage() {
  // -------------------------------------------------------------
  // MAINTENANCE SWITCH (KULLA/BUDE DASHBOARD)
  // -------------------------------------------------------------
  const isMaintenance = true;

  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMining, setIsMining] = useState(false);
  const [balance, setBalance] = useState(0.000000);
  const [sessionTime, setSessionTime] = useState(0);
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [showNotice, setShowNotice] = useState(true);

  const baseBalanceRef = useRef(0);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u"))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isFounder = user?.role === "ADMIN" || user?.isFounder === true;
  const baseRate = isFounder ? 5.0 : 0.5;
  const referralBonusRate = activeReferrals * 0.2;
  const hourlyRate = baseRate + referralBonusRate;
  const hourlyRateRef = useRef(hourlyRate);
  hourlyRateRef.current = hourlyRate;

  const syncAndLoadUserData = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem("apn_user");
      if (!savedUser) {
        router.push("/register");
        return;
      }

      const localUserData = JSON.parse(savedUser);
      const userRes = await fetch(`/api/user/profile?userId=${localUserData.id}`);
      const userData = await userRes.json();

      if (!userData || !userData.success) {
        setUser(localUserData);
      } else {
        setUser(userData.user);
        localStorage.setItem("apn_user", JSON.stringify(userData.user));
      }

      const activeUser = userData?.user || localUserData;
      const dbBalance = parseFloat(activeUser.balance || "0");

      try {
        const refRes = await fetch(`/api/user/referrals?userId=${activeUser.id}`);
        const refData = await refRes.json();
        if (refData.success) {
          setTotalReferrals(refData.totalInvited || 0);
          setActiveReferrals(refData.activeMiners || refData.totalInvited || 0);
        }
      } catch (e) {
        console.error("Error loading referrals:", e);
      }

      const startTimeStr = localStorage.getItem("apn_mining_start_time");

      if (startTimeStr) {
        const startTime = parseInt(startTimeStr, 10);
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        if (elapsedSeconds < 86400) {
          setIsMining(true);
          setSessionTime(elapsedSeconds);
          const savedBase = localStorage.getItem("apn_base_balance");
          const realBase = savedBase ? parseFloat(savedBase) : dbBalance;
          baseBalanceRef.current = realBase;
          const minedSoFar = elapsedSeconds * (hourlyRateRef.current / 3600);
          setBalance(realBase + minedSoFar);
        } else {
          setIsMining(false);
          baseBalanceRef.current = dbBalance;
          setBalance(dbBalance);
          localStorage.removeItem("apn_mining_start_time");
          localStorage.removeItem("apn_base_balance");
        }
      } else {
        setIsMining(false);
        baseBalanceRef.current = dbBalance;
        setBalance(dbBalance);
      }
    } catch (err) {
      console.error("Initialization sync error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    syncAndLoadUserData();
  }, [syncAndLoadUserData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let syncInterval: NodeJS.Timeout;

    if (isMining) {
      interval = setInterval(() => {
        const startTimeStr = localStorage.getItem("apn_mining_start_time");
        if (!startTimeStr) return;

        const startTime = parseInt(startTimeStr, 10);
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

        if (elapsedSeconds >= 86400) {
          setIsMining(false);
          localStorage.removeItem("apn_mining_start_time");
          localStorage.removeItem("apn_base_balance");
          setSessionTime(86400);
          return;
        }

        setSessionTime(elapsedSeconds);
        const liveMined = elapsedSeconds * (hourlyRateRef.current / 3600);
        const liveTotal = baseBalanceRef.current + liveMined;
        setBalance(liveTotal);
      }, 1000);

      syncInterval = setInterval(() => {
        if (user?.id) {
          const startTimeStr = localStorage.getItem("apn_mining_start_time");
          const startTime = startTimeStr ? parseInt(startTimeStr, 10) : null;

          fetch("/api/user/sync-balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              balance: balanceRef.current,
              isMining: true,
              miningStartTime: startTime,
            }),
          }).catch((err) => console.error("Balance sync error:", err));
        }
      }, 15000);
    }

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [isMining, user?.id]);

  const toggleMining = () => {
    if (!isMining) {
      const now = Date.now();
      setIsMining(true);
      baseBalanceRef.current = balance;
      localStorage.setItem("apn_base_balance", balance.toString());
      localStorage.setItem("apn_mining_start_time", now.toString());

      if (user?.id) {
        fetch("/api/user/sync-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            balance: balance,
            isMining: true,
            miningStartTime: now,
          }),
        });
      }
    } else {
      setIsMining(false);
      localStorage.removeItem("apn_mining_start_time");
      localStorage.removeItem("apn_base_balance");

      if (user?.id) {
        fetch("/api/user/sync-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            balance: balanceRef.current,
            isMining: false,
            miningStartTime: null,
          }),
        });
      }
    }
  };

  const formatCountdown = (elapsed: number) => {
    const remaining = Math.max(0, 86400 - elapsed);
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // -------------------------------------------------------------
  // DIRECT MAINTENANCE SCREEN (INLINED - NO EXTERNAL IMPORT NEEDED)
  // -------------------------------------------------------------
  if (isMaintenance) {
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
          Muna gudanar da sauye-sauye da haɓaka ƙarfin **APN Layer-1 Consensus Protocol**. 
          Duk ma'adananka (Balances da Referrals) suna nan a kulle cikin aminci.
        </p>

        <div className="w-full max-w-sm p-4 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md flex flex-col gap-3">
          <button
            onClick={() => router.push("/register")}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-blue-900/30"
          >
            Sabuwar Rajista / Join APN Network
          </button>

          <p className="text-[11px] text-gray-500">
            Sabuwar rajista tana aiki lami lafiya yayin gudanar da maintenance.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium animate-pulse">Initializing APN Secure Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto selection:bg-blue-500 selection:text-white">
      {showNotice && (
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border border-blue-500/30 backdrop-blur-md flex items-center justify-between gap-4 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed">
              <strong className="text-white font-bold">APN Core Update (v1.0.2):</strong> Deterministic PoS balance validation & dynamic active-peer boost engine live on mainnet.
            </p>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            className="text-gray-400 hover:text-white text-xs bg-gray-800/60 hover:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-700 transition-all shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-gray-950/90 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 max-w-xl z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              PoS Layer-1 Web Node Active
            </div>
            {isFounder && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide shadow-lg shadow-amber-950/50">
                ⚡ Founder Master Node
              </div>
            )}
            {activeReferrals > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold tracking-wide">
                🚀 +{(activeReferrals * 0.2).toFixed(1)} APN/hr Boost ({activeReferrals} Active)
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight">
            APN Web Mining Console
          </h1>
          <p className="text-gray-400 text-xs leading-relaxed">
            Harness browser consensus power to earn APN native rewards directly into your Web3 local vault.
          </p>
        </div>

        <div className="relative flex items-center justify-center my-2 md:my-0">
          <div className={`absolute w-36 h-36 rounded-full transition-all duration-700 ${
            isMining ? "bg-blue-500/30 blur-2xl animate-pulse" : "bg-transparent"
          }`} />
          
          <div className={`relative p-4 rounded-full bg-gradient-to-b from-gray-800/90 to-gray-900/95 border ${
            isMining ? "border-blue-500/60 shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "border-gray-800"
          }`}>
            <Image
              src="/images/apn-token512x512.png"
              alt="APN Token Logo"
              width={88}
              height={88}
              priority
              className={`object-contain transition-all duration-500 ${
                isMining ? "scale-105 filter drop-shadow-[0_0_18px_rgba(59,130,246,0.8)] animate-spin-slow" : "opacity-80 grayscale-[20%]"
              }`}
            />
          </div>
        </div>

        <div className="z-10 flex flex-col items-center gap-2">
          <button
            onClick={toggleMining}
            className={`px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-2xl flex items-center gap-3 active:scale-95 ${
              isMining
                ? "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-900/40"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40"
            }`}
          >
            <Image
              src="/images/apn-token512x512.png"
              alt="Token Icon"
              width={22}
              height={22}
              className="object-contain"
            />
            <span>{isMining ? "Pause Session" : "Start Session"}</span>
          </button>
          
          {isMining && (
            <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/50 px-3 py-0.5 rounded-full">
              Session Ends: {formatCountdown(sessionTime)}
            </span>
          )}
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            TOTAL APN BALANCE
          </span>
          <div className="flex items-center gap-3 mt-4">
            <Image
              src="/images/apn-token512x512.png"
              alt="APN Logo"
              width={34}
              height={34}
              className="object-contain shrink-0"
            />
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                {balance.toFixed(6)}
              </span>
              <span className="text-xs font-semibold text-gray-400">APN</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-blue-500/30 transition-all duration-300">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            TOTAL MINING RATE
          </span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight">
              {hourlyRate.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-gray-400">APN / hr</span>
            {activeReferrals > 0 && (
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold ml-1 border border-blue-500/30">
                +{(activeReferrals * 0.2).toFixed(1)} Active Boost
              </span>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-purple-500/30 transition-all duration-300">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            NODE EXECUTION STATUS
          </span>
          <div className="flex items-center gap-3 mt-4">
            <span className="relative flex h-4 w-4">
              {isMining && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-4 w-4 ${
                  isMining ? "bg-emerald-500 animate-pulse" : "bg-gray-600"
                }`}
              ></span>
            </span>

            <span
              className={`text-xl font-bold tracking-tight ${
                isMining ? "text-emerald-400" : "text-gray-400"
              }`}
            >
              {isMining ? "Mining in Progress" : "Node Standby"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-3">
        <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
          <span>24-Hour Mining Cycle Progress</span>
          <span className="font-mono text-blue-400">{((sessionTime / 86400) * 100).toFixed(1)}% Completed</span>
        </div>
        <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-gray-800 p-0.5">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
            style={{ width: `${(sessionTime / 86400) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        <div 
          onClick={() => router.push('/dashboard/referrals')}
          className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-gray-800/80 hover:border-blue-500/50 transition-all cursor-pointer group"
        >
          <div className="text-blue-400 mb-2 group-hover:scale-110 transition-transform w-max">👥</div>
          <h3 className="text-sm font-bold text-white">Active Referral Mining</h3>
          <p className="text-xs text-gray-400 mt-1">
            Earn +0.2 APN/hr for each active peer mining right now ({activeReferrals}/{totalReferrals} Active).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-gray-800/80 hover:border-emerald-500/50 transition-all">
          <div className="text-emerald-400 mb-2 w-max">🛡️</div>
          <h3 className="text-sm font-bold text-white">Cryptographic Vault</h3>
          <p className="text-xs text-gray-400 mt-1">Your mined APN token balance is cryptographically secured via PoS mainnet consensus.</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-gray-800/80 hover:border-amber-500/50 transition-all sm:col-span-2 lg:col-span-1">
          <div className="text-amber-400 mb-2 w-max">⚡</div>
          <h3 className="text-sm font-bold text-white">Deterministic Execution</h3>
          <p className="text-xs text-gray-400 mt-1">Time-locked validation prevents client-side balance tampering and page refresh manipulation.</p>
        </div>
      </div>
    </div>
  );
}