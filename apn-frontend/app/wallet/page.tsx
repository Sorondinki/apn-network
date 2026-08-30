"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Define authorized Tester / Mentor email addresses here
const TESTER_EMAILS = [
  "maisanaakura@gmail.com", // Replace with your mentor's email address
  "contact.aprotech@gmail.com",
  "sorondinkiseeme@gmail.com",
  "idrissharif30@gmail.com",
  "kingibrahimsharif@gmail.com"
];

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0.000000);
  const [canWithdraw, setCanWithdraw] = useState<boolean>(true);
  const [isMining, setIsMining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  // Set estimated value: 1 APN = $0.15 USD
  const APN_PRICE_USD = 0.15;

  // Check if current logged-in user is an authorized tester/mentor
  const isTester = Boolean(
    user?.email && TESTER_EMAILS.includes(user.email.toLowerCase().trim())
  );

  // 1. INITIAL FETCH & LIVE DATABASE SYNC ON LOAD
  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    const userData = JSON.parse(savedUser);
    setUser(userData);

    if (userData.canWithdraw !== undefined) {
      setCanWithdraw(Boolean(userData.canWithdraw));
    } else if (userData.can_withdraw !== undefined) {
      setCanWithdraw(Boolean(userData.can_withdraw));
    }

    const savedBal = localStorage.getItem("apn_user_balance");
    if (savedBal) {
      setBalance(parseFloat(savedBal));
    } else if (userData.balance !== undefined) {
      setBalance(parseFloat(userData.balance));
    }

    // REAL-TIME SYNC: Fetch live profile and permissions from Database
    async function syncFreshUserData() {
      try {
        const res = await fetch(`/api/user/profile?id=${userData.id}`);
        const data = await res.json();
        if (data.success && data.user) {
          const freshBalance = parseFloat(data.user.balance || 0);
          const withdrawPermission =
            data.user.canWithdraw !== undefined
              ? Boolean(data.user.canWithdraw)
              : data.user.can_withdraw !== undefined
              ? Boolean(data.user.can_withdraw)
              : true;

          setBalance(freshBalance);
          setCanWithdraw(withdrawPermission);

          localStorage.setItem("apn_user_balance", freshBalance.toString());

          const updatedUser = { 
            ...userData, 
            ...data.user,
            balance: freshBalance,
            canWithdraw: withdrawPermission,
            can_withdraw: withdrawPermission
          };
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
      interval = setInterval(() => {
        setBalance((prevBal) => {
          const nextBal = prevBal + (0.5 / 3600);
          localStorage.setItem("apn_user_balance", nextBal.toString());
          return nextBal;
        });
      }, 1000);

      syncInterval = setInterval(() => {
        if (user?.id) {
          fetch("/api/user/sync-balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              balance: balanceRef.current,
              isMining: true,
              miningStartTime: localStorage.getItem("apn_mining_start_time")
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

  const walletAddress = user?.id 
    ? `0xAPN${user.id.substring(0, 8)}${user.id.substring(user.id.length - 8)}`
    : "0xAPN8f3A19B204C29e71";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handler for Mentor Testing Transfer Action
  const handleTestingTransfer = async () => {
    if (!withdrawAddress.trim()) {
      alert("Please enter a valid recipient wallet address.");
      return;
    }
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid positive transfer amount.");
      return;
    }
    if (amountNum > balance) {
      alert("Insufficient APN balance for this transfer.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Deduct locally and sync
      const nextBalance = balance - amountNum;
      setBalance(nextBalance);
      localStorage.setItem("apn_user_balance", nextBalance.toString());

      await fetch("/api/user/sync-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          balance: nextBalance,
          isMining: isMining,
          miningStartTime: localStorage.getItem("apn_mining_start_time")
        }),
      });

      alert(`Success! Transferred ${amountNum} APN to ${withdrawAddress}.`);
      setWithdrawAddress("");
      setWithdrawAmount("");
    } catch (err) {
      alert("Transfer failed. Please check network connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const estimatedUsdValue = (balance * APN_PRICE_USD).toFixed(4);
  const isWithdrawUnlocked = isTester || canWithdraw;

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* HEADER SECTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-gray-900/60 via-slate-900/50 to-gray-900/60 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            💳 APN Decentralized Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Wallet & Assets Management
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            Manage your native APN crypto holdings, receive tokens from peer nodes, or prepare for mainnet token distribution.
          </p>
        </div>

        {/* LIVE REAL-TIME BALANCE & USD VALUE BOX */}
        <div className="w-full md:w-auto p-5 sm:p-6 rounded-2xl bg-black/40 border border-emerald-500/30 backdrop-blur-md">
          <div className="flex justify-between items-center mb-1 gap-4">
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

          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight break-all">
              {balance.toFixed(6)}
            </span>
            <span className="text-xs font-bold text-gray-300">APN</span>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <span className="text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              ≈ ${estimatedUsdValue} USD
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              (1 APN = ${APN_PRICE_USD})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* RECEIVE APN SECTION */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                📥
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Receive APN</h3>
                <p className="text-xs text-gray-400">Your unique APN Layer-1 deposit address</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Deposit Address
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/60 p-3 rounded-xl border border-gray-800">
                <span className="text-xs font-mono text-emerald-400 truncate flex-1 break-all py-1 sm:py-0">
                  {walletAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold rounded-lg transition-all shrink-0 text-center"
                >
                  {copied ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>

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
        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold shrink-0">
                📤
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Withdraw APN</h3>
                <p className="text-xs text-gray-400">Transfer APN native tokens to external Web3 address</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  disabled={!isWithdrawUnlocked}
                  placeholder="Paste 0x... or APN wallet address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Amount (APN)
                  </label>
                  <button
                    disabled={!isWithdrawUnlocked}
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="text-xs text-blue-400 hover:underline font-bold disabled:opacity-50 disabled:no-underline"
                  >
                    Max
                  </button>
                </div>
                <input
                  type="number"
                  disabled={!isWithdrawUnlocked}
                  placeholder="0.000000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="p-3 bg-black/40 border border-gray-800/80 rounded-xl flex justify-between text-xs text-gray-400">
                <span>Estimated Network Gas Fee:</span>
                <span className="font-mono text-white">0.000000 APN (Free)</span>
              </div>
            </div>
          </div>

          {/* WITHDRAWAL ACCESS CONTROL */}
          <div className="space-y-3 pt-4 border-t border-gray-800/80">
            {isTester ? (
              <>
                <button
                  onClick={handleTestingTransfer}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>🚀</span> {isSubmitting ? "Processing..." : "Transfer APN (Tester Access)"}
                </button>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] leading-relaxed text-center">
                  🧪 <strong>Tester Privilege Active:</strong> You are granted explicit permission to test token transfers across peer node wallets.
                </div>
              </>
            ) : !canWithdraw ? (
              <>
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-red-950/40 text-red-400 border border-red-500/30 font-bold text-xs uppercase tracking-wider cursor-not-allowed shadow-inner flex items-center justify-center gap-2"
                >
                  <span>🚫</span> Withdrawals Suspended for this Account
                </button>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] leading-relaxed text-center">
                  ⚠️ <strong>Access Restricted:</strong> Withdrawal privileges for this account are temporarily restricted by the system administrator.
                </div>
              </>
            ) : (
              <>
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-gray-800/80 text-gray-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-gray-700/50 shadow-inner flex items-center justify-center gap-2"
                >
                  <span>🔒</span> Withdrawals Locked (Mainnet Coming Soon)
                </button>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] leading-relaxed text-center">
                  ⚠️ <strong>Mainnet Migration Notice:</strong> Direct withdrawals are currently undergoing security audits. Full mainnet distribution channels will open upon reaching Phase 2 consensus.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
