// app/explorer/page.tsx
"use client";
import { useState } from "react";

export default function ExplorerPage() {
  const [search, setSearch] = useState("");

  const mockBlocks = [
    { height: 10423, hash: "0x8f2a...e910", txs: 42, validator: "Node-Kano-01", time: "12 secs ago" },
    { height: 10422, hash: "0x3c11...88ab", txs: 18, validator: "Node-Abuja-04", time: "28 secs ago" },
    { height: 10421, hash: "0x7d99...11f3", txs: 95, validator: "Node-Lagos-02", time: "45 secs ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
        <h1 className="text-3xl font-extrabold text-white">🌐 APN Block Explorer</h1>
        <p className="text-gray-400 text-sm mt-1">
          Search real-time blocks, consensus states, and validator activities.
        </p>

        <div className="mt-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Txn Hash / Wallet Address / Block Height..."
            className="w-full p-4 bg-black/60 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* LATEST BLOCKS TABLE */}
      <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">Latest Validated Blocks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-black/60 text-xs text-gray-400 uppercase">
              <tr>
                <th className="p-3">Block Height</th>
                <th className="p-3">Block Hash</th>
                <th className="p-3">Transactions</th>
                <th className="p-3">Validator Node</th>
                <th className="p-3">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mockBlocks.map((blk) => (
                <tr key={blk.height} className="hover:bg-gray-800/50 transition-colors">
                  <td className="p-3 text-blue-400 font-bold">#{blk.height}</td>
                  <td className="p-3 font-mono text-xs">{blk.hash}</td>
                  <td className="p-3">{blk.txs} Txns</td>
                  <td className="p-3 text-emerald-400 font-semibold">{blk.validator}</td>
                  <td className="p-3 text-gray-500">{blk.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}