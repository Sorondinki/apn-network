"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamic import for A-ADS Banner (Client-side rendering only)
const AadsBanner = dynamic(() => import("../../components/AadsBanner"), {
  ssr: false,
});

export default function KYCPage() {
  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState("National Identification Number (NIN)");
  const [docNumber, setDocNumber] = useState("");
  const [docImage, setDocImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Document Image Upload
  const handleDocImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Selfie Image Upload
  const handleSelfieImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfieImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docImage || !selfieImage) {
      alert("Tabbatar ka dora hoton katin shaidarka da kuma hoton fuskarka (Selfie) kafin turawa.");
      return;
    }
    setLoading(true);

    // Simulation of API request submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/80 via-gray-900 to-indigo-950/80 border border-blue-800/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase">
                Identity Validation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              🛡️ APN KYC & Verification
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Tabbatar da adadin amintakar asusunka domin kare network dinmu daga fake accounts da bude sabbin damammaki.
            </p>
          </div>

          <div className="bg-black/50 p-4 rounded-2xl border border-blue-500/30 flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center border border-blue-400 text-white font-bold">
                APN
              </div>
              <svg
                className="w-4 h-4 text-blue-500 absolute -bottom-1 -right-1 bg-black rounded-full"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-400">KYC Reward</div>
              <div className="text-sm font-bold text-emerald-400">+50 APN Tokens 🎁</div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Incentives & Benefits Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-start gap-3">
          <span className="text-2xl">🚫</span>
          <div>
            <h4 className="text-xs font-bold text-white">Anti-Bot & Fake Account</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Tabbatar da ainihin mutane kadai ke hakar APN.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-start gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="text-xs font-bold text-white">Unlock P2P Gateway</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Yarda ayi musayar tokens tsakanin mambobi P2P.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-start gap-3">
          <span className="text-2xl">🔵</span>
          <div>
            <h4 className="text-xs font-bold text-white">Verified Blue Tick Badge</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Samun blue checkmark a profile dinka.</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-gray-800 bg-gray-950/70 shadow-2xl">
        {submitted ? (
          <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl animate-bounce">
              🎉
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-400">KYC Request Submitted!</h3>
            <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
              An tura bayanan shaidarka zuwa tsarin APN Validator System. Za a tabbatar da bayanka kuma a baka ladanka na <span className="text-emerald-400 font-bold">50 APN</span> gami da <span className="text-blue-400 font-bold">Verified Blue Tick Badge</span> 🔵 tsakanin minti 5 zuwa awa 24.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition"
              >
                Kalli Bayanan KYC ɗinka
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-300 mb-2 block">Suna Cikakke (Full Legal Name)</label>
              <input
                type="text"
                placeholder="misali: Jamilu Abubakar Sadiq"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full p-4 bg-black/60 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 mb-2 block">Irin Katin Shaida (Document Type)</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-4 bg-black/60 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option>National Identification Number (NIN / National ID)</option>
                  <option>International Passport</option>
                  <option>Driver's License</option>
                  <option>Voter's Card (PVC)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-2 block">Lamba Katin (Document ID Number)</label>
                <input
                  type="text"
                  placeholder="Saka lambar katin nan..."
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  required
                  className="w-full p-4 bg-black/60 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>
            </div>

            {/* Document Front Photo Upload */}
            <div>
              <label className="text-xs font-bold text-gray-300 mb-2 block">
                1. Dora Hoton Katin Shaida (Document Front Photo)
              </label>
              <div className="border-2 border-dashed border-gray-800 hover:border-blue-500/50 rounded-2xl p-4 bg-black/40 text-center transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDocImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required={!docImage}
                />
                {docImage ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden">
                    <Image src={docImage} alt="Document Preview" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <span className="text-3xl">📄</span>
                    <p className="text-xs text-gray-400">Danna nan domin dora hoton katin shaidarka (Front)</p>
                    <p className="text-[10px] text-gray-600">PNG, JPG ko WEBP (Mafi yawa 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selfie Verification Upload */}
            <div>
              <label className="text-xs font-bold text-gray-300 mb-2 block">
                2. Dora Hoton Fuskarka (Live Selfie Verification)
              </label>
              <div className="border-2 border-dashed border-gray-800 hover:border-blue-500/50 rounded-2xl p-4 bg-black/40 text-center transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required={!selfieImage}
                />
                {selfieImage ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden">
                    <Image src={selfieImage} alt="Selfie Preview" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <span className="text-3xl">🤳</span>
                    <p className="text-xs text-gray-400">Dora hoton fuskarka (Selfie photo)</p>
                    <p className="text-[10px] text-gray-600">Tabbatar fuskarka tana fito radau babu tabarau mai duhu</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all shadow-xl shadow-blue-950/50 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Encrypting & Transmitting Data... ⏳</span>
              ) : (
                <span>Submit Verification & Claim 50 APN 🚀</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* A-ADS Embedded Banner Section */}
      <div className="w-full flex flex-col items-center justify-center pt-4">
        <AadsBanner />
      </div>
    </div>
  );
}