import React, { useEffect, useRef } from "react";

export default function LogPanel({ log }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    // keep scrolled to bottom
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [log]);

  return (
    <div
      ref={ref}
      style={{
        border: "1px solid rgba(255,255,255,.15)",
        borderRadius: 12,
        padding: 10,
        maxHeight: "6.5em",
        overflowY: "auto",
        lineHeight: "1.25em",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Log</div>
      <div style={{ display: "grid", gap: 4 }}>
        {log.slice(-100).map((line, i) => (
          <div key={i} style={{ opacity: 0.9 }}>{line}</div>
        ))}
      </div>
    </div>
  );
}
