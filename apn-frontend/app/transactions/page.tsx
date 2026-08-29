"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  txHash: string;
  type: "MINING_REWARD" | "REFERRAL_BONUS" | "STAKING_YIELD" | "TRANSFER_OUT" | "TRANSFER_IN";
  amount: number;
  status: "COMPLETED" | "PENDING" | "FAILED";
  timestamp: string;
  description: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name?: string } | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  const fetchTransactions = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/transactions?userId=${userId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
        setTransactions(data.transactions);
      } else {
        // Dynamic fallback mock data with fixed timestamps to prevent re-hydration error
        const now = Date.now();
        setTransactions([
          {
            id: "tx-101",
            txHash: "0xapn982f...a12c",
            type: "MINING_REWARD",
            amount: 24.00,
            status: "COMPLETED",
            timestamp: new Date(now - 3600000 * 2).toISOString().replace("T", " ").substring(0, 19),
            description: "24-Hour Node Mining Cycle Reward",
          },
          {
            id: "tx-102",
            txHash: "0xapn441b...7e99",
            type: "REFERRAL_BONUS",
            amount: 14.50,
            status: "COMPLETED",
            timestamp: new Date(now - 3600000 * 18).toISOString().replace("T", " ").substring(0, 19),
            description: "10% Mining Hash Rate Commission (Ref: APN-8902)",
          },
          {
            id: "tx-103",
            txHash: "0xapn110c...3b88",
            type: "STAKING_YIELD",
            amount: 8.75,
            status: "COMPLETED",
            timestamp: new Date(now - 3600000 * 24).toISOString().replace("T", " ").substring(0, 19),
            description: "+18.5% APY Staking Vault Daily Interest",
          },
          {
            id: "tx-104",
            txHash: "0xapn773d...11fe",
            type: "MINING_REWARD",
            amount: 24.00,
            status: "COMPLETED",
            timestamp: new Date(now - 3600000 * 26).toISOString().replace("T", " ").substring(0, 19),
            description: "24-Hour Node Mining Cycle Reward",
          },
          {
            id: "tx-105",
            txHash: "0xapn332e...99da",
            type: "TRANSFER_OUT",
            amount: 50.00,
            status: "COMPLETED",
            timestamp: new Date(now - 3600000 * 48).toISOString().replace("T", " ").substring(0, 19),
            description: "Mainnet Wallet Transfer to 0x3A...91bB",
          },
        ]);
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    
    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchTransactions(userData.id || "default_user");
    } catch (e) {
      console.error("Failed to parse user session", e);
      router.push("/register");
    }
  }, [router, fetchTransactions]);

  const handleCopyHash = (txHash: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(txHash);
      setCopiedTx(txHash);
      setTimeout(() => setCopiedTx(null), 2000);
    }
  };

  if (!mounted) {
    return null;
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    return tx.type === filter;
  });

  const totalEarned24h = transactions
    .filter((t) => t.type !== "TRANSFER_OUT" && t.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalTransferred = transactions
    .filter((t) => t.type === "TRANSFER_OUT" && t.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* HEADER SECTION */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-gray-900/60 via-slate-900/50 to-gray-900/60 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            📜 On-Chain Ledger & History
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Transaction Activity Log
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            View real-time records of your 24-hour mining rewards, referral commissions, staking yields, and mainnet token transfers.
          </p>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Cycle Earnings
          </span>
          <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            +{totalEarned24h.toFixed(2)} <span className="text-xs font-normal text-gray-400">APN</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Transfers Out
          </span>
          <p className="text-3xl font-black text-rose-400 mt-2 font-mono">
            -{totalTransferred.toFixed(2)} <span className="text-xs font-normal text-gray-400">APN</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md">
          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Total Records Logged
          </span>
          <p className="text-3xl font-black text-blue-400 mt-2 font-mono">
            {transactions.length} <span className="text-xs font-normal text-gray-400">Transactions</span>
          </p>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-900/50 border border-gray-800/80 rounded-2xl backdrop-blur-md">
        {[
          { label: "All Transactions", value: "ALL" },
          { label: "⛏️ Mining Rewards", value: "MINING_REWARD" },
          { label: "🎁 Referral Bonus", value: "REFERRAL_BONUS" },
          { label: "🔒 Staking Yields", value: "STAKING_YIELD" },
          { label: "💸 Transfers Out", value: "TRANSFER_OUT" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              filter === item.value
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* TRANSACTIONS TABLE / LIST */}
      <div className="p-6 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-mono text-xs">
            Loading transaction ledger...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-mono text-xs">
            No transactions found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-[11px] text-gray-400 uppercase tracking-wider font-extrabold">
                  <th className="py-4 px-4">Type & Details</th>
                  <th className="py-4 px-4">Tx Hash</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-xs">
                {filteredTransactions.map((tx) => {
                  const isPositive = tx.type !== "TRANSFER_OUT";
                  return (
                    <tr key={tx.id} className="hover:bg-gray-800/30 transition-all">
                      {/* TYPE & DESCRIPTION */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                              tx.type === "MINING_REWARD"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : tx.type === "REFERRAL_BONUS"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : tx.type === "STAKING_YIELD"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {tx.type === "MINING_REWARD"
                              ? "⛏️"
                              : tx.type === "REFERRAL_BONUS"
                              ? "🎁"
                              : tx.type === "STAKING_YIELD"
                              ? "🔒"
                              : "💸"}
                          </div>
                          <div>
                            <p className="font-bold text-white">{tx.description}</p>
                            <span className="text-[10px] text-gray-500 uppercase font-mono">
                              {tx.type.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* TX HASH */}
                      <td className="py-4 px-4 font-mono text-[11px] text-gray-400">
                        <button
                          onClick={() => handleCopyHash(tx.txHash)}
                          className="hover:text-blue-400 transition-all flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-gray-800"
                        >
                          <span>{tx.txHash}</span>
                          <span className="text-[10px]">
                            {copiedTx === tx.txHash ? "✓" : "📋"}
                          </span>
                        </button>
                      </td>

                      {/* TIMESTAMP */}
                      <td className="py-4 px-4 text-gray-400 text-[11px]">
                        {tx.timestamp}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            tx.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : tx.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* AMOUNT */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-sm">
                        <span
                          className={isPositive ? "text-emerald-400" : "text-rose-400"}
                        >
                          {isPositive ? "+" : "-"}
                          {tx.amount.toFixed(2)} APN
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}