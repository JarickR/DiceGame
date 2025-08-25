// src/ui/DebugToggle.jsx
import React, { useEffect, useState } from "react";

/**
 * Floating button that toggles global debug logging for helper components.
 * It flips localStorage.dicearena_debug between "1" and "0" and reloads the page,
 * so hooks inside ClassIcon / SpellIcon / EnemyIcon / SpriteThumb pick it up.
 */
export default function DebugToggle({
  right = 12,
  bottom = 12,
  zIndex = 1200,
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem("dicearena_debug") === "1");
    } catch {
      setEnabled(false);
    }
  }, []);

  const toggle = () => {
    try {
      const next = !(localStorage.getItem("dicearena_debug") === "1");
      if (next) localStorage.setItem("dicearena_debug", "1");
      else localStorage.removeItem("dicearena_debug");
      // Force a reload so all components re-read the flag on mount
      window.location.reload();
    } catch (e) {
      console.warn("DebugToggle: failed to toggle debug flag", e);
    }
  };

  return (
    <button
      onClick={toggle}
      title={enabled ? "Debug ON — click to turn OFF" : "Debug OFF — click to turn ON"}
      style={{
        position: "fixed",
        right,
        bottom,
        zIndex,
        background: enabled
          ? "linear-gradient(180deg, #2cc38a, #1ea373)"
          : "linear-gradient(180deg, #36465f, #2a374d)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,.15)",
        padding: "10px 12px",
        borderRadius: 12,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 10px 40px rgba(0,0,0,.45)",
      }}
    >
      {enabled ? "Debug: ON" : "Debug: OFF"}
    </button>
  );
}
