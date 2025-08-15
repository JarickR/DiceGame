// src/ui/InitiativeModal.jsx
import React from "react";

export default function InitiativeModal({ order = [], onClose = () => {} }) {
  if (!order || order.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 80,
      }}
      onClick={onClose}
    >
      <div
        style={{
          minWidth: 420,
          maxWidth: 640,
          background: "#0f141b",
          border: "1px solid #223",
          borderRadius: 12,
          padding: 16,
          color: "#e8ecf1",
          boxShadow: "0 12px 40px rgba(0,0,0,.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 18 }}>
          Turn Order (Highest d20 first)
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {order.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              <div style={{ opacity: 0.7, width: 20, textAlign: "right" }}>
                {i + 1}.
              </div>
              <div style={{ flex: 1, marginLeft: 10 }}>
                <span
                  style={{
                    display: "inline-block",
                    minWidth: 64,
                    padding: "2px 8px",
                    borderRadius: 8,
                    marginRight: 8,
                    background:
                      c.kind === "player"
                        ? "rgba(120,200,255,.15)"
                        : "rgba(255,140,120,.15)",
                    border:
                      c.kind === "player"
                        ? "1px solid rgba(120,200,255,.25)"
                        : "1px solid rgba(255,140,120,.25)",
                  }}
                >
                  {c.kind.toUpperCase()}
                </span>
                <b>{c.name}</b>
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  opacity: 0.8,
                  minWidth: 36,
                  textAlign: "right",
                }}
              >
                d20: {c.init}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button className="btn" onClick={onClose} style={{ padding: "8px 12px" }}>
            Begin!
          </button>
        </div>
      </div>
    </div>
  );
}
