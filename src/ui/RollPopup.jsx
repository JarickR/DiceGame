// src/ui/RollPopup.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ClassIcon from "./ClassIcon";
import SpellIcon from "./SpellIcon";
import UpgradeIcon from "./UpgradeIcon";

// One clean spin
const ROLL_SPIN_TOTAL_MS = 420;
const ROLL_SPIN_FRAME_MS = 40;
const ROLL_HOLD_MS       = 600;

// Sprite frames are 500x375 => height = 0.75 * width
const FRAME_ASPECT = 375 / 500; // 0.75

export default function RollPopup({ faces, landingIndex = 0, onDone }) {
  const spinFaces = useMemo(() => {
    if (!Array.isArray(faces) || faces.length !== 6) {
      const blank = { kind: "upgrade" };
      return [blank, blank, blank, blank, blank, blank];
    }
    return faces;
  }, [faces]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [landed, setLanded] = useState(false);
  const timerRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const frames = Math.max(8, Math.floor(ROLL_SPIN_TOTAL_MS / ROLL_SPIN_FRAME_MS));
    let f = 0;

    const tick = () => {
      if (cancelled) return;
      setCurrentIdx((p) => (p + 1) % spinFaces.length);
      f += 1;
      if (f < frames) {
        timerRef.current = setTimeout(tick, ROLL_SPIN_FRAME_MS);
      } else {
        const li = landingIndex % spinFaces.length;
        setCurrentIdx(li);
        setLanded(true);
        timerRef.current = setTimeout(() => {
          if (!cancelled) onDone?.(spinFaces[li]);
        }, ROLL_HOLD_MS);
      }
    };

    timerRef.current = setTimeout(tick, ROLL_SPIN_FRAME_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [spinFaces, landingIndex, onDone]);

  const face = spinFaces[currentIdx];

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Rolling…</div>
        <FaceTile face={face} landed={landed} />
        <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
          {landed ? "Result!" : "Spinning…"}
        </div>
      </div>
    </div>
  );
}

function FaceTile({ face, landed }) {
  const width = 104;                  // a bit bigger than before but still compact
  const height = Math.round(width * FRAME_ASPECT);
  const radius = 12;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: radius,
        background: "rgba(255,255,255,.02)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        outline: "1px solid #1e2530",
        padding: 4,                // small cushion so nothing touches edges
        boxSizing: "border-box",
      }}
    >
      {/* Content */}
      <FaceRenderer face={face} size={width - 8} radius={radius - 2} />

      {/* Gold highlight overlay when landed */}
      {landed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow:
              "0 0 0 3px rgba(255,200,60,1), 0 0 22px rgba(255,200,60,.5), inset 0 0 10px rgba(255,200,60,.25)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

function FaceRenderer({ face, size, radius }) {
  if (!face) return null;

  if (face.kind === "class") {
    const className = face.className || "thief";
    return <ClassIcon name={className} size={size} radius={radius} />;
  }
  if (face.kind === "upgrade") {
    return <UpgradeIcon size={size} radius={radius} />;
  }
  if (face.kind === "spell") {
    return (
      <SpellIcon
        tier={face.tier || 1}
        name={face.name || "attack"}
        size={size}
        radius={radius}
      />
    );
  }
  return <UpgradeIcon size={size} radius={radius} />;
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
  },
  card: {
    background: "#0f141c",
    color: "#eaf0f6",
    border: "1px solid #263042",
    borderRadius: 16,
    padding: 16,
    minWidth: 220,
    display: "grid",
    justifyItems: "center",
    boxShadow: "0 18px 60px rgba(0,0,0,.45)",
  },
};
