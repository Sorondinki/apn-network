"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  // Dynamic Country Selection List
  const countryList = [
    "Select Country",
    "Nigeria",
    "Ghana",
    "Kenya",
    "South Africa",
    "Egypt",
    "United Arab Emirates",
    "United States",
    "United Kingdom",
    "Saudi Arabia",
    "India",
    "Malaysia",
    "Indonesia",
    "Canada",
    "Germany",
    "Other"
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    walletAddress: "",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("apn_user");
    if (!savedUser) {
      router.push("/register");
      return;
    }
    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setAvatar(userData.avatar || userData.avatarUrl || null);

      setFormData({
        fullName: userData.fullName || userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        country: userData.country || "",
        city: userData.city || "",
        walletAddress: userData.walletAddress || (userData.id
          ? `0xAPN${userData.id.substring(0, 8)}${userData.id.substring(userData.id.length - 8)}`
          : "0xAPN8f3A19B204C29e71"),
      });
    } catch (e) {
      console.error("Error loading user data from localStorage", e);
    }
  }, [router]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: formData.fullName,
          phone: formData.phone,
          country: formData.country,
          city: formData.city,
          avatarUrl: avatar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedUser = {
          ...user,
          ...data.user,
          fullName: formData.fullName,
          avatar: avatar,
          avatarUrl: avatar,
        };

        localStorage.setItem("apn_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("Profile details updated successfully!");
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while updating profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  // Check if current user is the Network Founder / Global Admin
  const isFounder = user?.email?.toLowerCase() === "contact.aprotech@gmail.com";

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-2 sm:px-4">
      {/* HEADER SECTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-gray-900/60 via-slate-900/50 to-gray-900/60 border border-gray-800/80 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            {isFounder ? "👑 Protocol Founder & Admin" : "⚡ Active Node Validator"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Account Details & Identification
          </h1>
          <p className="text-gray-400 text-xs max-w-md">
            Manage your personal profile, update contact information, and check your Web3 node performance status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AVATAR & BASIC BADGE CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-blue-500/30 bg-black overflow-hidden flex items-center justify-center shadow-2xl">
              {avatar ? (
                <img src={avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl sm:text-5xl">👤</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2.5 bg-blue-600 hover:bg-blue-500 rounded-full cursor-pointer text-white shadow-lg transition-all">
              ✏️
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{formData.fullName || (isFounder ? "Network Founder" : "APN Validator")}</h3>
            <p className="text-xs text-emerald-400 font-mono mt-1 truncate max-w-[200px] sm:max-w-xs">{formData.email}</p>
          </div>

          <div className="w-full pt-4 border-t border-gray-800/80 space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Account Role:</span>
              <span className={isFounder ? "text-amber-400 font-bold" : "text-blue-400 font-bold"}>
                {isFounder ? "Global Admin" : "Node Validator"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Node Status:</span>
              <span className="text-emerald-400 font-bold">Active Sync</span>
            </div>
            <div className="flex justify-between">
              <span>KYC Level:</span>
              <span className="text-amber-400 font-bold">Unverified</span>
            </div>
          </div>
        </div>

        {/* PERSONAL DETAILS FORM */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-6">
          <h3 className="text-xl font-bold text-white">Personal Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full bg-black/30 border border-gray-800/50 rounded-xl px-4 py-3 text-xs text-gray-500 font-mono cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234..."
                className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* DYNAMIC COUNTRY SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {countryList.map((c) => (
                  <option key={c} value={c === "Select Country" ? "" : c} className="bg-gray-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
                className="w-full bg-black/50 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Generated Wallet Address</label>
              <input
                type="text"
                readOnly
                value={formData.walletAddress}
                className="w-full bg-black/30 border border-gray-800/50 rounded-xl px-4 py-3 text-xs text-emerald-400 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/30"
          >
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </div>

      {/* DEDICATED VALIDATOR NODE PERFORMANCE PANEL */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gray-900/40 border border-gray-800/80 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
              🖥️ Node Validator Metrics
            </div>
            <h3 className="text-xl font-bold text-white">Your Mining Node Statistics</h3>
            <p className="text-xs text-gray-400 mt-1">
              Live operational metrics for your personal Web3 validator session on APN Network.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl">
            ● Node Online (99.8% Uptime)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Mining Hash Rate</p>
            <p className="text-xl font-black text-blue-400 font-mono mt-1">1.25 APN/hr</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Validation Consensus</p>
            <p className="text-xl font-black text-emerald-400 font-mono mt-1">DPoS Layer-1</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Total Blocks Validated</p>
            <p className="text-xl font-black text-amber-400 font-mono mt-1">1,420 Blocks</p>
          </div>
        </div>
      </div>

      {/* KYC IDENTITY VERIFICATION DIRECT BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-gray-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            🛡️ Identity Verification (KYC)
          </div>
          <h3 className="text-xl font-bold text-white">Unlock Mainnet Token Distribution</h3>
          <p className="text-xs text-gray-400 max-w-xl">
            Complete your Identity Verification (KYC) by uploading a valid government ID to qualify for mainnet token transfer and validator tier rewards.
          </p>
        </div>

        <Link
          href="/kyc"
          className="w-full md:w-auto text-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/40 whitespace-nowrap"
        >
          Proceed to KYC Portal →
        </Link>
      </div>
    </div>
  );
}