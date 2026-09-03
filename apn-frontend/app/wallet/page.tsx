"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const TESTER_EMAILS = [
  "maisanaakura@gmail.com",
  "contact.aprotech@gmail.com",
  "sorondinkiseeme@gmail.com",
  "idrissharif30@gmail.com",
  "kingibrahimsharif@gmail.com"
];

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0.0);
  const [canWithdraw, setCanWithdraw] = useState<boolean>(true);
  const [isMining, setIsMining] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Toast Notification State
  const [toast, setToast] = useState<ToastState | null>(null);

  const [syntheticBalances] = useState<Record<string, number>>({
    aETH: 0.0045,
    aBTC: 0.00015,
    aUSDT: 12.5,
    aSOL: 0.125,
    aSIDRA: 10,
    aCORE: 15,
    aRUBI: 35,
    aICE: 150,
    aPI: 25,
  });

  const balanceRef = useRef<number>(balance);
  const isSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  const APN_PRICE_USD = 0.15;

  const TOKEN_PRICES: Record<string, number> = {
    aETH: 3520.0,
    aBTC: 67450.0,
    aUSDT: 1.0,
    aSOL: 154.5,
    aSIDRA: 1.45,
    aCORE: 1.28,
    aRUBI: 0.65,
    aICE: 0.08,
    aPI: 31.4,
  };

  const triggerToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const isTester = Boolean(
    user?.email && TESTER_EMAILS.includes(user.email.toLowerCase().trim())
  );

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);

      if (userData.canWithdraw !== undefined) {
        setCanWithdraw(Boolean(userData.canWithdraw));
      }

      const savedBal = localStorage.getItem("apn_user_balance");
      if (savedBal && !isNaN(parseFloat(savedBal))) {
        const initialBal = parseFloat(savedBal);
        setBalance(initialBal);
        balanceRef.current = initialBal;
      }

      async function syncFreshUserData() {
        if (!userData.id) return;
        try {
          const res = await fetch(`/api/user/profile?id=${encodeURIComponent(userData.id)}`);
          const data = await res.json();
          if (data.success && data.user) {
            const freshBalance = parseFloat(data.user.balance || 0);
            setBalance(freshBalance);
            balanceRef.current = freshBalance;
            setCanWithdraw(data.user.canWithdraw ?? true);
            localStorage.setItem("apn_user_balance", freshBalance.toString());
          }
        } catch (err) {
          console.error("Error fetching live user data:", err);
        }
      }

      syncFreshUserData();

      const startTime = localStorage.getItem("apn_mining_start_time");
      if (startTime) {
        const elapsedSeconds = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
        if (elapsedSeconds < 86400) {
          setIsMining(true);
        }
      }
    } catch (e) {
      console.error("Error initializing wallet session:", e);
    }
  }, [router]);

  // LIVE MINING TICKER & SAFE BACKEND SYNC (Prevents Overwriting Database Transfers)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let syncInterval: NodeJS.Timeout;

    if (isMining) {
      interval = setInterval(() => {
        if (!isSubmittingRef.current) {
          setBalance((prevBal) => {
            const nextBal = prevBal + (0.5 / 3600);
            balanceRef.current = nextBal;
            localStorage.setItem("apn_user_balance", nextBal.toString());
            return nextBal;
          });
        }
      }, 1000);

      syncInterval = setInterval(async () => {
        if (user?.id && !isSubmittingRef.current) {
          try {
            const res = await fetch("/api/user/sync-balance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                isMining: true,
                miningStartTime: localStorage.getItem("apn_mining_start_time")
              }),
            });
            const data = await res.json();
            if (data.success && data.balance !== undefined) {
              const fresh = parseFloat(data.balance);
              setBalance(fresh);
              balanceRef.current = fresh;
              localStorage.setItem("apn_user_balance", fresh.toString());
            }
          } catch (err) {
            console.error("Balance sync error:", err);
          }
        }
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [isMining, user?.id]);

  const walletAddress = user?.walletAddress || (user?.id 
    ? `0xAPN${user.id.substring(0, 8)}${user.id.substring(user.id.length - 8)}`
    : "0xAPN8f3A19B204C29e71");

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    triggerToast("Wallet address copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestingTransfer = async () => {
    const cleanAddress = withdrawAddress.trim();
    if (!cleanAddress || cleanAddress.length < 10) {
      triggerToast("Please enter a valid recipient $APN wallet address.", "error");
      return;
    }

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerToast("Please enter a valid positive transfer amount.", "error");
      return;
    }

    if (amountNum > balance) {
      triggerToast("Insufficient $APN balance for this transaction.", "error");
      return;
    }

    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      const response = await fetch("/api/user/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          recipientAddress: cleanAddress,
          amount: amountNum,
        }),
      });

      const resData = await response.json();

      if (resData.success) {
        const updatedBal = parseFloat(resData.newBalance);
        setBalance(updatedBal);
        balanceRef.current = updatedBal;
        localStorage.setItem("apn_user_balance", updatedBal.toString());

        triggerToast(`Successfully transferred ${amountNum.toLocaleString()} $APN to ${cleanAddress.substring(0, 10)}...`, "success");
        setWithdrawAddress("");
        setWithdrawAmount("");
      } else {
        triggerToast(`Transfer Failed: ${resData.error || "Server validation rejected"}`, "error");
      }
    } catch (err) {
      console.error("Transfer execution error:", err);
      triggerToast("Network communication error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (!user) return null;

  const apnUsdValue = balance * APN_PRICE_USD;
  const syntheticUsdValue = Object.keys(syntheticBalances).reduce((acc, key) => {
    return acc + (syntheticBalances[key] || 0) * (TOKEN_PRICES[key] || 0);
  }, 0);

  const totalPortfolioValueUsd = apnUsdValue + syntheticUsdValue;
  const isWithdrawUnlocked = isTester || canWithdraw;

  // Web3 Dynamic QR Code API Endpoint
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(walletAddress)}&bgcolor=0f172a&color=38bdf8&margin=10`;

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 font-sans relative">
      {/* PREMIUM FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-top-4">
          <span className="text-base">
            {toast.type === "success" ? "✅" : toast.type === "error" ? "⚠️" : "ℹ️"}
          </span>
          <span className="text-xs font-semibold text-white tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* PORTFOLIO OVERVIEW HERO HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/30 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            ⚡ APN Layer-1 Decentralized Multi-Asset Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Wallet & Portfolio Holdings
          </h1>
          <p className="text-slate-400 text-xs max-w-md leading-relaxed">
            Manage your native $APN crypto assets along with cross-chain synthetic liquidity tokens locked in your secure vault.
          </p>
        </div>

        <div className="w-full md:w-auto p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/30 backdrop-blur-md shadow-inner">
          <div className="flex justify-between items-center mb-1 gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              ESTIMATED PORTFOLIO VALUE
            </span>
            {isMining && (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE SYNC
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mt-1 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              ${totalPortfolioValueUsd.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-400">USD</span>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <span className="text-blue-400 font-bold">{balance.toFixed(4)} $APN</span>
              <span className="text-[10px] text-slate-500">(≈ ${apnUsdValue.toFixed(2)})</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
              1 $APN = ${APN_PRICE_USD.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* CORE WALLET INTERACTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* RECEIVE ASSETS & QR CODE PANEL */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md flex flex-col justify-between space-y-6 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  📥
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Receive $APN & P2P Deposit</h3>
                  <p className="text-xs text-slate-400">Your unique APN Layer-1 public deposit address</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📱</span> Show QR
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Public Wallet Address
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-emerald-400 truncate flex-1 break-all py-1 sm:py-0">
                  {walletAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold rounded-lg transition-all shrink-0 text-center cursor-pointer"
                >
                  {copied ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* EMBEDDED QUICK QR PREVIEW */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
              <img
                src={qrCodeUrl}
                alt="APN Wallet QR"
                className="w-16 h-16 rounded-xl border border-slate-700 bg-slate-900 shrink-0 cursor-pointer"
                onClick={() => setShowQrModal(true)}
              />
              <div className="text-xs space-y-1">
                <span className="text-slate-200 font-bold block">P2P Scan & Pay</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Scan this QR code from any camera or Web3 mobile device to receive direct $APN and instant P2P payments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEND / WITHDRAW APN TOKENS */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md flex flex-col justify-between space-y-6 shadow-xl">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold shrink-0">
                📤
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Transfer & Withdraw $APN</h3>
                <p className="text-xs text-slate-400">Send native $APN coins to external or P2P addresses</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  disabled={!isWithdrawUnlocked}
                  placeholder="Paste recipient 0x... or APN address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Amount ($APN)
                  </label>
                  <button
                    disabled={!isWithdrawUnlocked}
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="text-xs text-blue-400 hover:underline font-bold disabled:opacity-50 disabled:no-underline cursor-pointer"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            {isTester ? (
              <button
                onClick={handleTestingTransfer}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>🚀</span> {isSubmitting ? "Broadcasting to APN Ledger..." : "Transfer $APN (Live Direct)"}
              </button>
            ) : !canWithdraw ? (
              <button
                disabled
                className="w-full py-4 rounded-xl bg-red-950/40 text-red-400 border border-red-500/30 font-bold text-xs uppercase tracking-wider cursor-not-allowed shadow-inner flex items-center justify-center gap-2"
              >
                <span>🚫</span> Withdrawals Suspended for this Account
              </button>
            ) : (
              <button
                disabled
                className="w-full py-4 rounded-xl bg-slate-800/80 text-slate-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-slate-700/50 shadow-inner flex items-center justify-center gap-2"
              >
                <span>🔒</span> Withdrawals Locked (Mainnet Transition)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FULL-SIZE QR CODE MODAL FOR P2P TRANSFERS */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-blue-500/40 p-6 sm:p-8 rounded-3xl max-w-sm w-full space-y-6 text-center shadow-2xl relative">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                P2P QR Direct Transfer
              </span>
              <h3 className="text-xl font-black text-white mt-2">Scan to Receive $APN</h3>
              <p className="text-xs text-slate-400">Layer-1 APN native address verification</p>
            </div>

            <div className="flex justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <img
                src={qrCodeUrl}
                alt="P2P Wallet Address QR Code"
                className="w-52 h-52 rounded-xl shadow-lg"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] font-mono text-emerald-400 break-all select-all">
                {walletAddress}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyAddress}
                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
              >
                Copy Address
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
