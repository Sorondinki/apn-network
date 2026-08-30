"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import AadsBanner from "../components/AadsBanner";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Samo current user ID daga local storage ko kiran session
    const storedUserId = localStorage.getItem("userId"); 
    if (storedUserId) {
      setUserId(storedUserId);
    }

    loadTasks(storedUserId);
  }, []);

  const loadTasks = (uid: string | null) => {
    setIsLoading(true);
    const url = uid ? `/api/tasks?userId=${uid}` : "/api/tasks";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setTasks(data.tasks);
      })
      .catch((err) => console.error("Error loading tasks:", err))
      .finally(() => setIsLoading(false));
  };

  const handleTaskClick = async (task: any) => {
    // Buɗe shafin link ɗin aikin a sabon tab
    window.open(task.link, "_blank");

    if (!userId) {
      alert("Don Allah ka shiga asusunka (Login) domin karɓar ladan APN.");
      return;
    }

    if (task.isCompleted) return;

    try {
      setSubmittingId(task.id);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, taskId: task.id }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        // Sabunta jerin ayyuka
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, isCompleted: true } : t))
        );
      } else {
        alert(data.error || "Akwai matsala wajen yi amsa ladan.");
      }
    } catch (err) {
      console.error(err);
      alert("Akwai matsala wajen haɗawa da server.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 selection:bg-emerald-500 selection:text-white select-none">
      
      {/* HEADER HERO SECTION */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-gray-950/90 border border-gray-800/80 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            ⚡ Web3 Community Tasks
          </span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">APN Ecosystem Tasks</h1>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
          Complete verified network missions and community campaigns to earn instant APN Token bonuses.
        </p>
      </div>

      {/* A-ADS MONETIZATION BANNER */}
      <AadsBanner />

      {/* TASKS LIST GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading active APN tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-gray-900/40 border border-gray-800 text-center space-y-2">
          <p className="text-sm text-gray-400 font-medium">No active tasks available right now.</p>
          <p className="text-xs text-gray-600">Check back soon for new bounty distributions!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 hover:border-emerald-500/30 transition-all duration-300 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                    {task.category || "General"}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-emerald-400">
                    <Image
                      src="/images/apn-token512x512.png"
                      alt="APN Logo"
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                    <span>+{task.reward} APN</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">{task.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{task.description}</p>
              </div>

              <button
                onClick={() => handleTaskClick(task)}
                disabled={task.isCompleted || submittingId === task.id}
                className={`w-full text-center py-3 font-bold rounded-xl text-xs transition-all duration-200 shadow-lg ${
                  task.isCompleted
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-[0.98]"
                }`}
              >
                {submittingId === task.id
                  ? "Processing..."
                  : task.isCompleted
                  ? "Completed ✅"
                  : "Perform Task & Earn 🚀"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
