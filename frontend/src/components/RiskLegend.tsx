import React from "react";

// New component -- also listed in the roadmap's expected GIS components
// but never implemented. Pure presentation, no map access, no fetches.

const ENTRIES: { swatch: string; shape: "circle" | "line"; label: string; note: string }[] = [
  { swatch: "#38bdf8", shape: "circle", label: "Port", note: "STATIC_REFERENCE" },
  { swatch: "#facc15", shape: "line", label: "Shipping corridor", note: "STATIC_REFERENCE" },
  { swatch: "#f97316", shape: "circle", label: "Strategic chokepoint", note: "STATIC_REFERENCE" },
  { swatch: "#f87171", shape: "circle", label: "Hazard advisory", note: "DEMO_SIMULATION" },
];

export function RiskLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: "rgba(15, 23, 42, 0.85)",
        border: "1px solid #1f2937",
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 12,
        color: "#e2e8f0",
        minWidth: 168,
      }}
    >
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#94a3b8" }}>
        Legend
      </span>
      {ENTRIES.map((e) => (
        <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {e.shape === "circle" ? (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.swatch, flexShrink: 0 }} />
          ) : (
            <span style={{ width: 14, height: 2, background: e.swatch, flexShrink: 0 }} />
          )}
          <span style={{ flex: 1 }}>{e.label}</span>
          <span style={{ color: "#64748b", fontSize: 10 }}>{e.note}</span>
        </div>
      ))}
    </div>
  );
}
