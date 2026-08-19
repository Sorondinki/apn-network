// app/tasks/page.tsx
"use client";
import { useState, useEffect } from "react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    // Fetching Active Tasks
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setTasks(data.tasks);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="p-8 rounded-3xl bg-gray-900/50 border border-gray-800 backdrop-blur-xl">
        <h1 className="text-3xl font-black text-white">⚡ APN Network Tasks</h1>
        <p className="text-gray-400 text-xs mt-1">Complete these tasks to earn instant APN Token rewards directly into your balance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {task.category}
              </span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                +{task.reward} APN
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{task.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{task.description}</p>
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl text-xs transition shadow-lg shadow-emerald-900/30"
            >
              Perform Task 🚀
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}