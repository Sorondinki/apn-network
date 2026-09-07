"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AUTHORIZED_ENGINEERS = [
  "contact.aprotech@gmail.com",
  "idrissharif30@gmail.com",
  "kingibrahimsharif@gmail.com",
];

interface KYCItem {
  id: string;
  userId: string;
  fullName: string;
  docType: string;
  docNumber: string;
  verificationType: string;
  status: string;
  createdAt: string;
}

export default function AdminKYCApprovalsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<KYCItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Lightweight on-demand image viewer
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // In-page Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // 1. Get exact total pending count without loading payloads
      const { count } = await supabase
        .from("KYC_Submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING");

      setPendingCount(count || 0);

      // 2. Fetch only textual metadata with a limit of 25 to avoid timeout
      const { data, error } = await supabase
        .from("KYC_Submissions")
        .select("id, userId, fullName, docType, docNumber, verificationType, status, createdAt")
        .eq("status", "PENDING")
        .order("createdAt", { ascending: false })
        .limit(25);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err: any) {
      showToast("error", err.message || "Query timeout. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        const email = parsed.email ? parsed.email.trim().toLowerCase() : "";

        if (!AUTHORIZED_ENGINEERS.includes(email)) {
          router.push("/dashboard");
          return;
        }

        fetchSubmissions();
      } catch (err) {
        console.error(err);
        router.push("/dashboard");
      }
    } else {
      router.push("/login");
    }
  }, []);

  // Fetch heavy image only when an engineer clicks View Photo
  const handleViewImage = async (id: string, imageType: "docImage" | "selfieImage") => {
    setImageLoading(true);
    try {
      const { data, error } = await supabase
        .from("KYC_Submissions")
        .select(imageType)
        .eq("id", id)
        .single();

      if (error || !data || !(data as any)[imageType]) {
        showToast("error", "Image file not found on record.");
      } else {
        setPreviewImage((data as any)[imageType]);
      }
    } catch (err) {
      showToast("error", "Failed to retrieve compressed image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleAction = async (item: KYCItem, action: "APPROVE" | "REJECT") => {
    setProcessingId(item.id);
    try {
      const res = await fetch("/api/admin/kyc-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: item.id,
          userId: item.userId,
          action,
          adminEmail: currentUser?.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", data.message);
        setSubmissions((prev) => prev.filter((sub) => sub.id !== item.id));
        setPendingCount((prev) => Math.max(0, prev - 1));
      } else {
        showToast("error", data.message || "Action failed.");
      }
    } catch (err: any) {
      showToast("error", "Network error processing request.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* GLOBAL TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-md transition-all text-xs sm:text-sm font-semibold ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-300"
              : "bg-rose-950/90 border-rose-500 text-rose-300"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* FULL IMAGE MODAL */}
      {(previewImage || imageLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          onClick={() => {
            if (!imageLoading) setPreviewImage(null);
          }}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-rose-400 text-sm font-bold bg-gray-900/80 px-4 py-1.5 rounded-full border border-gray-700"
            >
              ✕ Close Preview
            </button>
            {imageLoading ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-gray-400">Loading full image payload...</p>
              </div>
            ) : (
              <img
                src={previewImage!}
                alt="Verification Proof"
                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl border border-gray-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0b0f19] border border-gray-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
              Engineering Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">KYC Approvals & Inspection</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Showing top batch of 25 pending applications out of {pendingCount}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubmissions}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition"
          >
            🔄 Refresh
          </button>
          <div className="px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold">
            Pending Queue: {pendingCount}
          </div>
        </div>
      </div>

      {/* CONTENT LIST */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-gray-500">Querying lightweight queue...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-gray-800 bg-[#0b0f19] space-y-3">
          <div className="text-3xl">🛡️</div>
          <h3 className="text-base font-bold text-white">Queue Cleared</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            There are no pending identity documents requiring manual review at this moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-5 sm:p-6 rounded-2xl bg-[#0b0f19] border border-gray-800/80 hover:border-gray-700 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* DETAILS */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{sub.fullName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-950 border border-blue-500/30 text-blue-400">
                    {sub.verificationType}
                  </span>
                  {sub.createdAt && (
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(sub.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/40 p-2 rounded-lg border border-gray-800">
                    <span className="text-gray-500 text-[10px] block uppercase font-mono">Document Type</span>
                    <span className="text-gray-300 font-medium">{sub.docType}</span>
                  </div>
                  <div className="bg-black/40 p-2 rounded-lg border border-gray-800">
                    <span className="text-gray-500 text-[10px] block uppercase font-mono">Document ID</span>
                    <span className="text-gray-300 font-mono font-medium">{sub.docNumber}</span>
                  </div>
                </div>

                {/* ON-DEMAND IMAGE BUTTONS */}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => handleViewImage(sub.id, "docImage")}
                    className="flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-950/30 border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-900/40 transition"
                  >
                    <span>📄</span> View ID Photo
                  </button>

                  <button
                    type="button"
                    onClick={() => handleViewImage(sub.id, "selfieImage")}
                    className="flex items-center gap-2 text-xs font-semibold text-purple-400 bg-purple-950/30 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-900/40 transition"
                  >
                    <span>🤳</span> View Selfie
                  </button>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex sm:flex-col md:flex-row items-center gap-3 shrink-0">
                <button
                  disabled={processingId === sub.id}
                  onClick={() => handleAction(sub, "REJECT")}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 hover:text-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>✕</span> Reject
                </button>

                <button
                  disabled={processingId === sub.id}
                  onClick={() => handleAction(sub, "APPROVE")}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  <span>✓</span> Approve (+50 $APN)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
        
