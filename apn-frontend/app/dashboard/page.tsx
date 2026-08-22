"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMining, setIsMining] = useState(false);
  const [balance, setBalance] = useState(0.000000);
  const [sessionTime, setSessionTime] = useState(0);
  const [referralCount, setReferralCount] = useState(0);

  const baseBalanceRef = useRef(0);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  // Anti-DevTools Security & Code Tampering Protection
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

    const devToolsInterval = setInterval(() => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.clear();
      }
    }, 2000);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, []);

  const isFounder = user?.role === "ADMIN" || user?.isFounder === true;

  // Base Mining Rates
  const baseRate = isFounder ? 5.0 : 0.5;
  const referralBonusRate = referralCount * 0.2;
  const hourlyRate = baseRate + referralBonusRate;
  const hourlyRateRef = useRef(hourlyRate);
  hourlyRateRef.current = hourlyRate;

  // Load User, Balance, and Mining Session accurately on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);

    if (userData?.id) {
      fetch(`/api/user/referrals?userId=${userData.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.totalInvited === "number") {
            setReferralCount(data.totalInvited);
          }
        })
        .catch((err) => console.error("Error fetching referral details:", err));
    }

    const initialBal = parseFloat(userData.balance || "0");
    const startTimeStr = localStorage.getItem("apn_mining_start_time");

    if (startTimeStr) {
      const startTime = parseInt(startTimeStr, 10);
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

      if (elapsedSeconds < 86400) {
        setIsMining(true);
        setSessionTime(elapsedSeconds);

        const savedBase = localStorage.getItem("apn_base_balance");
        const realBase = savedBase ? parseFloat(savedBase) : initialBal;

        baseBalanceRef.current = realBase;

        const minedSoFar = elapsedSeconds * (hourlyRateRef.current / 3600);
        setBalance(realBase + minedSoFar);
      } else {
        setIsMining(false);
        baseBalanceRef.current = initialBal;
        setBalance(initialBal);
        localStorage.removeItem("apn_mining_start_time");
        localStorage.removeItem("apn_base_balance");
      }
    } else {
      baseBalanceRef.current = initialBal;
      setBalance(initialBal);
    }
  }, [router]);

  // Real-time Mining Engine with Precise Deterministic Balance Calculation
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

  if (!user) return null;

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto selection:bg-blue-500 selection:text-white">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-gray-950/90 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        
        {/* LEFT INFORMATION CONTAINER */}
        <div className="space-y-3 max-w-xl z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              PoS Layer-1 Web Node Active
            </div>

            {/* FOUNDER SPECIAL BADGE */}
            {isFounder && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide shadow-lg shadow-amber-950/50">
                ⚡ Founder Master Node
              </div>
            )}

            {/* REFERRAL BOOST BADGE */}
            {referralCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold tracking-wide">
                🚀 +{(referralCount * 0.2).toFixed(1)} APN/hr Boost ({referralCount} Ref)
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

        {/* CENTER APN TOKEN GRAPHIC WITH GLOW */}
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

        {/* MINING BUTTON */}
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
        
        {/* Balance Card */}
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

        {/* Mining Rate Card */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md hover:border-blue-500/30 transition-all duration-300">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            TOTAL MINING RATE
          </span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight">
              {hourlyRate.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-gray-400">APN / hr</span>
            {referralCount > 0 && (
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold ml-1 border border-blue-500/30">
                +{(referralCount * 0.2).toFixed(1)} Ref Bonus
              </span>
            )}
          </div>
        </div>

        {/* Node Execution Status Card */}
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

      {/* PROGRESS BAR SECTION */}
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

      {/* FEATURE PROMOTIONAL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        <div 
          onClick={() => router.push('/dashboard/referrals')}
          className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-gray-800/80 hover:border-blue-500/50 transition-all cursor-pointer group"
        >
          <div className="text-blue-400 mb-2 group-hover:scale-110 transition-transform w-max">👥</div>
          <h3 className="text-sm font-bold text-white">Invite Friends (Referrals)</h3>
          <p className="text-xs text-gray-400 mt-1">Earn +0.2 APN/hr boost for every active friend you invite to mine.</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-gray-800/80 hover:border-emerald-500/50 transition-all">
          <div className="text-emerald-400 mb-2 w-max">🛡️</div>
          <h3 className="text-sm font-bold text-white">Node Vault & Security</h3>
          <p className="text-xs text-gray-400 mt-1">Your mined APN token balance is cryptographically secured via PoS protocol.</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-gray-800/80 hover:border-amber-500/50 transition-all sm:col-span-2 lg:col-span-1">
          <div className="text-amber-400 mb-2 w-max">⚡</div>
          <h3 className="text-sm font-bold text-white">High Execution Speed</h3>
          <p className="text-xs text-gray-400 mt-1">Keep your node console session open to ensure maximum network hash efficiency.</p>
        </div>
      </div>
    </div>
  );
}