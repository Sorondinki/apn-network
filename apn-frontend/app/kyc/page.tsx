// app/kyc/page.tsx
"use client";
import { useState } from "react";

export default function KYCPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800">
        <h1 className="text-3xl font-extrabold text-white">🛡️ Identity Verification (KYC)</h1>
        <p className="text-gray-400 text-sm mt-1">
          Complete Level-1 identity validation to unlock token withdrawals and validator privileges.
        </p>
      </div>

      <div className="glass-card p-8 rounded-2xl border border-gray-800 max-w-2xl bg-gray-900/40">
        {submitted ? (
          <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 text-center space-y-3">
            <span className="text-4xl">🎉</span>
            <h3 className="text-xl font-bold text-green-400">KYC Submitted Successfully</h3>
            <p className="text-xs text-gray-400">
              Your identity documents are currently under automated verification. Approval typically takes 5–10 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Full Legal Name</label>
              <input
                type="text"
                placeholder="e.g. Jamilu Abubakar"
                required
                className="w-full p-4 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Document Type</label>
              <select className="w-full p-4 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500">
                <option>National Identification Number (NIN)</option>
                <option>International Passport</option>
                <option>Driver's License</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Document Identification Number</label>
              <input
                type="text"
                placeholder="Enter document number..."
                required
                className="w-full p-4 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/30"
            >
              Submit Verification Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}