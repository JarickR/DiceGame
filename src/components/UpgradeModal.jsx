import React from "react";

export default function UpgradeModal({ onClose, onPick }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 680,
          maxWidth: "90vw",
          background: "rgba(10,12,16,.95)",
          border: "1px solid rgba(255,255,255,.2)",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800 }}>Upgrade — pick a slot</div>
          <button onClick={onClose}>Close</button>
        </div>
        <div style={{ marginTop: 12, marginBottom: 8 }}>Select a spell slot to upgrade:</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[0, 1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.2)",
                background: "rgba(255,255,255,.03)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              Slot {s + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
