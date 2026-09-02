"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TESTER_EMAILS = [
  "maisanaakura@gmail.com",
  "contact.aprotech@gmail.com",
  "sorondinkiseeme@gmail.com",
  "idrissharif30@gmail.com",
  "kingibrahimsharif@gmail.com"
];

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0.000000);
  const [canWithdraw, setCanWithdraw] = useState<boolean>(true);
  const [isMining, setIsMining] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [syntheticBalances, setSyntheticBalances] = useState<Record<string, number>>({
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
    aETH: 3520.00,
    aBTC: 67450.00,
    aUSDT: 1.00,
    aSOL: 154.50,
    aSIDRA: 1.45,
    aCORE: 1.28,
    aRUBI: 0.65,
    aICE: 0.08,
    aPI: 31.40,
  };

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

  // LIVE MINING TICKER & BACKGROUND SYNC
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

      syncInterval = setInterval(() => {
        if (user?.id && !isSubmittingRef.current) {
          fetch("/api/user/sync-balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              balance: balanceRef.current,
              isMining: true,
              miningStartTime: localStorage.getItem("apn_mining_start_time")
            }),
          }).catch(err => console.error("Sync interval error:", err));
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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestingTransfer = async () => {
    const cleanAddress = withdrawAddress.trim();
    if (!cleanAddress || cleanAddress.length < 10) {
      alert("Please enter a valid recipient APN wallet address.");
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

        alert(`Success! Transferred ${amountNum} APN to ${cleanAddress}.`);
        setWithdrawAddress("");
        setWithdrawAmount("");
      } else {
        alert(`Transfer failed: ${resData.error || "Server Error"}`);
      }
    } catch (err) {
      console.error("Transfer execution error:", err);
      alert("Network error during transfer process.");
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

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-gray-900/80 via-slate-900/70 to-gray-900/80 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            💳 APN Decentralized Multi-Asset Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Wallet & Portfolio Holdings
          </h1>
          <p className="text-gray-400 text-xs max-w-md leading-relaxed">
            Monitor native APN tokens alongside synthetic cross-chain assets locked in your decentralized vault.
          </p>
        </div>

        <div className="w-full md:w-auto p-5 sm:p-6 rounded-2xl bg-black/60 border border-emerald-500/30 backdrop-blur-md shadow-inner">
          <div className="flex justify-between items-center mb-1 gap-4">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              TOTAL PORTFOLIO NET WORTH
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
            <span className="text-xs font-bold text-gray-400">USD</span>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs font-mono text-gray-300">
              <span className="text-blue-400 font-bold">{balance.toFixed(4)} APN</span>
              <span className="text-[10px] text-gray-500">(≈ ${apnUsdValue.toFixed(2)})</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
              1 APN = ${APN_PRICE_USD.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-md flex flex-col justify-between space-y-6 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                📥
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Receive Assets & APN</h3>
                <p className="text-xs text-gray-400">Your unique APN Layer-1 deposit address</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Public Wallet Address
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/60 p-3 rounded-xl border border-gray-800">
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
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-md flex flex-col justify-between space-y-6 shadow-lg">
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
                  className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-800/80">
            {isTester ? (
              <button
                onClick={handleTestingTransfer}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>🚀</span> {isSubmitting ? "Processing Transaction..." : "Transfer APN (Tester Access)"}
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
                className="w-full py-4 rounded-xl bg-gray-800/80 text-gray-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-gray-700/50 shadow-inner flex items-center justify-center gap-2"
              >
                <span>🔒</span> Withdrawals Locked (Mainnet Coming Soon)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
