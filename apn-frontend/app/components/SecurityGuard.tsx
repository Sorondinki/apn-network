"use client";

import { useEffect } from "react";

export default function SecurityGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u"))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    const devToolsInterval = setInterval(() => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.clear();
      }
    }, 2000);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, []);

  return <>{children}</>;
}