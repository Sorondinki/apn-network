// app/dashboard/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMining, setIsMining] = useState(false);
  const [balance, setBalance] = useState(0.000000);
  const [sessionTime, setSessionTime] = useState(0);

  const baseBalanceRef = useRef(0);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  // Load User & Mining Session
  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);

    const savedBalance = localStorage.getItem("apn_user_balance");
    let initialBal = 0;

    if (savedBalance) {
      initialBal = parseFloat(savedBalance);
    } else if (userData.balance !== undefined) {
      initialBal = parseFloat(userData.balance);
    }

    baseBalanceRef.current = initialBal;
    setBalance(initialBal);

    const startTime = localStorage.getItem("apn_mining_start_time");

    if (startTime) {
      const elapsedSeconds = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
      if (elapsedSeconds < 86400) {
        setIsMining(true);
        setSessionTime(elapsedSeconds);
        // Calculate accrued balance dynamically up to this moment
        const minedSoFar = elapsedSeconds * (0.5 / 3600);
        setBalance(initialBal + minedSoFar);
      } else {
        setIsMining(false);
        localStorage.removeItem("apn_mining_start_time");
      }
    }
  }, [router]);

  // Real-time Engine with Prisma Database Auto-Sync (Every 10 seconds)
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
          setSessionTime(86400);
          return;
        }

        setSessionTime(elapsedSeconds);

        // Precise live calculation: Base Balance + Elapsed Time Mining
        const liveMined = elapsedSeconds * (0.5 / 3600);
        const liveTotal = baseBalanceRef.current + liveMined;

        setBalance(liveTotal);
        localStorage.setItem("apn_user_balance", liveTotal.toString());
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
          });
        }
      }, 10000);
    }

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [isMining, user]);

  const toggleMining = () => {
    if (!isMining) {
      const now = Date.now();
      setIsMining(true);
      baseBalanceRef.current = balance;
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

  if (!user) return null;

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* HERO SECTION MATCHING SCREENSHOT EXACTLY */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            PoS Layer-1 Web Node Active
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            APN Web Mining Console
          </h1>
          <p className="text-gray-400 text-xs leading-relaxed">
            Harness browser consensus power to earn APN native rewards directly into your Web3 local vault.
          </p>
        </div>

        {/* MINING BUTTON */}
        <div>
          <button
            onClick={toggleMining}
            className={`px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-2xl flex items-center gap-3 ${
              isMining
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/50"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50"
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            {isMining ? "Pause Session" : "Start Session"}
          </button>
        </div>
      </div>

      {/* METRICS CARDS MATCHING SCREENSHOT EXACTLY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Balance Card */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            TOTAL APN BALANCE
          </span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {balance.toFixed(6)}
            </span>
            <span className="text-xs font-semibold text-gray-400">APN</span>
          </div>
        </div>

        {/* Mining Rate Card */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            BASE MINING RATE
          </span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight">
              0.5
            </span>
            <span className="text-xs font-semibold text-gray-400">APN / hr</span>
          </div>
        </div>

        {/* Node Execution Status Card */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
            NODE EXECUTION STATUS
          </span>
          <div className="flex items-center gap-3 mt-4">
            {/* Blinking Indicator Dot */}
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

      {/* PROGRESS BAR MATCHING SCREENSHOT */}
      <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-3">
        <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
          <span>24-Hour Mining Cycle Progress</span>
          <span>{((sessionTime / 86400) * 100).toFixed(1)}% Completed</span>
        </div>
        <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-gray-800">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${(sessionTime / 86400) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}