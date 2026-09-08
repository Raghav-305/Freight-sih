import React from "react";

// New component -- did not exist anywhere in the repo before this fix,
// even though it's listed as an "expected GIS component" in the roadmap
// (00_MASTER_IMPLEMENTATION_ROADMAP.md / IMPLEMENTATION_SPEC.md).
//
// This is intentionally a dumb, controlled component: MapCanvas owns the
// actual MapLibre layer visibility state and passes it down + a setter.
// LayerControl never touches the map instance directly.

export type ToggleableLayer = "ports" | "corridors" | "chokepoints" | "hazards";

export type LayerVisibility = Record<ToggleableLayer, boolean>;

const LABELS: Record<ToggleableLayer, string> = {
  ports: "Ports",
  corridors: "Shipping corridors",
  chokepoints: "Strategic chokepoints",
  hazards: "Hazard advisories (demo)",
};

const SWATCH: Record<ToggleableLayer, string> = {
  ports: "#38bdf8",
  corridors: "#facc15",
  chokepoints: "#f97316",
  hazards: "#f87171",
};

export function LayerControl({
  visibility,
  onToggle,
  availability,
}: {
  visibility: LayerVisibility;
  onToggle: (layer: ToggleableLayer) => void;
  /** Layers that failed to load / have no data get disabled (not hidden) so the user can see why. */
  availability: Record<ToggleableLayer, boolean>;
}) {
  const layers = Object.keys(LABELS) as ToggleableLayer[];
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
        Layers
      </span>
      {layers.map((layer) => {
        const isAvailable = availability[layer];
        return (
          <label
            key={layer}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: isAvailable ? "pointer" : "not-allowed",
              opacity: isAvailable ? 1 : 0.45,
            }}
            title={isAvailable ? undefined : "This layer failed to load or has no data"}
          >
            <input
              type="checkbox"
              checked={visibility[layer]}
              disabled={!isAvailable}
              onChange={() => onToggle(layer)}
            />
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: layer === "corridors" ? 2 : "50%",
                background: SWATCH[layer],
                flexShrink: 0,
              }}
            />
            {LABELS[layer]}
          </label>
        );
      })}
    </div>
  );
}
