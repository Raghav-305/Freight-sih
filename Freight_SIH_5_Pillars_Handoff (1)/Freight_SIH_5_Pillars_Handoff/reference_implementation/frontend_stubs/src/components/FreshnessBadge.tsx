import React from "react";

// Renders the mandatory truth-class badge described in
// 02_PILLAR_2_MARITIME_GIS/DEEP_RESEARCH.md and 05_PILLAR_5_COMMAND_CENTER
// visual rules: stale data must be visible, not silently hidden, and no
// state relies on color alone (label text always accompanies the color).

type TruthClass =
  | "STATIC_REFERENCE"
  | "OFFICIAL_PERIODIC"
  | "MODEL_OUTPUT"
  | "USER_INPUT"
  | "DEMO_SIMULATION"
  | "FAILED_NO_CACHE"
  | "FAILED_SHOWING_LAST_KNOWN_STALE";

const STYLE: Record<TruthClass, { bg: string; fg: string; label: string }> = {
  STATIC_REFERENCE: { bg: "#1f2937", fg: "#9ca3af", label: "Static reference" },
  OFFICIAL_PERIODIC: { bg: "#064e3b", fg: "#34d399", label: "Official (periodic)" },
  MODEL_OUTPUT: { bg: "#1e3a8a", fg: "#93c5fd", label: "Model output" },
  USER_INPUT: { bg: "#3730a3", fg: "#c4b5fd", label: "User input" },
  DEMO_SIMULATION: { bg: "#7c2d12", fg: "#fdba74", label: "Demo simulation" },
  FAILED_NO_CACHE: { bg: "#7f1d1d", fg: "#fca5a5", label: "Feed failed -- no data" },
  FAILED_SHOWING_LAST_KNOWN_STALE: { bg: "#78350f", fg: "#fcd34d", label: "STALE -- showing last known" },
};

export function FreshnessBadge({
  truthClass,
  lastSuccessAt,
}: {
  truthClass: TruthClass;
  lastSuccessAt?: string | null;
}) {
  const style = STYLE[truthClass] ?? STYLE.STATIC_REFERENCE;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        background: style.bg,
        color: style.fg,
      }}
      title={lastSuccessAt ? `Last success: ${lastSuccessAt}` : "No successful fetch recorded"}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: style.fg }} />
      {style.label}
      {lastSuccessAt && (
        <span style={{ opacity: 0.7, fontWeight: 400 }}>
          {new Date(lastSuccessAt).toLocaleTimeString()}
        </span>
      )}
    </span>
  );
}
