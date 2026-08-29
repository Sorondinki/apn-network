"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const AadsBanner = dynamic(() => import("../components/AadsBanner"), {
  ssr: false,
});

export default function KYCPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState("National Identification Number (NIN)");
  const [docNumber, setDocNumber] = useState("");
  const [docImage, setDocImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [verificationType, setVerificationType] = useState<"FREE" | "FAST_TRACK">("FREE");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.name) setFullName(parsed.name);
      } catch (e) {
        console.error("User session parse error", e);
      }
    }
  }, []);

  const handleDocImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDocImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelfieImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePaystackPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kyc/paystack-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "anonymous_user",
          email: user?.email || "user@apnnetwork.com",
          amount: 1000,
        }),
      });

      const data = await res.json();
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert("Paystack Initialization Failed: " + (data.message || "Try again later"));
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Payment gateway connection error.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docImage || !selfieImage) {
      alert("Please upload both your ID document photo and selfie photo before submitting.");
      return;
    }

    if (verificationType === "FAST_TRACK") {
      await handlePaystackPayment();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "anonymous_user",
          fullName,
          docType,
          docNumber,
          docImage,
          selfieImage,
          verificationType: "FREE",
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        setResultMessage(data.message);
        setSubmitted(true);
      } else {
        alert(data.message || "KYC submission failed");
      }
    } catch (err) {
      setLoading(false);
      console.error("KYC Submission error:", err);
      alert("Network error processing your request.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6">
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 border border-blue-800/40 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase">
              🛡️ APN Protocol Identity Guard
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              APN KYC & Verification Hub
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg">
              Verify your identity to claim your free reward, unlock P2P transfers, and secure your mining allocations.
            </p>
          </div>

          <div className="bg-black/60 p-4 rounded-2xl border border-emerald-500/40 flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400 text-emerald-400 font-bold text-lg">
              🎁
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-mono uppercase">Guaranteed Completion Bonus</div>
              <div className="text-sm font-extrabold text-emerald-400">+50 APN Tokens 🚀</div>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFICATION OPTIONS SELECTOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* FREE OPTION */}
        <div
          onClick={() => setVerificationType("FREE")}
          className={`p-5 rounded-2xl cursor-pointer border transition-all ${
            verificationType === "FREE"
              ? "bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/30"
              : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase text-blue-400">Option 1: Standard</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">100% FREE</span>
          </div>
          <h3 className="text-base font-bold text-white">Free Standard Verification</h3>
          <p className="text-xs text-gray-400 mt-1">
            Processed manually within 7 to 14 days. Full access to +50 APN Bonus & Verified Badge upon approval.
          </p>
        </div>

        {/* FAST-TRACK OPTION */}
        <div
          onClick={() => setVerificationType("FAST_TRACK")}
          className={`p-5 rounded-2xl cursor-pointer border transition-all ${
            verificationType === "FAST_TRACK"
              ? "bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30"
              : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase text-amber-400">Option 2: Fast-Track VIP</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">₦1,000 Paystack</span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
            Instant VIP Verification ⚡
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Automated instant check in 5 seconds via Paystack ID gateway. Grants Tier 1 Priority Status.
          </p>
        </div>
      </div>

      {/* BENEFIT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800/80 flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h4 className="text-xs font-bold text-white">Sybil & Bot Protection</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Ensures real ecosystem distribution and asset protection.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800/80 flex items-start gap-3">
          <span className="text-2xl">🔄</span>
          <div>
            <h4 className="text-xs font-bold text-white">P2P Gateway Unlocked</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Unlocks internal peer-to-peer token transfer abilities.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800/80 flex items-start gap-3">
          <span className="text-2xl">🔵</span>
          <div>
            <h4 className="text-xs font-bold text-white">Verified Badge 🔵</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Displays verified checkmark on your APN network ID profile.</p>
          </div>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <div className="p-6 sm:p-8 rounded-3xl border border-gray-800 bg-gray-950/80 shadow-2xl backdrop-blur-md">
        {submitted ? (
          <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl animate-bounce">
              🎉
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-400">KYC Request Logged!</h3>
            <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
              {resultMessage || "Your KYC details have been transmitted successfully. Your 50 APN reward will be credited upon system verification."}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition"
              >
                Return to Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-300 mb-2 block">Full Legal Name</label>
              <input
                type="text"
                placeholder="e.g. David Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full p-4 bg-black/60 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 mb-2 block">Document Type</label>
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
                <label className="text-xs font-bold text-gray-300 mb-2 block">Document ID Number</label>
                <input
                  type="text"
                  placeholder="Enter document number here..."
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  required
                  className="w-full p-4 bg-black/60 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm font-mono"
                />
              </div>
            </div>

            {/* ID UPLOAD */}
            <div>
              <label className="text-xs font-bold text-gray-300 mb-2 block">
                1. Upload Identity Document (Front Photo)
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
                    <p className="text-xs text-gray-400">Click to upload your ID document front photo</p>
                    <p className="text-[10px] text-gray-600">PNG, JPG or WEBP (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* SELFIE UPLOAD */}
            <div>
              <label className="text-xs font-bold text-gray-300 mb-2 block">
                2. Live Selfie Photo Verification
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
                    <p className="text-xs text-gray-400">Upload live face selfie photo</p>
                    <p className="text-[10px] text-gray-600">Ensure clear lighting without dark glasses</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white font-extrabold rounded-xl transition-all shadow-xl disabled:opacity-50 text-sm flex items-center justify-center gap-2 ${
                verificationType === "FAST_TRACK"
                  ? "bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 shadow-amber-950/50"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-950/50"
              }`}
            >
              {loading ? (
                <span>Processing Verification Route... ⏳</span>
              ) : verificationType === "FAST_TRACK" ? (
                <span>Pay ₦1,000 via Paystack & Fast-Track (Instant 5s Approval) and Claim 100 APN⚡</span>
              ) : (
                <span>Submit Free Verification & Claim 50 APN 🚀</span>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="w-full flex flex-col items-center justify-center pt-4">
        <AadsBanner />
      </div>
    </div>
  );
}