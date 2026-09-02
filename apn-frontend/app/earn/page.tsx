"use client";
import { useEffect, useState } from "react";

export default function EarnPage() {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Zakuyi amfani da ID na user dake adane a localStorage ko auth state
    const savedUser = localStorage.getItem("apn_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.id) setUserId(parsed.id);
      } catch (e) {
        console.error("Error loading user state", e);
      }
    }
  }, []);

  // Direct Link dinka na CPAlead
  const BASE_URL = "https://www.cdnflair.com/wall/GbzJ";
  
  // Haɗa subid idan akwai user ID don gane wanda ya kammala task
  const iframeSrc = userId ? `${BASE_URL}?subid=${userId}` : BASE_URL;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/80 via-indigo-900/70 to-purple-900/80 p-6 rounded-3xl border border-blue-500/30 backdrop-blur-xl shadow-2xl">
        <h1 className="text-2xl font-black tracking-tight">⚡ Earn APN Tokens</h1>
        <p className="text-xs text-gray-300 mt-1">
          Complete verified offers and micro-tasks below to instantly credit your wallet.
        </p>
      </div>

      {/* CPAlead Offerwall Frame */}
      <div className="w-full h-[720px] bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
        <iframe
          src={iframeSrc}
          className="w-full h-full border-none"
          title="APN Offerwall"
          sandbox="allow-popups allow-same-origin allow-scripts allow-forms allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
