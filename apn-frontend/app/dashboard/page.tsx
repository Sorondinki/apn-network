"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MaintenanceOverlay from "../components/MaintenanceOverlay";
import AadsBanner from "../components/AadsBanner";

export default function DashboardPage() {
  const isMaintenance = false;

  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMining, setIsMining] = useState(false);
  const [balance, setBalance] = useState(0.000000);
  const [sessionTime, setSessionTime] = useState(0);
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Announcement Banner State
  const notices = [
    "APN Core (v1.0.2): PoS Node validation engine active. Maximum base yield: 12 APN / 24 Hours.",
    "KYC Verification Portal: Complete your identity check to unlock Verified Badge & 50 APN Bonus!",
    "Node Speed Booster Active: Upgrade your node to 2.5x or 5.0x for instant accelerated mining!",
  ];

  const [noticeIndex, setNoticeIndex] = useState(0);
  const [showNotice, setShowNotice] = useState(true);

  // Auto-rotate notices
  useEffect(() => {
    if (!showNotice) return;
    const interval = setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showNotice, notices.length]);

  const baseBalanceRef = useRef(0);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  // DevTools & Security Enforcement
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

  // LISSAFIN GUDUN MINING TARE DA BOOSTER
  const isBoosterActive = user?.boosterExpiresAt && new Date(user.boosterExpiresAt) > new Date();
  const currentMultiplier = isBoosterActive ? parseFloat(user.miningMultiplier || "1.0") : 1.0;
  
  const baseRate = isFounder ? 5.0 : 0.5;
  const boosterBoostedRate = baseRate * currentMultiplier; // Misali: 0.5 * 2.5 = 1.25 APN/hr
  const referralBonusRate = activeReferrals * 0.2;
  const hourlyRate = boosterBoostedRate + referralBonusRate;
  
  const hourlyRateRef = useRef(hourlyRate);
  hourlyRateRef.current = hourlyRate;

  // Sync & Profile Data Fetcher
  const syncAndLoadUserData = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem("apn_user");
      if (!savedUser) {
        router.push("/register");
        return;
      }

      const localUserData = JSON.parse(savedUser);
      setUser(localUserData);

      let dbBalance = parseFloat(localUserData.balance || "0");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const userRes = await fetch(`/api/user/profile?userId=${localUserData.id}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        const userData = await userRes.json();
        if (userData && userData.success && userData.user) {
          setUser(userData.user);
          dbBalance = parseFloat(userData.user.balance || "0");
          localStorage.setItem("apn_user", JSON.stringify(userData.user));
        }
      } catch (e) {
        console.warn("Profile fetch timeout, fallback to session:", e);
      }

      const startTimeStr = localStorage.getItem("apn_mining_start_time");
      const savedBase = localStorage.getItem("apn_base_balance");

      if (startTimeStr) {
        const startTime = parseInt(startTimeStr, 10);
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const currentBase = savedBase ? parseFloat(savedBase) : dbBalance;

        if (elapsedSeconds < 86400) {
          setIsMining(true);
          setSessionTime(elapsedSeconds);
          baseBalanceRef.current = currentBase;

          const minedSoFar = elapsedSeconds * (hourlyRateRef.current / 3600);
          setBalance(currentBase + minedSoFar);
        } else {
          setIsMining(false);
          const totalMinedInSession = 86400 * (hourlyRateRef.current / 3600);
          const finalBalance = currentBase + totalMinedInSession;

          baseBalanceRef.current = finalBalance;
          setBalance(finalBalance);
          setSessionTime(86400);

          localStorage.removeItem("apn_mining_start_time");
          localStorage.setItem("apn_base_balance", finalBalance.toString());

          if (localUserData?.id) {
            fetch("/api/user/sync-balance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: localUserData.id,
                balance: finalBalance,
                isMining: false,
                miningStartTime: null,
              }),
            }).catch((err) => console.error("Sync error:", err));
          }
        }
      } else {
        setIsMining(false);
        baseBalanceRef.current = dbBalance;
        setBalance(dbBalance);
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    syncAndLoadUserData();
  }, [syncAndLoadUserData]);

  // Real-time Mining Counter
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
          setSessionTime(86400);
          
          const totalMinedInSession = 86400 * (hourlyRateRef.current / 3600);
          const finalCompletedBalance = baseBalanceRef.current + totalMinedInSession;

          setBalance(finalCompletedBalance);
          localStorage.removeItem("apn_mining_start_time");
          localStorage.setItem("apn_base_balance", finalCompletedBalance.toString());
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

  const startMiningSession = () => {
    if (isMining) return;
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
  };

  const handleBuyBooster = async (plan: "PRO" | "ULTRA") => {
    if (!user?.id || !user?.email) {
      alert("Don Allah ka tabbatar kana cikin asusunka (Logged in).");
      return;
    }

    try {
      setLoadingPlan(plan);
      const res = await fetch("/api/booster/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email, plan }),
      });

      const data = await res.json();
      if (data.success && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        alert(data.error || "Wani kuskure ya faru lokacin buɗe shafin biya.");
      }
    } catch (err) {
      console.error(err);
      alert("Akwai matsala wajen haɗawa da uwar garke (server).");
    } finally {
      setLoadingPlan(null);
    }
  };

  const formatCountdown = (elapsed: number) => {
    const remaining = Math.max(0, 86400 - elapsed);
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (isMaintenance) {
    return <MaintenanceOverlay />;
  }

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 select-none">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium animate-pulse">Initializing APN Secure Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto selection:bg-blue-500 selection:text-white select-none">
      
      {/* ANNOUNCEMENT BANNER */}
      {showNotice && (
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border border-blue-500/30 backdrop-blur-md flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
            </span>
            <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed">
              <strong className="text-white font-bold">APN Announcement:</strong> {notices[noticeIndex]}
            </p>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            className="text-gray-400 hover:text-white text-xs bg-gray-800/60 hover:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-700 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN HERO SECTION */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-gray-950/90 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 max-w-xl z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              PoS Layer-1 Web Node Active
            </div>

            {isBoosterActive && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg">
                ⚡ Booster Active: {currentMultiplier}x Speed
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

        {/* LOGO GRAPHIC */}
        <div className="relative flex items-center justify-center my-2 md:my-0">
          <div className={`absolute w-40 h-40 rounded-full transition-all duration-700 ${
            isMining ? "bg-emerald-500/20 blur-3xl animate-pulse" : "bg-transparent"
          }`} />
          
          <div className={`relative p-5 rounded-full bg-gradient-to-b from-gray-800/90 to-gray-900/95 border transition-all duration-500 ${
            isMining ? "border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.3)]" : "border-gray-800"
          }`}>
            <Image
              src="/images/apn-token512x512.png"
              alt="APN Token Logo"
              width={96}
              height={96}
              priority
              className={`object-contain transition-all duration-700 ${
                isMining ? "scale-105 animate-spin-slow" : "opacity-75 grayscale-[20%]"
              }`}
            />
          </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="z-10 flex flex-col items-center gap-3">
          {isMining ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 border border-emerald-400/30 text-white font-bold text-base shadow-2xl flex items-center gap-3 animate-pulse">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span>Mining Session Active ⚡</span>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-4 py-1 rounded-full">
                Time Remaining: {formatCountdown(sessionTime)}
              </span>
            </div>
          ) : (
            <button
              onClick={startMiningSession}
              className="px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-2xl flex items-center gap-3 active:scale-95 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white"
            >
              <Image src="/images/apn-token512x512.png" alt="Token Icon" width={24} height={24} className="object-contain" />
              <span>Start 24h Mining Session 🚀</span>
            </button>
          )}
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">TOTAL APN BALANCE</span>
          <div className="flex items-center gap-3 mt-4">
            <Image src="/images/apn-token512x512.png" alt="APN Logo" width={34} height={34} className="object-contain shrink-0" />
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">{balance.toFixed(6)}</span>
              <span className="text-xs font-semibold text-gray-400">APN</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-blue-500/30 transition-all">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">TOTAL MINING RATE</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight">{hourlyRate.toFixed(2)}</span>
            <span className="text-xs font-semibold text-gray-400">APN / hr</span>
            {isBoosterActive && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold ml-1 border border-amber-500/30">
                {currentMultiplier}x Boost
              </span>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-emerald-500/30 transition-all">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">NODE EXECUTION STATUS</span>
          <div className="flex items-center gap-3 mt-4">
            <span className="relative flex h-4 w-4">
              {isMining && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-4 w-4 ${isMining ? "bg-emerald-500 animate-pulse" : "bg-gray-600"}`} />
            </span>
            <span className={`text-xl font-bold tracking-tight ${isMining ? "text-emerald-400" : "text-gray-400"}`}>
              {isMining ? "Mining in Progress" : "Node Standby"}
            </span>
          </div>
        </div>
      </div>

      {/* NODE BOOSTER SUBSCRIPTION SECTION */}
      <div className="p-6 rounded-3xl bg-gray-900/80 border border-emerald-500/20 space-y-6 text-white shadow-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2 text-white">
              ⚡ APN Node Speed Booster
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Increase your mining rate for 30 days using Paystack automatic activation.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-emerald-400 font-bold block">
              Current Boost: {isBoosterActive ? currentMultiplier : 1.0}x Speed
            </span>
            <span className="text-[10px] text-gray-500 uppercase font-mono">
              Plan: {isBoosterActive ? user?.boosterPlan : "FREE"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PRO PLAN */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-800/80 to-gray-900 border border-gray-700/60 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                PRO NODE
              </span>
              <h3 className="text-lg font-bold mt-2 text-white">2.5x Speed Boost</h3>
              <p className="text-2xl font-black text-emerald-400 mt-1">₦1,500 <span className="text-xs text-gray-400 font-normal">/ 30 Days</span></p>
              <ul className="text-xs text-gray-400 mt-3 space-y-1.5">
                <li>✓ Earn 2.5x base APN rate</li>
                <li>✓ Instant automated Paystack activation</li>
                <li>✓ Valid for 30 days</li>
              </ul>
            </div>
            <button
              onClick={() => handleBuyBooster("PRO")}
              disabled={loadingPlan === "PRO"}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {loadingPlan === "PRO" ? "Processing..." : "Upgrade to PRO (₦1,500) 🚀"}
            </button>
          </div>

          {/* ULTRA PLAN */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/30 to-gray-900 border border-emerald-500/40 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl">
              MAX SPEED
            </div>
            <div>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full font-bold">
                ULTRA NODE
              </span>
              <h3 className="text-lg font-bold mt-2 text-white">5.0x Speed Boost</h3>
              <p className="text-2xl font-black text-emerald-400 mt-1">₦3,500 <span className="text-xs text-gray-400 font-normal">/ 30 Days</span></p>
              <ul className="text-xs text-gray-400 mt-3 space-y-1.5">
                <li>✓ Earn 5.0x maximum APN rate</li>
                <li>✓ Instant automated Paystack activation</li>
                <li>✓ Priority network node execution</li>
              </ul>
            </div>
            <button
              onClick={() => handleBuyBooster("ULTRA")}
              disabled={loadingPlan === "ULTRA"}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {loadingPlan === "ULTRA" ? "Processing..." : "Upgrade to ULTRA (₦3,500) 🔥"}
            </button>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-3">
        <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
          <span>24-Hour Mining Cycle Progress</span>
          <span className="font-mono text-emerald-400">{((sessionTime / 86400) * 100).toFixed(1)}% Completed</span>
        </div>
        <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-gray-800 p-0.5">
          <div
            className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(sessionTime / 86400) * 100}%` }}
          />
        </div>
      </div>

      {/* A-ADS MONETIZATION BANNER */}
      <AadsBanner />
    </div>
  );
}
