// src/ui/useDebug.js
import { useMemo } from "react";

/**
 * Lightweight debug helper.
 *
 * Usage:
 *   const { enabled, log } = useDebug();
 *   log("ClassIcon mount", { name, index, rows, cols });
 *
 * Toggle globally by:
 *   - setting ?debug=1 in the URL, or
 *   - setting localStorage.setItem('dicearena_debug','1')
 */
export default function useDebug() {
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (window.location.search.includes("debug=1")) return true;
    try {
      return localStorage.getItem("dicearena_debug") === "1";
    } catch {
      return false;
    }
  }, []);

  const log = (...args) => {
    if (!enabled) return;
    // Namespaced so it’s easy to filter in DevTools
    console.log("[DA-DEBUG]", ...args);
  };

  return { enabled, log };
}
