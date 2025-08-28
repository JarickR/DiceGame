// src/ui/RollPopup.jsx
import React, { useEffect, useRef, useState } from "react";
import ClassIcon from "./ClassIcon";
import SpellIcon from "./SpellIcon";

/**
 * Props:
 *  - face: {kind:'class'|'spell'|'blank'|'upgrade', ...} | null
 *  - version: number  // bump this number to restart the animation
 *  - onClose: () => void
 *
 * Behavior:
 *  - When version changes, we run a short "spin" cycle then reveal the face.
 *  - Auto closes ~1.6s after the spin starts (or when user clicks OK).
 */
export default function RollPopup({ face, version = 0, onClose }) {
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const spinTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const spinnerTickRef = useRef(null);
  const [tick, setTick] = useState(0); // for the little spinner shim

  // Restart animation every time `version` changes (and when a face is present)
  useEffect(() => {
    // cleanup any prior timers
    clearTimers();

    if (!face) return;

    // start a new cycle
    setShowResult(false);
    setSpinning(true);

    // tiny spinner loop
    spinnerTickRef.current = setInterval(() => {
      setTick((t) => (t + 1) % 6);
    }, 60);

    // after ~900ms, reveal the result
    spinTimerRef.current = setTimeout(() => {
      setSpinning(false);
      setShowResult(true);
    }, 900);

    // after ~1600ms total, auto-close
    closeTimerRef.current = setTimeout(() => {
      if (onClose) onClose();
    }, 1600);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, face?.kind]); // re-run when version changes (or face type changes)

  const clearTimers = () => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (spinnerTickRef.current) clearInterval(spinnerTickRef.current);
    spinTimerRef.current = null;
    closeTimerRef.current = null;
    spinnerTickRef.current = null;
  };

  if (!face) return null;

  // Simple spinner visuals (you can replace with whatever)
  const spinnerDot = ".".repeat((tick % 3) + 1);

  const renderFace = () => {
    if (spinning) {
      return (
        <div
          style={{
            width: 160,
            height: 120,
            borderRadius: 14,
            background: "rgba(255,255,255,.06)",
            border: "1px dashed rgba(255,255,255,.18)",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            color: "rgba(255,255,255,.8)",
          }}
        >
          Spinning{spinnerDot}
        </div>
      );
    }

    // Final result (face)
    const card = (
      <div
        style={{
          width: 160,
          height: 120,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.12)",
          boxShadow: showResult
            ? "0 0 0 4px rgba(255, 215, 0, .45), 0 0 24px rgba(255,215,0,.25)"
            : "none",
          transition: "box-shadow 180ms ease",
        }}
      >
        {face.kind === "class" && (
          <ClassIcon name={face.classId} size={84} radius={12} />
        )}
        {face.kind === "spell" && (
          <SpellIcon tier={face.spell.tier} name={face.spell.name} size={84} radius={12} />
        )}
        {face.kind === "upgrade" && (
          <SpellIcon upgrade size={84} radius={12} />
        )}
        {face.kind === "blank" && (
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 12,
              border: "2px dashed rgba(255,255,255,.25)",
              display: "grid",
              placeItems: "center",
              color: "rgba(255,255,255,.7)",
              fontWeight: 800,
            }}
          >
            Blank
          </div>
        )}
      </div>
    );

    return card;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
      }}
      onClick={(e) => {
        // click outside to close
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: "calc(100vw - 24px)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,.12)",
          background: "rgba(18,18,22,.96)",
          color: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,.45)",
          padding: 18,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          Rolling…
        </div>

        <div
          style={{
            display: "grid",
            placeItems: "center",
            padding: 16,
            borderRadius: 12,
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)",
            minHeight: 150,
          }}
        >
          {renderFace()}
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => onClose && onClose()}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.2)",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
