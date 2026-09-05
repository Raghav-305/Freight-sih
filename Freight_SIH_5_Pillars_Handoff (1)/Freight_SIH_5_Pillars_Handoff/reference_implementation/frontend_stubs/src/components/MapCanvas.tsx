import React, { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getChokepoints, getCorridors, getHazards, getPorts } from "../api";
import { FreshnessBadge } from "./FreshnessBadge";

// Implements the Pillar 2 Definition of Done: static layers must render
// with Wi-Fi off, and every dynamic layer must expose its fetch timestamp.
// Network calls are made here (not deeper inside layer components) per the
// IMPLEMENTATION_SPEC.md rule: "Do not place network calls directly in map
// components" -- this component IS the designated boundary; child layer
// widgets below it should stay presentation-only.

const NEUTRAL_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [{ id: "bg", type: "background" as const, paint: { "background-color": "#0b1220" } }],
};

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [hazardStatus, setHazardStatus] = useState<{ status: string; last_success_at: string | null } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: NEUTRAL_STYLE, // swap for a packaged PMTiles style once available offline
      center: [90, 12],
      zoom: 3,
    });
    mapRef.current = map;

    map.on("load", async () => {
      try {
        const [ports, corridors, chokepoints, hazards] = await Promise.all([
          getPorts(), getCorridors(), getChokepoints(), getHazards(),
        ]);

        addGeoJsonLayer(map, "ports", (ports as any).geojson, "#38bdf8", "circle");
        addGeoJsonLayer(map, "corridors", (corridors as any).geojson, "#facc15", "line");
        addGeoJsonLayer(map, "chokepoints", (chokepoints as any).geojson, "#f97316", "circle");

        setHazardStatus({ status: (hazards as any).status, last_success_at: (hazards as any).last_success_at });
      } catch (e: any) {
        // Failure state must be visible, never silently replaced by stale-labelled-live data.
        setLoadError(e.message || "Failed to load one or more map layers");
      }
    });

    return () => map.remove();
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: 480, borderRadius: 8, overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6 }}>
        <FreshnessBadge truthClass="STATIC_REFERENCE" />
        {hazardStatus && (
          <FreshnessBadge
            truthClass={hazardStatus.status as any}
            lastSuccessAt={hazardStatus.last_success_at}
          />
        )}
      </div>
      {loadError && (
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "#7f1d1d", color: "#fca5a5", padding: 8, borderRadius: 6, fontSize: 12 }}>
          Map layer failure: {loadError}
        </div>
      )}
    </div>
  );
}

function addGeoJsonLayer(map: MLMap, id: string, geojson: any, color: string, kind: "circle" | "line") {
  if (map.getSource(id)) return;
  map.addSource(id, { type: "geojson", data: geojson });
  if (kind === "circle") {
    map.addLayer({ id, type: "circle", source: id, paint: { "circle-color": color, "circle-radius": 5 } });
  } else {
    map.addLayer({ id, type: "line", source: id, paint: { "line-color": color, "line-width": 2 } });
  }
}
