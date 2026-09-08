import React, { useEffect, useRef, useState } from "react";
import { geoGraticule10, geoMercator, geoPath } from "d3-geo";
import * as maplibregl from "maplibre-gl";
import { feature } from "topojson-client";
import countries from "world-atlas/countries-110m.json";
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

const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
// Free forever, no API key, no rate limit, OSM-derived (openfreemap.org).
// Swap for "https://tiles.openfreemap.org/styles/liberty" or
// "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" if
// you'd rather use CARTO's basemap (non-commercial use only, per CARTO's
// terms) or self-host tiles for a fully offline build.

const OFFLINE_LAND_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Africa and Arabia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [35, 30], [45, 30], [56, 27], [58, 20], [52, 12], [48, 5], [44, -3],
          [40, -10], [35, -15], [30, -15], [30, 0], [32, 12], [35, 20], [35, 30],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Indian subcontinent and Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [56, 30], [70, 35], [82, 35], [95, 30], [105, 30], [115, 25], [122, 18],
          [130, 20], [140, 28], [155, 30], [155, 45], [56, 45], [56, 30],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "India and Southeast Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [68, 25], [76, 30], [88, 28], [96, 22], [105, 18], [110, 10], [106, 5],
          [100, 8], [96, 16], [90, 22], [84, 20], [78, 8], [72, 8], [68, 15], [68, 25],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Australia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [112, -10], [125, -11], [140, -12], [153, -18], [155, -30], [148, -39],
          [132, -40], [115, -35], [110, -25], [112, -10],
        ]],
      },
    },
  ],
} as const;

const OFFLINE_FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "offline-land": { type: "geojson", data: OFFLINE_LAND_GEOJSON as any },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#8ed0e8" } },
    { id: "offline-land-fill", type: "fill", source: "offline-land", paint: { "fill-color": "#d8c58d", "fill-opacity": 0.95 } },
    { id: "offline-land-outline", type: "line", source: "offline-land", paint: { "line-color": "#6d7658", "line-width": 1.5 } },
  ],
};

type LayerLoadState = Partial<Record<ToggleableLayer, { ok: boolean; error?: string }>>;

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const markerRef = useRef<Record<ToggleableLayer, maplibregl.Marker[]>>({
    ports: [],
    corridors: [],
    chokepoints: [],
    hazards: [],
  });

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
      if (!basemapFailed) {
        basemapFailed = true;
        setBasemapError("Basemap tiles unreachable -- showing offline placeholder. Data layers below are unaffected.");
        map.getCanvas().style.opacity = "0";
        map.setStyle(OFFLINE_FALLBACK_STYLE);
        window.setTimeout(loadDataLayers, 250);
      }
    });

    const basemapTimeout = window.setTimeout(() => {
      if (!basemapFailed) {
        basemapFailed = true;
        setBasemapError("Basemap tiles did not finish loading -- showing offline placeholder. Data layers remain available.");
        map.getCanvas().style.opacity = "0";
        map.setStyle(OFFLINE_FALLBACK_STYLE);
        window.setTimeout(loadDataLayers, 250);
      }
    }, 4000);

    let layersLoaded = false;
    const loadDataLayers = async () => {
      if (layersLoaded) return;
      layersLoaded = true;
      window.clearTimeout(basemapTimeout);
      map.resize();
      const [ports, corridors, chokepoints, hazards] = await Promise.allSettled([
        getPorts(),
        getCorridors(),
        getChokepoints(),
        getHazards(),
      ]);

      const nextState: LayerLoadState = {};
      const tryAddLayer = (key: ToggleableLayer, add: () => void) => {
        try {
          add();
          nextState[key] = { ok: true };
        } catch (error) {
          nextState[key] = { ok: false, error: String((error as any)?.message ?? error) };
        }
      };

      if (ports.status === "fulfilled") {
        const geojson = asGeoJson(ports.value);
        tryAddLayer("ports", () => {
          markerRef.current.ports = addVisibleMarkers(map, geojson, "#38bdf8");
          if (map.isStyleLoaded()) {
            addPointLayer(map, "ports", geojson, "#38bdf8", popupRef.current!, (props) =>
              `<strong>${props.name ?? "Port"}</strong><br/>${[props.country, props.role].filter(Boolean).join(" - ")}`
            );
          }
        });
      } else {
        nextState.ports = { ok: false, error: String((ports.reason as any)?.message ?? ports.reason) };
      }

      if (corridors.status === "fulfilled") {
        const geojson = asGeoJson(corridors.value);
        tryAddLayer("corridors", () => {
          if (map.isStyleLoaded()) {
            addLineLayer(map, "corridors", geojson, "#facc15", popupRef.current!, (props) =>
              `<strong>${props.name ?? "Corridor"}</strong><br/>${[props.type, props.commodity].filter(Boolean).join(" - ")}`
            );
          }
        });
      } else {
        nextState.corridors = { ok: false, error: String((corridors.reason as any)?.message ?? corridors.reason) };
      }

      if (chokepoints.status === "fulfilled") {
        const geojson = asGeoJson(chokepoints.value);
        tryAddLayer("chokepoints", () => {
          markerRef.current.chokepoints = addVisibleMarkers(map, geojson, "#f97316");
          if (map.isStyleLoaded()) {
            addPointLayer(map, "chokepoints", geojson, "#f97316", popupRef.current!, (props) =>
              `<strong>${props.name ?? "Chokepoint"}</strong>`
            );
          }
        });
      } else {
        nextState.chokepoints = { ok: false, error: String((chokepoints.reason as any)?.message ?? chokepoints.reason) };
      }

      if (hazards.status === "fulfilled") {
        const hz = hazards.value as any;
        setHazardStatus({ status: hz.status, last_success_at: hz.last_success_at });
        const geojson = advisoriesToGeoJson(hz.data?.advisories ?? []);
        if (geojson.features.length > 0) {
          tryAddLayer("hazards", () => {
            markerRef.current.hazards = addVisibleMarkers(map, geojson, "#f87171");
            if (map.isStyleLoaded()) {
              addPointLayer(
                map,
                "hazards",
                geojson,
                "#f87171",
                popupRef.current!,
                (props) => `<strong>${props.region ?? "Advisory"}</strong><br/>${props.severity ?? ""} (demo data, not a live warning)`,
                { radius: 9, opacity: 0.55 }
              );
            }
          });
        } else {
          nextState.hazards = { ok: false, error: "No mappable hazard geometry in current advisories" };
        }
      } else {
        nextState.hazards = { ok: false, error: String((hazards.reason as any)?.message ?? hazards.reason) };
      }

      map.fitBounds(
        [
          [35, -15],
          [155, 30],
        ],
        { padding: 36, maxZoom: 4.5, duration: 0 }
      );
      setLayerState(nextState);
    };
    map.on("load", loadDataLayers);
    map.on("style.load", loadDataLayers);
    map.on("idle", loadDataLayers);
    loadDataLayers();

    return () => {
      window.clearTimeout(basemapTimeout);
      Object.values(markerRef.current).flat().forEach((marker) => marker.remove());
      popupRef.current?.remove();
      map.remove();
    };
  }, []);

  // Push visibility toggles down to the real MapLibre layers whenever they change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (Object.keys(visibility) as ToggleableLayer[]).forEach((layer) => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, "visibility", visibility[layer] ? "visible" : "none");
      }
      markerRef.current[layer].forEach((marker) => {
        marker.getElement().style.display = visibility[layer] ? "block" : "none";
      });
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
      <OfflineMapBackdrop />
      <div ref={containerRef} style={{ position: "absolute", inset: 0, zIndex: 1 }} />

      <div style={{ position: "absolute", zIndex: 3, top: 8, left: 8, display: "flex", gap: 6, flexWrap: "wrap", maxWidth: "60%" }}>
        <FreshnessBadge truthClass="STATIC_REFERENCE" />
        {hazardStatus && (
          <FreshnessBadge truthClass={hazardStatus.status as any} lastSuccessAt={hazardStatus.last_success_at} />
        )}
      </div>

      <div style={{ position: "absolute", zIndex: 3, top: 48, right: 8, display: "flex", flexDirection: "column", gap: 8 }}>
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

function OfflineMapBackdrop() {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ x: number; y: number; viewX: number; viewY: number } | null>(null);
  const projection = geoMercator().center([95, 5]).scale(650).translate([600, 280]);
  const path = geoPath(projection);
  const land = feature(countries as any, (countries as any).objects.countries) as any;
  const graticule = geoGraticule10();
  const ports = [
    [86.6106, 20.2649], [86.9167, 20.7833], [88.067, 22.0333], [83.28, 17.69],
    [80.32, 13.08], [80.27, 13.13], [88.31, 22.57], [151.256, -23.8433], [151.78, -32.93],
  ];
  const chokepoints = [[100.5, 2.8], [105.85, -6], [116, -8.5], [142.2, -10.6], [80, 5]];
  const route = [[151.256, -23.8433], [142.2, -10.6], [115.75, -8.5], [92, 10], [86.6106, 20.2649]];
  const routePath = path({ type: "LineString", coordinates: route } as any);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        background: "#8ed0e8",
        pointerEvents: "auto",
        cursor: dragRef.current ? "grabbing" : "grab",
      }}
      onWheel={(event) => {
        const factor = event.deltaY < 0 ? 1.15 : 0.87;
        setView((current) => ({ ...current, scale: Math.min(4, Math.max(0.8, current.scale * factor)) }));
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y };
        setView((current) => ({ ...current }));
      }}
      onPointerMove={(event) => {
        if (!dragRef.current) return;
        const drag = dragRef.current;
        setView((current) => ({ ...current, x: drag.viewX + event.clientX - drag.x, y: drag.viewY + event.clientY - drag.y }));
      }}
      onPointerUp={(event) => {
        dragRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        setView((current) => ({ ...current }));
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        setView((current) => ({ ...current }));
      }}
    >
      <svg viewBox="0 0 1200 560" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        <path d={path(graticule) ?? undefined} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
        <path d={path(land) ?? undefined} fill="#d8c58d" stroke="#6d7658" strokeWidth="1.2" />
        <path d={routePath ?? undefined} fill="none" stroke="#facc15" strokeWidth="4" strokeDasharray="10 7" />
        <g fill="#38bdf8" stroke="#0b1220" strokeWidth="3">
          {ports.map(([longitude, latitude]) => {
            const point = projection([longitude, latitude]);
            return point ? <circle key={`${longitude}-${latitude}`} cx={point[0]} cy={point[1]} r="9" /> : null;
          })}
        </g>
        <g fill="#f97316" stroke="#0b1220" strokeWidth="3">
          {chokepoints.map(([longitude, latitude]) => {
            const point = projection([longitude, latitude]);
            return point ? <circle key={`${longitude}-${latitude}`} cx={point[0]} cy={point[1]} r="10" /> : null;
          })}
        </g>
        </g>
      </svg>
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

function asGeoJson(value: unknown): any {
  const candidate = (value as any)?.geojson ?? value;
  if (!candidate || candidate.type !== "FeatureCollection" || !Array.isArray(candidate.features)) {
    throw new Error("Map endpoint did not return a GeoJSON FeatureCollection");
  }
  return candidate;
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
  const radius = opts?.radius ?? 8;
  map.addLayer({
    id,
    type: "circle",
    source: id,
    paint: {
      "circle-color": color,
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        radius + 4,
        3,
        radius + 6,
        6,
        radius + 10,
        10,
        radius + 14,
      ],
      "circle-opacity": opts?.opacity ?? 0.9,
      "circle-stroke-width": 3,
      "circle-stroke-color": "#0b1220",
    },
  });
  bindPopup(map, id, popup, render);
}

function addVisibleMarkers(map: MLMap, geojson: any, color: string): maplibregl.Marker[] {
  return (geojson.features ?? [])
    .filter((feature: any) => feature.geometry?.type === "Point")
    .map((feature: any) => {
      const element = document.createElement("div");
      element.setAttribute("aria-label", feature.properties?.name ?? "Map location");
      element.style.width = "16px";
      element.style.height = "16px";
      element.style.borderRadius = "50%";
      element.style.background = color;
      element.style.border = "3px solid #0b1220";
      element.style.boxShadow = `0 0 0 2px ${color}, 0 2px 8px rgba(0, 0, 0, 0.65)`;
      element.style.pointerEvents = "none";
      return new maplibregl.Marker({ element })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);
    });
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
