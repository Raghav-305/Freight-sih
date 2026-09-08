import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
type MLMap = maplibregl.Map;
import "maplibre-gl/dist/maplibre-gl.css";
import { getChokepoints, getCorridors, getHazards, getPorts } from "../api";
import { FreshnessBadge } from "./FreshnessBadge";
import { LayerControl, type LayerVisibility, type ToggleableLayer } from "./LayerControl";
import { RiskLegend } from "./RiskLegend";

// Implements the Pillar 2 Definition of Done: static layers must render
// with Wi-Fi off, and every dynamic layer must expose its fetch timestamp.
// Network calls are made here (not deeper inside layer components) per the
// IMPLEMENTATION_SPEC.md rule: "Do not place network calls directly in map
// components" -- this component IS the designated boundary; child layer
// widgets below it should stay presentation-only.
//
// ROOT CAUSE OF THE BLANK/DARK MAP (fixed here):
// The previous style object had `sources: {}` and a single "background"
// paint layer -- there was never a real basemap (no coastlines, no land,
// no tiles of any kind). MapLibre was initializing correctly and the
// GeoJSON layers were being added correctly; the map just had nothing
// to draw underneath them, so the whole thing looked like a dead black
// box regardless of whether ports/corridors/chokepoints loaded. We now
// point at a free, key-less vector basemap and fall back to a plain
// background (with a visible notice) if that basemap can't be reached,
// e.g. genuinely offline.

const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
// Free forever, no API key, no rate limit, OSM-derived (openfreemap.org).
// Swap for "https://tiles.openfreemap.org/styles/liberty" or
// "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" if
// you'd rather use CARTO's basemap (non-commercial use only, per CARTO's
// terms) or self-host tiles for a fully offline build.

const OFFLINE_FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "#0b1220" } }],
};

type LayerLoadState = Partial<Record<ToggleableLayer, { ok: boolean; error?: string }>>;

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [hazardStatus, setHazardStatus] = useState<{ status: string; last_success_at: string | null } | null>(null);
  const [layerState, setLayerState] = useState<LayerLoadState>({});
  const [basemapError, setBasemapError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<LayerVisibility>({
    ports: true,
    corridors: true,
    chokepoints: true,
    hazards: true,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE_URL,
      center: [90, 12],
      zoom: 3,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    popupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "260px" });

    // If the vector basemap itself can't load (offline, DNS blocked, CDN
    // down, etc.) MapLibre fires a style-level "error" *before* "load".
    // Swap to a flat background so the page still shows something
    // meaningful instead of getting stuck, and tell the user why.
    let basemapFailed = false;
    map.on("error", () => {
      if (!basemapFailed && !map.isStyleLoaded()) {
        basemapFailed = true;
        setBasemapError("Basemap tiles unreachable -- showing offline placeholder. Data layers below are unaffected.");
        map.setStyle(OFFLINE_FALLBACK_STYLE);
      }
    });

    map.on("load", async () => {
      const [ports, corridors, chokepoints, hazards] = await Promise.allSettled([
        getPorts(),
        getCorridors(),
        getChokepoints(),
        getHazards(),
      ]);

      const nextState: LayerLoadState = {};

      if (ports.status === "fulfilled") {
        addPointLayer(map, "ports", (ports.value as any).geojson, "#38bdf8", popupRef.current!, (props) =>
          `<strong>${props.name ?? "Port"}</strong><br/>${[props.country, props.role].filter(Boolean).join(" - ")}`
        );
        nextState.ports = { ok: true };
      } else {
        nextState.ports = { ok: false, error: String((ports.reason as any)?.message ?? ports.reason) };
      }

      if (corridors.status === "fulfilled") {
        addLineLayer(map, "corridors", (corridors.value as any).geojson, "#facc15", popupRef.current!, (props) =>
          `<strong>${props.name ?? "Corridor"}</strong><br/>${[props.type, props.commodity].filter(Boolean).join(" - ")}`
        );
        nextState.corridors = { ok: true };
      } else {
        nextState.corridors = { ok: false, error: String((corridors.reason as any)?.message ?? corridors.reason) };
      }

      if (chokepoints.status === "fulfilled") {
        addPointLayer(map, "chokepoints", (chokepoints.value as any).geojson, "#f97316", popupRef.current!, (props) =>
          `<strong>${props.name ?? "Chokepoint"}</strong>`
        );
        nextState.chokepoints = { ok: true };
      } else {
        nextState.chokepoints = { ok: false, error: String((chokepoints.reason as any)?.message ?? chokepoints.reason) };
      }

      if (hazards.status === "fulfilled") {
        const hz = hazards.value as any;
        setHazardStatus({ status: hz.status, last_success_at: hz.last_success_at });
        const geojson = advisoriesToGeoJson(hz.data?.advisories ?? []);
        if (geojson.features.length > 0) {
          addPointLayer(
            map,
            "hazards",
            geojson,
            "#f87171",
            popupRef.current!,
            (props) => `<strong>${props.region ?? "Advisory"}</strong><br/>${props.severity ?? ""} (demo data, not a live warning)`,
            { radius: 9, opacity: 0.55 }
          );
          nextState.hazards = { ok: true };
        } else {
          nextState.hazards = { ok: false, error: "No mappable hazard geometry in current advisories" };
        }
      } else {
        nextState.hazards = { ok: false, error: String((hazards.reason as any)?.message ?? hazards.reason) };
      }

      setLayerState(nextState);
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
    };
  }, []);

  // Push visibility toggles down to the real MapLibre layers whenever they change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (Object.keys(visibility) as ToggleableLayer[]).forEach((layer) => {
      if (!map.getLayer(layer)) return;
      map.setLayoutProperty(layer, "visibility", visibility[layer] ? "visible" : "none");
    });
  }, [visibility]);

  const failedLayers = (Object.entries(layerState) as [ToggleableLayer, { ok: boolean; error?: string }][]).filter(
    ([, s]) => !s.ok
  );

  const availability: Record<ToggleableLayer, boolean> = {
    ports: layerState.ports?.ok ?? true,
    corridors: layerState.corridors?.ok ?? true,
    chokepoints: layerState.chokepoints?.ok ?? true,
    hazards: layerState.hazards?.ok ?? true,
  };

  return (
    <div style={{ position: "relative", width: "100%", height: 560, borderRadius: 8, overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6, flexWrap: "wrap", maxWidth: "60%" }}>
        <FreshnessBadge truthClass="STATIC_REFERENCE" />
        {hazardStatus && (
          <FreshnessBadge truthClass={hazardStatus.status as any} lastSuccessAt={hazardStatus.last_success_at} />
        )}
      </div>

      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        <LayerControl
          visibility={visibility}
          availability={availability}
          onToggle={(layer) => setVisibility((v) => ({ ...v, [layer]: !v[layer] }))}
        />
        <RiskLegend />
      </div>

      {basemapError && <div style={bannerStyle("#78350f", "#fcd34d")}>{basemapError}</div>}

      {failedLayers.length > 0 && (
        <div style={{ ...bannerStyle("#7f1d1d", "#fca5a5"), bottom: basemapError ? 44 : 8 }}>
          {failedLayers
            .map(
              ([layer, s]) =>
                `${layer[0].toUpperCase()}${layer.slice(1)} layer could not be loaded${s.error ? ` (${s.error})` : ""}.`
            )
            .join(" ")}{" "}
          Other map layers remain available.
        </div>
      )}
    </div>
  );
}

function bannerStyle(background: string, color: string): React.CSSProperties {
  return {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    background,
    color,
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
  };
}

// ---- layer + popup helpers -------------------------------------------------

function bindPopup(map: MLMap, layerId: string, popup: maplibregl.Popup, render: (props: any) => string) {
  map.on("click", layerId, (e) => {
    const feature = e.features?.[0];
    if (!feature) return;
    popup
      .setLngLat(e.lngLat)
      .setHTML(render(feature.properties ?? {}))
      .addTo(map);
  });
  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
  });
}

function addPointLayer(
  map: MLMap,
  id: string,
  geojson: any,
  color: string,
  popup: maplibregl.Popup,
  render: (props: any) => string,
  opts?: { radius?: number; opacity?: number }
) {
  if (map.getSource(id)) return;
  map.addSource(id, { type: "geojson", data: geojson });
  map.addLayer({
    id,
    type: "circle",
    source: id,
    paint: {
      "circle-color": color,
      "circle-radius": opts?.radius ?? 5,
      "circle-opacity": opts?.opacity ?? 0.9,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#0b1220",
    },
  });
  bindPopup(map, id, popup, render);
}

function addLineLayer(
  map: MLMap,
  id: string,
  geojson: any,
  color: string,
  popup: maplibregl.Popup,
  render: (props: any) => string
) {
  if (map.getSource(id)) return;
  map.addSource(id, { type: "geojson", data: geojson });
  map.addLayer({
    id,
    type: "line",
    source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": color, "line-width": 2.5, "line-opacity": 0.9 },
  });
  bindPopup(map, id, popup, render);
}

// The hazard adapter (backend/app/services/imd_adapter.py) returns
// region *names* with no coordinates -- there is no real geometry to plot.
// Rather than inventing precise geometry, we use a small approximate
// centroid lookup purely so the DEMO_SIMULATION advisory has *something*
// to show on the map; it is never presented as authoritative and is
// always labeled as demo data in its popup.
const REGION_CENTROIDS: Record<string, [number, number]> = {
  "Bay of Bengal": [88, 15],
  "Arabian Sea": [65, 15],
  "Indian Ocean": [80, -5],
};

function advisoriesToGeoJson(advisories: { id: string; region: string; severity: string }[]) {
  const features = advisories
    .filter((a) => REGION_CENTROIDS[a.region])
    .map((a) => ({
      type: "Feature" as const,
      properties: { id: a.id, region: a.region, severity: a.severity },
      geometry: { type: "Point" as const, coordinates: REGION_CENTROIDS[a.region] },
    }));
  return { type: "FeatureCollection" as const, features };
}
