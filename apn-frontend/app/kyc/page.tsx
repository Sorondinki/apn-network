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
  const [user, setUser] = useState<{ id: string; email: string; name?: string; fullName?: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState("National Identification Number (NIN)");
  const [docNumber, setDocNumber] = useState("");
  const [docImage, setDocImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [verificationType, setVerificationType] = useState<"FREE" | "FAST_TRACK">("FREE");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<"NOT_SUBMITTED" | "PENDING" | "VERIFIED">("NOT_SUBMITTED");

  // In-page Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchKycStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/kyc/status?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.status) {
        setKycStatus(data.status);
      }
    } catch (err) {
      console.error("Error checking verification state:", err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.fullName || parsed.name) {
          setFullName(parsed.fullName || parsed.name);
        }
        fetchKycStatus(parsed.id);
      } catch (e) {
        console.error("User session parse error", e);
        setPageLoading(false);
      }
    } else {
      setPageLoading(false);
    }
  }, []);

  // Compression helper to prevent Next.js 413 Payload Too Large crash
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1024;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedUrl);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDocImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setDocImage(compressed);
      } catch (err) {
        console.error("Image compression error:", err);
        showToast("error", "Image compression failed. Please choose another image.");
      }
    }
  };

  const handleSelfieImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setSelfieImage(compressed);
      } catch (err) {
        console.error("Image compression error:", err);
        showToast("error", "Image compression failed. Please choose another image.");
      }
    }
  };

  // Preserved for future payment integration/switch
  const handlePaystackPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kyc/paystack-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email || "user@apnprotocol.ng",
          amount: 1000,
        }),
      });

      const data = await res.json();
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        showToast("error", "Payment Gateway Offline: " + (data.message || "Please submit using Free Verification."));
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Payment gateway connection error.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.id) {
      showToast("error", "Please log in to your account before submitting KYC.");
      router.push("/register");
      return;
    }

    if (!docImage || !selfieImage) {
      showToast("error", "Please upload both your ID document photo and selfie photo before submitting.");
      return;
    }

    // Guard: Prevent submissions through fast-track while channel is disabled
    if (verificationType === "FAST_TRACK") {
      showToast("error", "Fast-Track VIP gateway is currently closed. Please switch to Free Standard Verification.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
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
        showToast("success", "KYC documents uploaded successfully!");
        setKycStatus("PENDING");
      } else {
        showToast("error", data.message || "KYC submission failed. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      console.error("KYC Submission error:", err);
      showToast("error", "Network error processing your request. Please ensure images are clear and try again.");
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-xs font-mono">Syncing KYC Protocol State...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 font-sans relative">
      {/* GLOBAL FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-md transition-all animate-fade-in text-xs sm:text-sm font-semibold ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-300"
              : "bg-rose-950/90 border-rose-500 text-rose-300"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

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

          <div className="bg-black/60 p-4 rounded-2xl border border-emerald-500/40 flex items-center gap-3 w-full sm:w-auto shadow-xl">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400 text-emerald-400 font-bold text-lg">
              🎁
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-mono uppercase">Guaranteed Completion Bonus</div>
              <div className="text-sm font-extrabold text-emerald-400">+50 $APN Tokens 🚀</div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: VERIFIED ACCOUNT */}
      {kycStatus === "VERIFIED" ? (
        <div className="p-8 sm:p-12 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-gray-950 to-black shadow-2xl text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-500/20">
              🛡️
            </div>
            <span className="absolute bottom-0 right-1 w-7 h-7 bg-emerald-500 rounded-full border-2 border-gray-950 flex items-center justify-center text-xs text-black font-black">
              ✓
            </span>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide">
              VERIFIED APN CITIZEN
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Identity Verified Successfully</h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
              Your credentials have been authenticated. All Tier-1 network benefits, mining withdrawals, and peer-to-peer transfers are fully unlocked.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-mono uppercase text-gray-400">KYC Status</span>
              <p className="text-sm font-extrabold text-emerald-400">Verified ✅</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-mono uppercase text-gray-400">P2P Transfers</span>
              <p className="text-sm font-extrabold text-white">Active & Enabled</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-mono uppercase text-gray-400">Badge Tier</span>
              <p className="text-sm font-extrabold text-blue-400">Tier 1 Sovereign</p>
            </div>
          </div>
        </div>
      ) : kycStatus === "PENDING" ? (
        /* VIEW 2: UNDER REVIEW (48 - 72 WORKING HOURS) */
        <div className="p-8 sm:p-12 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-gray-950 to-black shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center mx-auto text-3xl animate-pulse">
            ⏳
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wide">
              UNDER REVIEW
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Application Pending Verification</h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
              Your identity documents have been submitted to the compliance registry. Your application is currently awaiting validation.
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 rounded-2xl bg-black/70 border border-amber-500/30 text-center space-y-2">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">Estimated Turnaround Time</span>
            <span className="text-xl font-black text-amber-400 block tracking-tight">48 - 72 Working Hours</span>
            <p className="text-[11px] text-gray-400">
              No further action is required from your side. Your badge and +50 $APN allocation will be dispatched automatically upon confirmation.
            </p>
          </div>
        </div>
      ) : (
        /* VIEW 3: KYC SUBMISSION FORM */
        <>
          {/* VERIFICATION OPTIONS SELECTOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION 1: 100% FREE (ACTIVE) */}
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
                Processed manually within 48 to 72 working hours. Full access to +50 $APN Bonus & Verified Badge upon approval.
              </p>
            </div>

            {/* OPTION 2: FAST-TRACK VIP (CLOSED / UNDER MAINTENANCE) */}
            <div
              onClick={() => {
                showToast(
                  "error",
                  "Fast-Track VIP gateway is temporarily offline for maintenance. Please proceed with Option 1 (100% Free Verification)."
                );
              }}
              className="p-5 rounded-2xl border border-gray-800/80 bg-gray-950/60 opacity-65 cursor-not-allowed relative overflow-hidden group transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase text-gray-500">Option 2: Fast-Track VIP</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                  Temporarily Closed
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-300 flex items-center gap-1.5 line-through">
                Instant VIP Verification ⚡
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Direct automated card gateway is temporarily paused for compliance upgrades. Please submit your application via Option 1 completely free.
              </p>
              <div className="mt-2 text-[10px] text-amber-400 font-mono flex items-center gap-1">
                <span>🔒 Gateway Maintenance • Switch to Free Verification</span>
              </div>
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

              {/*<button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-white font-extrabold rounded-xl transition-all shadow-xl disabled:opacity-50 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-950/50"
              >
                {loading ? (
                  <span>Processing Verification Route... ⏳</span>
                ) : (
                <span>Submit Free Verification & Claim 50 $APN 🚀</span>
                )}
              </button>*/}
            </form>
          </div>
        </>
      )}

      <div className="w-full flex flex-col items-center justify-center pt-4">
        <AadsBanner />
      </div>
    </div>
  );
 }
