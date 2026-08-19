// app/wallet/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0.000000);
  const [isMining, setIsMining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  // Set the estimated value: 1 APN = $0.15 USD
  const APN_PRICE_USD = 0.15;

  // 1. INITIAL FETCH & LIVE DATABASE SYNC ON LOAD
  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    const userData = JSON.parse(savedUser);
    setUser(userData);

    // Initial balance fetch from LocalStorage as fallback
    const savedBal = localStorage.getItem("apn_user_balance");
    if (savedBal) {
      setBalance(parseFloat(savedBal));
    } else if (userData.balance !== undefined) {
      setBalance(parseFloat(userData.balance));
    }

    // REAL-TIME SYNC: Fetch fresh balance directly from Database to catch Admin transfers instantly
    async function syncFreshUserData() {
      try {
        const res = await fetch(`/api/user/profile?id=${userData.id}`);
        const data = await res.json();
        if (data.success && data.user) {
          const freshBalance = parseFloat(data.user.balance || 0);
          setBalance(freshBalance);
          localStorage.setItem("apn_user_balance", freshBalance.toString());
          
          // Update full user session in LocalStorage
          const updatedUser = { ...userData, balance: freshBalance };
          localStorage.setItem("apn_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } catch (err) {
        console.error("Error fetching live user data:", err);
      }
    }

    if (userData.id) {
      syncFreshUserData();
    }

    // Check if mining session is currently active
    const startTime = localStorage.getItem("apn_mining_start_time");
    if (startTime) {
      const elapsedSeconds = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
      if (elapsedSeconds < 86400) {
        setIsMining(true);
      }
    }
  }, [router]);

  // 2. LIVE REAL-TIME ENGINE FOR MINING INCREMENT & DATABASE SYNC
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let syncInterval: NodeJS.Timeout;

    if (isMining) {
      // Live Increment (0.5 APN/hr => 0.5/3600 per second)
      interval = setInterval(() => {
        setBalance((prevBal) => {
          const nextBal = prevBal + (0.5 / 3600);
          localStorage.setItem("apn_user_balance", nextBal.toString());
          return nextBal;
        });
      }, 1000);

      // Auto-Sync with database every 10 seconds
      syncInterval = setInterval(() => {
        if (user?.id) {
          fetch("/api/user/sync-balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              balance: balanceRef.current,
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

  // Generate deterministic Web3 Wallet Address
  const walletAddress = user?.id 
    ? `0xAPN${user.id.substring(0, 8)}${user.id.substring(user.id.length - 8)}`
    : "0xAPN8f3A19B204C29e71";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  // Calculate live USD value dynamically
  const estimatedUsdValue = (balance * APN_PRICE_USD).toFixed(4);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* HEADER SECTION */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-gray-900/60 via-slate-900/50 to-gray-900/60 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            💳 APN Decentralized Vault
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Wallet & Assets Management
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            Manage your native APN crypto holdings, receive tokens from peer nodes, or prepare for mainnet token distribution.
          </p>
        </div>

        {/* LIVE REAL-TIME BALANCE & USD VALUE BOX */}
        <div className="w-full md:w-auto p-6 rounded-2xl bg-black/40 border border-emerald-500/30 backdrop-blur-md">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">
              ESTIMATED TOTAL BALANCE
            </span>
            {isMining && (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            )}
          </div>

          {/* Live APN Balance */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {balance.toFixed(6)}
            </span>
            <span className="text-xs font-bold text-gray-300">APN</span>
          </div>

          {/* Live Dynamic USD Valuation */}
          <div className="mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between gap-4">
            <span className="text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              ≈ ${estimatedUsdValue} USD
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              (1 APN = ${APN_PRICE_USD})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RECEIVE APN SECTION */}
        <div className="p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                📥
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Receive APN</h3>
                <p className="text-xs text-gray-400">Your unique APN Layer-1 deposit address</p>
              </div>
            </div>

            {/* WALLET ADDRESS DISPLAY & COPY */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Deposit Address
              </label>
              <div className="flex items-center gap-2 bg-black/60 p-3 rounded-xl border border-gray-800">
                <span className="text-xs font-mono text-emerald-400 truncate flex-1">
                  {walletAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold rounded-lg transition-all"
                >
                  {copied ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* QR CODE DISPLAY BOX */}
            <div className="flex flex-col items-center justify-center p-6 bg-black/50 border border-gray-800 rounded-2xl text-center space-y-3">
              <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-full h-full border-4 border-black grid grid-cols-4 gap-1 p-1 bg-black">
                  <div className="bg-white col-span-2 row-span-2"></div>
                  <div className="bg-white col-span-1"></div>
                  <div className="bg-white col-span-1"></div>
                  <div className="bg-white col-span-2"></div>
                  <div className="bg-white col-span-2 row-span-2"></div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Scan QR code to transfer APN tokens directly to this account.
              </p>
            </div>
          </div>
        </div>

        {/* WITHDRAW APN SECTION */}
        <div className="p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
                📤
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Withdraw APN</h3>
                <p className="text-xs text-gray-400">Transfer APN native tokens to external Web3 address</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Destination Address Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="Paste 0x... or APN wallet address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Amount (APN)
                  </label>
                  <button
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="text-xs text-blue-400 hover:underline font-bold"
                  >
                    Max
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="0.000000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Network Fee Info */}
              <div className="p-3 bg-black/40 border border-gray-800/80 rounded-xl flex justify-between text-xs text-gray-400">
                <span>Estimated Network Gas Fee:</span>
                <span className="font-mono text-white">0.000000 APN (Free)</span>
              </div>
            </div>
          </div>

          {/* COMING SOON NOTICE */}
          <div className="space-y-3 pt-4 border-t border-gray-800/80">
            <button
              disabled
              className="w-full py-4 rounded-xl bg-gray-800/80 text-gray-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-gray-700/50 shadow-inner flex items-center justify-center gap-2"
            >
              <span>🔒</span> Withdrawals Locked (Mainnet Coming Soon)
            </button>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] leading-relaxed text-center">
              ⚠️ <strong>Mainnet Migration Notice:</strong> Direct withdrawals are currently undergoing security audits. Full mainnet distribution and withdrawal channels will open upon reaching Phase 2 node consensus.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}