// src/components/DebugPanel.jsx
import React, { useState } from "react";

/**
 * Minimal floating debug panel.
 * Show it conditionally in App.jsx:
 *   {debug && <DebugPanel state={{ players, enemies, phase, log }} />}
 */
export default function DebugPanel({ state }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={panelWrap}>
      <div style={panelHeader}>
        <strong>Debug</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btn} onClick={() => setOpen(o => !o)}>
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {open && (
        <div style={panelBody}>
          <Section title="Phase">
            <code>{String(state?.phase ?? "")}</code>
          </Section>

          <Section title="Players">
            <pre style={pre}>{JSON.stringify(state?.players ?? [], null, 2)}</pre>
          </Section>

          <Section title="Enemies">
            <pre style={pre}>{JSON.stringify(state?.enemies ?? [], null, 2)}</pre>
          </Section>

          <Section title="Log (last 20)">
            <pre style={pre}>{JSON.stringify((state?.log ?? []).slice(-20), null, 2)}</pre>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

const panelWrap = {
  position: "fixed",
  right: 12,
  bottom: 12,
  zIndex: 2000,
  width: 360,
  maxHeight: "70vh",
  overflow: "auto",
  background: "rgba(12,16,22,0.96)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  boxShadow: "0 10px 40px rgba(0,0,0,.45)",
  color: "#e5e7eb",
  fontSize: 12,
};

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  position: "sticky",
  top: 0,
  background: "rgba(12,16,22,0.96)",
};

const panelBody = {
  padding: "8px 10px",
};

const btn = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#e5e7eb",
  padding: "4px 8px",
  borderRadius: 8,
  cursor: "pointer",
};

const pre = {
  margin: 0,
  padding: 8,
  background: "rgba(255,255,255,0.04)",
  borderRadius: 8,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};
