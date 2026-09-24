import React, { useEffect, useRef, useState, useMemo } from "react";
import { geoGraticule10, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries from "world-atlas/countries-110m.json";
import {
  Compass,
  Navigation,
  Anchor,
  ShieldAlert,
  AlertTriangle,
  Radio,
  Ship,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import { FreshnessBadge } from "./FreshnessBadge";
import { RiskLegend } from "./RiskLegend";
import { type LiveVesselRecord } from "../api";

// Ports database for East Coast + key origin terminals
const PORTS_DATA = [
  { id: "PAR", name: "Paradip Port", lon: 86.6106, lat: 20.2649, type: "MAJOR", draft: 14.5, loa: 260, role: "Destination" },
  { id: "DHA", name: "Dhamra Port", lon: 86.9167, lat: 20.7833, type: "PRIVATE_DEEPWATER", draft: 18.0, loa: 320, role: "Destination" },
  { id: "HAL", name: "Haldia Dock Complex", lon: 88.067, lat: 22.0333, type: "MAJOR_RIVERINE", draft: 11.5, loa: 230, role: "Destination" },
  { id: "VIZ", name: "Visakhapatnam Port", lon: 83.28, lat: 17.69, type: "MAJOR", draft: 18.1, loa: 300, role: "Destination" },
  { id: "GAN", name: "Gangavaram Port", lon: 83.23, lat: 17.62, type: "PRIVATE_DEEPWATER", draft: 20.0, loa: 330, role: "Destination" },
  { id: "GOP", name: "Gopalpur Port", lon: 84.97, lat: 19.31, type: "COMMERCIAL", draft: 13.5, loa: 225, role: "Destination" },
  { id: "CHE", name: "Chennai Port", lon: 80.32, lat: 13.08, type: "MAJOR", draft: 15.5, loa: 280, role: "Destination" },
  { id: "ENR", name: "Kamarajar Port (Ennore)", lon: 80.335, lat: 13.25, type: "MAJOR", draft: 16.0, loa: 290, role: "Destination" },
  { id: "TUT", name: "VO Chidambaranar (Tuticorin)", lon: 78.18, lat: 8.75, type: "MAJOR", draft: 14.2, loa: 250, role: "Destination" },
  { id: "KOL", name: "Kolkata (Syama Prasad Mookerjee)", lon: 88.31, lat: 22.57, type: "MAJOR", draft: 8.5, loa: 180, role: "Destination" },
  { id: "GLA", name: "Gladstone (Australia)", lon: 151.256, lat: -23.8433, type: "ORIGIN", draft: 19.0, loa: 350, role: "Origin" },
  { id: "HAY", name: "Hay Point (Australia)", lon: 149.30, lat: -21.28, type: "ORIGIN", draft: 20.5, loa: 350, role: "Origin" },
  { id: "SAM", name: "Samarinda (Indonesia)", lon: 117.15, lat: -0.50, type: "ORIGIN", draft: 13.0, loa: 225, role: "Origin" },
  { id: "MAP", name: "Maputo (Mozambique)", lon: 32.58, lat: -25.96, type: "ORIGIN", draft: 14.2, loa: 260, role: "Origin" },
];

// Strategic Chokepoints with operational impact details
const CHOKEPOINTS_DATA = [
  {
    id: "malacca",
    name: "Strait of Malacca",
    lon: 100.5,
    lat: 2.8,
    radiusKm: 280,
    impact: "Depth constraint <20m at Phillips Channel. Deep-draft Capesize vessels must reroute via Lombok/Sunda (+4 steaming days). High traffic density.",
    riskLevel: "HIGH",
    category: "SHIPPING_LANE_CHOKEPOINT",
    enabledByDefault: true,
  },
  {
    id: "babelmandeb",
    name: "Bab-el-Mandeb",
    lon: 43.33,
    lat: 12.58,
    radiusKm: 320,
    impact: "Geopolitical War Risk Zone (CONWARTIME 2004 applies). Active missile/drone hazard at southern Red Sea entrance. Insurance war risk surcharge +0.75%.",
    riskLevel: "CRITICAL",
    category: "GEOPOLITICAL_WAR_RISK",
    enabledByDefault: true,
  },
  {
    id: "sunda",
    name: "Sunda Strait",
    lon: 105.85,
    lat: -6.0,
    radiusKm: 200,
    impact: "Secondary Indonesian coal fairway between Java and Sumatra. Strong tidal currents (up to 6 knots), volcanic hazards (Anak Krakatau).",
    riskLevel: "MEDIUM",
    category: "SHIPPING_LANE_CHOKEPOINT",
    enabledByDefault: false,
  },
  {
    id: "lombok",
    name: "Lombok Strait",
    lon: 115.75,
    lat: -8.5,
    radiusKm: 220,
    impact: "Deep-water passage (>250m) for fully laden Capesize coal carriers from Australia avoiding shallow Malacca waters.",
    riskLevel: "LOW",
    category: "SHIPPING_LANE_CHOKEPOINT",
    enabledByDefault: false,
  },
  {
    id: "torres",
    name: "Torres Strait",
    lon: 142.2,
    lat: -10.6,
    radiusKm: 180,
    impact: "Mandatory pilotage zone between Australia and Papua New Guinea. Tidal draft limits (12.2m).",
    riskLevel: "MEDIUM",
    category: "SHIPPING_LANE_CHOKEPOINT",
    enabledByDefault: false,
  },
];

// Commodity shipping corridors
const CORRIDORS_DATA = [
  {
    id: "au-in",
    name: "Australia → India (Gladstone to Paradip)",
    commodity: "Coking Coal (Panamax / Capesize)",
    distanceNm: 3820,
    steamingDays: "12-14 days @ 12.5 kn",
    coordinates: [
      [151.256, -23.8433],
      [142.2, -10.6],
      [115.75, -8.5],
      [92.0, 10.0],
      [86.6106, 20.2649],
    ],
    color: "#facc15",
  },
  {
    id: "id-in",
    name: "Indonesia → India (Kalimantan to Paradip/Haldia)",
    commodity: "Thermal Coal (Supramax / Panamax)",
    distanceNm: 2150,
    steamingDays: "7-8 days @ 12.0 kn",
    coordinates: [
      [117.15, -0.5],
      [105.0, 1.0],
      [100.5, 2.8],
      [92.0, 10.0],
      [86.6106, 20.2649],
    ],
    color: "#38bdf8",
  },
  {
    id: "mz-in",
    name: "Mozambique → India (Maputo to Paradip/Tuticorin)",
    commodity: "Coking & Thermal Coal (Panamax)",
    distanceNm: 4600,
    steamingDays: "15-17 days @ 13.0 kn",
    coordinates: [
      [32.58, -25.96],
      [45.0, -20.0],
      [60.0, -10.0],
      [75.0, 5.0],
      [86.6106, 20.2649],
    ],
    color: "#a855f7",
  },
  {
    id: "coastal",
    name: "Indian East Coast Coastal Cabotage (Paradip to Ennore)",
    commodity: "Domestic Thermal Coal (Handysize / Panamax)",
    distanceNm: 520,
    steamingDays: "1.8 days @ 12.0 kn",
    coordinates: [
      [86.6106, 20.2649],
      [80.335, 13.25],
    ],
    color: "#34d399",
  },
];

// Active Bulk Carrier Fleet on the map
export interface GisVessel {
  mmsi: number;
  imo: string;
  name: string;
  flag: string;
  vessel_class: string;
  dwt: number;
  draft_m: number;
  sog_kn: number;
  cog_deg: number;
  destination: string;
  eta: string;
  corridor: string;
  cargo: string;
  lon: number;
  lat: number;
  kalman_status: string;
  rightship_rating: string;
  highlighted?: boolean;
  is_spoofed?: boolean;
}

export interface MapCanvasProps {
  vessels?: LiveVesselRecord[];
  isSpoofed?: boolean;
  onSimulateSpoof?: () => void;
  onResetFleet?: () => void;
  actionLoading?: boolean;
  selectedMmsi?: number | null;
  onSelectVessel?: (vessel: GisVessel | null) => void;
}

const FLEET_DATA: GisVessel[] = [
  {
    mmsi: 419002345,
    imo: "9452389",
    name: "M/V MAHA ANAND",
    flag: "India (IN)",
    vessel_class: "Panamax",
    dwt: 80500,
    draft_m: 14.2,
    sog_kn: 12.2,
    cog_deg: 345,
    destination: "Paradip Port",
    eta: "2026-09-26 14:00 UTC",
    corridor: "Australia → Paradip",
    cargo: "75,000 MT Australian Prime Hard Coking Coal",
    lon: 86.4,
    lat: 18.5,
    kalman_status: "4D State Vector Valid · Zero Spoofing Deviation",
    rightship_rating: "5/5 Stars · DG Shipping Approved (<15 yrs)",
    highlighted: true,
  },
  {
    mmsi: 419001234,
    imo: "9312014",
    name: "M/V BHARAT PRIDE",
    flag: "India (IN)",
    vessel_class: "Panamax",
    dwt: 82000,
    draft_m: 14.1,
    sog_kn: 13.8,
    cog_deg: 340,
    destination: "Paradip Port",
    eta: "2026-09-27 06:00 UTC",
    corridor: "Australia → Paradip",
    cargo: "78,000 MT Coking Coal",
    lon: 85.2,
    lat: 16.5,
    kalman_status: "Active Kinematic Tracking",
    rightship_rating: "4/5 Stars · DG Shipping Compliant",
  },
  {
    mmsi: 211281610,
    imo: "9604122",
    name: "NORDIC VOYAGER",
    flag: "Norway (NO)",
    vessel_class: "Capesize",
    dwt: 178000,
    draft_m: 17.5,
    sog_kn: 12.5,
    cog_deg: 355,
    destination: "Dhamra Port",
    eta: "2026-09-28 18:30 UTC",
    corridor: "Australia → Dhamra",
    cargo: "150,000 MT Capesize Coking Coal",
    lon: 87.1,
    lat: 18.2,
    kalman_status: "Active Kinematic Tracking",
    rightship_rating: "5/5 Stars · RightShip Dry Index Top Decile",
  },
  {
    mmsi: 353130000,
    imo: "9518731",
    name: "PACIFIC TITAN",
    flag: "Panama (PA)",
    vessel_class: "Panamax",
    dwt: 76000,
    draft_m: 13.8,
    sog_kn: 11.2,
    cog_deg: 325,
    destination: "Visakhapatnam",
    eta: "2026-09-29 02:00 UTC",
    corridor: "Indonesia → Vizag",
    cargo: "70,000 MT Thermal Coal",
    lon: 84.4,
    lat: 14.8,
    kalman_status: "Active Kinematic Tracking",
    rightship_rating: "4/5 Stars · P&I Club Standard",
  },
  {
    mmsi: 636019821,
    imo: "9283190",
    name: "ATLANTIC CARRIER",
    flag: "Liberia (LR)",
    vessel_class: "Supramax",
    dwt: 58000,
    draft_m: 12.6,
    sog_kn: 14.0,
    cog_deg: 15,
    destination: "VO Chidambaranar (Tuticorin)",
    eta: "2026-09-30 11:15 UTC",
    corridor: "Mozambique → Tuticorin",
    cargo: "52,000 MT Richards Bay Coal",
    lon: 77.8,
    lat: 7.4,
    kalman_status: "Active Kinematic Tracking",
    rightship_rating: "4/5 Stars · IMO MARPOL Tier III",
  },
];

export function MapCanvas(props: MapCanvasProps = {}) {
  // Map View State (pan & zoom)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ x: number; y: number; viewX: number; viewY: number } | null>(null);

  // Layer Toggles
  const [showChokepoints, setShowChokepoints] = useState(true);
  const [showPorts, setShowPorts] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showVessels, setShowVessels] = useState(true);

  // Individual Chokepoint Overlays (Script requirements!)
  const [activeChokepointIds, setActiveChokepointIds] = useState<Record<string, boolean>>({
    malacca: true,
    babelmandeb: true,
    sunda: false,
    lombok: false,
    torres: false,
  });

  // Selected entities for popups / modal details
  const [selectedVessel, setSelectedVessel] = useState<GisVessel | null>(null);
  const [selectedChokepoint, setSelectedChokepoint] = useState<any | null>(null);
  const [hoveredCorridor, setHoveredCorridor] = useState<any | null>(null);
  const [selectedPort, setSelectedPort] = useState<any | null>(null);

  // Local spoofing toggle fallback for standalone operation
  const [internalSpoofed, setInternalSpoofed] = useState(false);
  const isSpoofedActive = props.isSpoofed ?? internalSpoofed;

  const handleSimulateSpoof = () => {
    if (props.onSimulateSpoof) {
      props.onSimulateSpoof();
    } else {
      setInternalSpoofed(true);
    }
  };

  const handleResetFleet = () => {
    if (props.onResetFleet) {
      props.onResetFleet();
    } else {
      setInternalSpoofed(false);
    }
    if (selectedVessel?.mmsi === 419001234) {
      const orig = FLEET_DATA.find((v) => v.mmsi === 419001234);
      if (orig) setSelectedVessel(orig);
    }
  };

  // Active fleet merged with live telemetry and spoof injection
  const activeFleet = useMemo<GisVessel[]>(() => {
    return FLEET_DATA.map((base) => {
      const live = (props.vessels || []).find((lv) => lv.mmsi === base.mmsi);
      const isBharat = base.mmsi === 419001234;

      if (isBharat && isSpoofedActive) {
        return {
          ...base,
          lat: 17.55,
          lon: 85.65,
          sog_kn: 104.2,
          kalman_status: "🚨 KINEMATIC VIOLATION · Implied Speed >100 kn over 126.2 km",
          rightship_rating: "⚠️ DG SHIPPING SECURITY ALERT · Potential Sanctions Evasion",
          highlighted: true,
          is_spoofed: true,
        };
      }

      if (live) {
        const isLiveSpoofed = Boolean(live.alerts && live.alerts.length > 0);
        return {
          ...base,
          lat: live.raw_lat,
          lon: live.raw_lon,
          sog_kn: live.sog,
          cog_deg: live.cog,
          kalman_status: isLiveSpoofed
            ? "🚨 SPOOFING_IMPOSSIBLE_SPEED_JUMP"
            : base.kalman_status,
          is_spoofed: isLiveSpoofed,
        };
      }

      return base;
    });
  }, [props.vessels, isSpoofedActive]);

  // When spoofing activates, automatically select M/V Bharat Pride to show the violation drawer
  useEffect(() => {
    if (isSpoofedActive) {
      const bharat = activeFleet.find((v) => v.mmsi === 419001234);
      if (bharat) {
        setSelectedVessel(bharat);
      }
    }
  }, [isSpoofedActive]);

  // D3 Projection for Indian Ocean Basin
  const projection = useMemo(() => {
    return geoMercator().center([92, 6]).scale(660).translate([600, 290]);
  }, []);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);
  const landData = useMemo(() => feature(countries as any, (countries as any).objects.countries) as any, []);
  const graticuleData = useMemo(() => geoGraticule10(), []);

  // Quick Action Handlers
  const toggleAllChokepoints = () => {
    setShowChokepoints((prev) => !prev);
  };

  const toggleChokepointId = (id: string) => {
    setShowChokepoints(true);
    setActiveChokepointIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    const target = CHOKEPOINTS_DATA.find((c) => c.id === id);
    if (target) {
      setSelectedChokepoint(target);
    }
  };

  const selectMahaAnand = () => {
    const vessel = activeFleet.find((v) => v.name.includes("MAHA ANAND"));
    if (vessel) {
      setSelectedVessel(vessel);
      setSelectedChokepoint(null);
      setSelectedPort(null);
    }
  };

  const selectBharatPride = () => {
    const vessel = activeFleet.find((v) => v.mmsi === 419001234);
    if (vessel) {
      setSelectedVessel(vessel);
      setSelectedChokepoint(null);
      setSelectedPort(null);
    }
  };

  const resetView = () => {
    setView({ x: 0, y: 0, scale: 1 });
  };

  const zoomIn = () => {
    setView((v) => ({ ...v, scale: Math.min(4, v.scale * 1.25) }));
  };

  const zoomOut = () => {
    setView((v) => ({ ...v, scale: Math.max(0.7, v.scale * 0.8) }));
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "#0c1726",
        borderRadius: "8px",
        overflow: "hidden",
        border: isSpoofedActive ? "2px solid #ef4444" : "1px solid #1f293d",
        boxShadow: isSpoofedActive ? "0 0 25px rgba(239, 68, 68, 0.35)" : "0 8px 24px rgba(0, 0, 0, 0.4)",
        transition: "border 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* 1. SCRIPT ACTION BUTTONS & CHOKEPOINT TOGGLE STRIP */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          padding: "10px 14px",
          background: isSpoofedActive ? "#1e1414" : "#111f36",
          borderBottom: isSpoofedActive ? "1px solid #7f1d1d" : "1px solid #233554",
          fontSize: "12px",
          color: "#e2e8f0",
          zIndex: 10,
          position: "relative",
          transition: "background 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Compass size={15} style={{ color: "#facc15" }} />
            Operational Controls:
          </span>

          {/* SCRIPT BUTTON 1: [Click chokepoint toggle] */}
          <button
            type="button"
            onClick={toggleAllChokepoints}
            className="gov-btn"
            style={{
              background: showChokepoints ? "#c2410c" : "#1e293b",
              color: "#ffffff",
              border: `1px solid ${showChokepoints ? "#ea580c" : "#475569"}`,
              padding: "5px 11px",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            title="Toggle visibility of strategic geopolitical and operational maritime chokepoints"
          >
            <ShieldAlert size={14} />
            {showChokepoints ? "Chokepoint Overlays: ON" : "Chokepoint Overlays: OFF"}
          </button>

          {/* SCRIPT BUTTON 2: [Enable Malacca Strait] */}
          <button
            type="button"
            onClick={() => toggleChokepointId("malacca")}
            className="gov-btn"
            style={{
              background: activeChokepointIds.malacca && showChokepoints ? "#ea580c" : "#1e293b",
              color: "#ffffff",
              border: `1px solid ${activeChokepointIds.malacca && showChokepoints ? "#f97316" : "#475569"}`,
              padding: "5px 11px",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            title="Enable Malacca Strait geopolitical risk circle & depth constraint limit"
          >
            <AlertTriangle size={13} style={{ color: "#fef08a" }} />
            {activeChokepointIds.malacca && showChokepoints ? "✓ Malacca Strait Active" : "Enable Malacca Strait"}
          </button>

          {/* SCRIPT BUTTON 3: [Enable Bab-el-Mandeb] */}
          <button
            type="button"
            onClick={() => toggleChokepointId("babelmandeb")}
            className="gov-btn"
            style={{
              background: activeChokepointIds.babelmandeb && showChokepoints ? "#b91c1c" : "#1e293b",
              color: "#ffffff",
              border: `1px solid ${activeChokepointIds.babelmandeb && showChokepoints ? "#dc2626" : "#475569"}`,
              padding: "5px 11px",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            title="Enable Bab-el-Mandeb Red Sea war risk circle (CONWARTIME 2004)"
          >
            <ShieldAlert size={13} style={{ color: "#fca5a5" }} />
            {activeChokepointIds.babelmandeb && showChokepoints ? "✓ Bab-el-Mandeb Active" : "Enable Bab-el-Mandeb"}
          </button>

          {/* SCRIPT BUTTON 4: [Click on M/V Maha Anand] */}
          <button
            type="button"
            onClick={selectMahaAnand}
            className="gov-btn"
            style={{
              background: "#047857",
              color: "#ffffff",
              border: "1px solid #10b981",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            title="Inspect M/V MAHA ANAND bulk carrier operational details, IMO, draft, and ETA"
          >
            <Ship size={14} />
            Click M/V Maha Anand (Bay of Bengal)
          </button>

          {/* SCRIPT BUTTON 5: [Test Spoofing Jump] */}
          <button
            type="button"
            onClick={handleSimulateSpoof}
            disabled={props.actionLoading}
            className="gov-btn"
            style={{
              background: isSpoofedActive ? "#991b1b" : "#b91c1c",
              color: "#ffffff",
              border: `1px solid ${isSpoofedActive ? "#ef4444" : "#dc2626"}`,
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: isSpoofedActive ? "0 0 10px rgba(239, 68, 68, 0.6)" : "0 2px 6px rgba(185, 28, 28, 0.4)",
            }}
            title="Inject an instantaneous 126km coordinate jump on M/V BHARAT PRIDE to test 4D Kalman spoofing detection"
          >
            <ShieldAlert size={14} />
            {isSpoofedActive ? "⚠️ 126km Spoof Jump Active" : "Test Spoofing Jump"}
          </button>

          {/* SCRIPT BUTTON 6: [Reset Fleet] */}
          {isSpoofedActive && (
            <button
              type="button"
              onClick={handleResetFleet}
              disabled={props.actionLoading}
              className="gov-btn gov-btn-secondary"
              style={{
                padding: "5px 11px",
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                background: "#1e293b",
                color: "#e2e8f0",
                border: "1px solid #475569",
              }}
              title="Reset fleet positions and clear kinematic alarms"
            >
              <RotateCcw size={13} />
              Reset Fleet
            </button>
          )}

          {/* SCRIPT BUTTON 7: [Click M/V Bharat Pride] */}
          <button
            type="button"
            onClick={selectBharatPride}
            className="gov-btn"
            style={{
              background: isSpoofedActive ? "#7f1d1d" : "#1e293b",
              color: "#ffffff",
              border: `1px solid ${isSpoofedActive ? "#ef4444" : "#475569"}`,
              padding: "5px 11px",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            title="Inspect M/V BHARAT PRIDE transponder fix and kinematic audit"
          >
            <AlertTriangle size={13} style={{ color: isSpoofedActive ? "#fca5a5" : "#94a3b8" }} />
            {isSpoofedActive ? "🚨 Inspect Flagged Bharat Pride" : "Inspect M/V Bharat Pride"}
          </button>
        </div>

        {/* Zoom & Pan View Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={zoomIn}
            className="gov-btn gov-btn-secondary"
            style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center" }}
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            className="gov-btn gov-btn-secondary"
            style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center" }}
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="gov-btn gov-btn-secondary"
            style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
            title="Reset Indian Ocean Basin View"
          >
            <RotateCcw size={12} />
            Reset View
          </button>
        </div>
      </div>

      {/* 2. MAP CANVAS AREA */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "560px",
          background: "#081325",
          cursor: dragRef.current ? "grabbing" : "grab",
          userSelect: "none",
        }}
        onWheel={(event) => {
          const factor = event.deltaY < 0 ? 1.15 : 0.87;
          setView((current) => ({
            ...current,
            scale: Math.min(4, Math.max(0.7, current.scale * factor)),
          }));
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y };
          setView((current) => ({ ...current }));
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          const drag = dragRef.current;
          setView((current) => ({
            ...current,
            x: drag.viewX + event.clientX - drag.x,
            y: drag.viewY + event.clientY - drag.y,
          }));
        }}
        onPointerUp={(event) => {
          dragRef.current = null;
          try {
            event.currentTarget.releasePointerCapture(event.pointerId);
          } catch {
            // ignore
          }
          setView((current) => ({ ...current }));
        }}
        onPointerCancel={() => {
          dragRef.current = null;
          setView((current) => ({ ...current }));
        }}
      >
        <svg
          viewBox="0 0 1200 560"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          {/* Defs for gradients, patterns and glow filters */}
          <defs>
            <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="chokepoint-grad-malacca" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#ea580c" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#c2410c" stopOpacity="0.0" />
            </radialGradient>
            <radialGradient id="chokepoint-grad-babel" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#b91c1c" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* Map Group with Pan & Zoom Transform */}
          <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
            {/* Graticule Grid */}
            <path
              d={pathGenerator(graticuleData) ?? undefined}
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.8"
              strokeOpacity="0.7"
            />

            {/* Ocean Tint */}
            <rect x="-1000" y="-1000" width="3500" height="3000" fill="#081426" opacity="0.3" pointerEvents="none" />

            {/* Land Polygons */}
            <path
              d={pathGenerator(landData) ?? undefined}
              fill="#182842"
              stroke="#2e4263"
              strokeWidth="1.2"
            />

            {/* LAYER: SHIPPING CORRIDORS */}
            {showCorridors &&
              CORRIDORS_DATA.map((corr) => {
                const linePath = pathGenerator({
                  type: "LineString",
                  coordinates: corr.coordinates,
                } as any);

                const isHovered = hoveredCorridor?.id === corr.id;

                return (
                  <g key={corr.id}>
                    {/* Invisible fat hit area for mouse cursor */}
                    <path
                      d={linePath ?? undefined}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="24"
                      cursor="pointer"
                      onMouseEnter={() => setHoveredCorridor(corr)}
                      onMouseLeave={() => setHoveredCorridor(null)}
                      onClick={() => setHoveredCorridor(corr)}
                    />
                    {/* Glowing background corridor line */}
                    <path
                      d={linePath ?? undefined}
                      fill="none"
                      stroke={corr.color}
                      strokeWidth={isHovered ? 6 : 3}
                      strokeOpacity={isHovered ? 0.9 : 0.6}
                      strokeDasharray={corr.id === "au-in" ? "10 6" : "8 5"}
                      style={{ transition: "stroke-width 0.2s ease" }}
                    />
                  </g>
                );
              })}

            {/* LAYER: STRATEGIC CHOKEPOINTS */}
            {showChokepoints &&
              CHOKEPOINTS_DATA.map((cp) => {
                const pt = projection([cp.lon, cp.lat]);
                if (!pt) return null;

                const isSpecificallyActive = activeChokepointIds[cp.id];
                const isSelected = selectedChokepoint?.id === cp.id;
                const isBabElMandeb = cp.id === "babelmandeb";
                const ringColor = isBabElMandeb ? "#ef4444" : "#f97316";

                return (
                  <g
                    key={cp.id}
                    transform={`translate(${pt[0]}, ${pt[1]})`}
                    cursor="pointer"
                    onClick={() => setSelectedChokepoint(cp)}
                  >
                    {/* Geopolitical Risk Circle (when enabled) */}
                    {isSpecificallyActive && (
                      <>
                        <circle
                          r="34"
                          fill={isBabElMandeb ? "url(#chokepoint-grad-babel)" : "url(#chokepoint-grad-malacca)"}
                        />
                        <circle
                          r="34"
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="2"
                          strokeDasharray="5 3"
                          opacity="0.85"
                        />
                        {/* Outer pulsing ring */}
                        <circle
                          r="46"
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="1.5"
                          opacity="0.4"
                        />
                      </>
                    )}

                    {/* Central Chokepoint Icon Node */}
                    <circle
                      r={isSelected ? "11" : "8"}
                      fill={ringColor}
                      stroke="#081325"
                      strokeWidth="2.5"
                    />
                    <text
                      y="-14"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="700"
                      letterSpacing="0.4"
                      style={{
                        paintOrder: "stroke",
                        stroke: "#0b1220",
                        strokeWidth: "3px",
                        strokeLinejoin: "round",
                      }}
                    >
                      {cp.name}
                    </text>
                  </g>
                );
              })}

            {/* LAYER: PORTS & TERMINALS */}
            {showPorts &&
              PORTS_DATA.map((port) => {
                const pt = projection([port.lon, port.lat]);
                if (!pt) return null;

                const isOrigin = port.role === "Origin";
                const isSelected = selectedPort?.id === port.id;

                return (
                  <g
                    key={port.id}
                    transform={`translate(${pt[0]}, ${pt[1]})`}
                    cursor="pointer"
                    onClick={() => {
                      setSelectedPort(port);
                      setSelectedChokepoint(null);
                    }}
                  >
                    <circle
                      r={isSelected ? 9 : isOrigin ? 6 : 5}
                      fill={isOrigin ? "#ec4899" : "#38bdf8"}
                      stroke="#081325"
                      strokeWidth="2"
                    />
                    <text
                      x="8"
                      y="4"
                      fill={isOrigin ? "#fbcfe8" : "#bae6fd"}
                      fontSize="9"
                      fontWeight={isSelected ? "700" : "500"}
                      style={{
                        paintOrder: "stroke",
                        stroke: "#0b1220",
                        strokeWidth: "2.5px",
                      }}
                    >
                      {port.name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}

            {/* LAYER: IMPOSSIBLE TRANSIT JUMP (SPOOFING ANOMALY VECTOR) */}
            {showVessels && isSpoofedActive && (() => {
              const origPt = projection([85.2, 16.5]);
              const jumpedPt = projection([85.65, 17.55]);
              if (!origPt || !jumpedPt) return null;
              const midX = (origPt[0] + jumpedPt[0]) / 2;
              const midY = (origPt[1] + jumpedPt[1]) / 2;
              return (
                <g key="spoofing-transit-jump-layer">
                  {/* Legitimate Last Known Fix Ghost Marker */}
                  <circle
                    cx={origPt[0]}
                    cy={origPt[1]}
                    r="8"
                    fill="rgba(56, 189, 248, 0.2)"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle cx={origPt[0]} cy={origPt[1]} r="3" fill="#38bdf8" />
                  <text
                    x={origPt[0] - 10}
                    y={origPt[1] + 16}
                    textAnchor="end"
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="bold"
                    style={{ paintOrder: "stroke", stroke: "#081325", strokeWidth: "3px" }}
                  >
                    📍 Last Valid Fix (16.50°N, 85.20°E)
                  </text>

                  {/* Impossible 126.2km Teleportation Vector Line */}
                  <line
                    x1={origPt[0]}
                    y1={origPt[1]}
                    x2={jumpedPt[0]}
                    y2={jumpedPt[1]}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    filter="url(#glow-red)"
                  />

                  {/* Pulsing Target Halo */}
                  <circle
                    cx={jumpedPt[0]}
                    cy={jumpedPt[1]}
                    r="26"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />

                  {/* Floating Tactical Label on Jump Vector */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-115"
                      y="-12"
                      width="230"
                      height="24"
                      rx="4"
                      fill="#7f1d1d"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      filter="url(#glow-red)"
                    />
                    <text
                      y="4"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      letterSpacing="0.3px"
                    >
                      🚨 126.2 km IMPOSSIBLE JUMP (&gt;100 kn)
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* LAYER: ACTIVE BULK CARRIER FLEET (LIVE SHIPS) */}
            {showVessels &&
              activeFleet.map((vessel) => {
                const pt = projection([vessel.lon, vessel.lat]);
                if (!pt) return null;

                const isMahaAnand = vessel.name.includes("MAHA ANAND");
                const isBharatPride = vessel.name.includes("BHARAT PRIDE");
                const isSpoofedVessel = vessel.is_spoofed || (isBharatPride && isSpoofedActive);
                const isSelected = selectedVessel?.mmsi === vessel.mmsi;

                return (
                  <g
                    key={vessel.mmsi}
                    transform={`translate(${pt[0]}, ${pt[1]})`}
                    cursor="pointer"
                    onClick={() => {
                      setSelectedVessel(vessel);
                      setSelectedChokepoint(null);
                      setSelectedPort(null);
                    }}
                  >
                    {/* Live Kinematic Beacon Ring */}
                    <circle
                      r={isSpoofedVessel ? "22" : isMahaAnand ? "16" : "12"}
                      fill={isSpoofedVessel ? "rgba(239, 68, 68, 0.2)" : "none"}
                      stroke={isSpoofedVessel ? "#ef4444" : isMahaAnand ? "#10b981" : "#38bdf8"}
                      strokeWidth={isSpoofedVessel ? "2" : "1.5"}
                      strokeDasharray={isSpoofedVessel ? "4 4" : undefined}
                      opacity={isSpoofedVessel ? "0.95" : "0.8"}
                    />
                    <circle
                      r={isSpoofedVessel ? "32" : isMahaAnand ? "24" : "18"}
                      fill="none"
                      stroke={isSpoofedVessel ? "#dc2626" : isMahaAnand ? "#10b981" : "#38bdf8"}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity={isSpoofedVessel ? "0.6" : "0.4"}
                    />

                    {/* Ship Vector Icon & Heading Arrow */}
                    <circle
                      r={isSpoofedVessel ? "10" : isMahaAnand ? "9" : "7"}
                      fill={isSpoofedVessel ? "#b91c1c" : isMahaAnand ? "#059669" : "#0284c7"}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Label */}
                    <text
                      y={isSpoofedVessel ? "26" : isMahaAnand ? "24" : "18"}
                      textAnchor="middle"
                      fill={isSpoofedVessel ? "#fca5a5" : isMahaAnand ? "#a7f3d0" : "#e0f2fe"}
                      fontSize={isSpoofedVessel ? "11" : isMahaAnand ? "11" : "9"}
                      fontWeight="bold"
                      style={{
                        paintOrder: "stroke",
                        stroke: "#0b1220",
                        strokeWidth: "3px",
                      }}
                    >
                      {isSpoofedVessel ? "🚨 " : "🚢 "}{vessel.name}{isSpoofedVessel ? " [SPOOFING ALERT]" : ""}
                    </text>
                    <text
                      y={isSpoofedVessel ? "38" : isMahaAnand ? "35" : "27"}
                      textAnchor="middle"
                      fill={isSpoofedVessel ? "#ef4444" : "#94a3b8"}
                      fontSize="8"
                      fontWeight={isSpoofedVessel ? "bold" : "normal"}
                      style={{
                        paintOrder: "stroke",
                        stroke: "#0b1220",
                        strokeWidth: "2px",
                      }}
                    >
                      {vessel.sog_kn} kn {isSpoofedVessel ? "· IMPOSSIBLE SPEED (>100 kn)" : `· Draft ${vessel.draft_m}m`}
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>

        {/* SPOOFING ANOMALY TOP FLOATING ALERT BANNER */}
        {isSpoofedActive && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(127, 29, 29, 0.95)",
              border: "1px solid #ef4444",
              borderRadius: "6px",
              padding: "7px 14px",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              zIndex: 9,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
          >
            <ShieldAlert size={16} style={{ color: "#fca5a5" }} />
            <span>
              <strong>KINEMATIC ANOMALY:</strong> M/V BHARAT PRIDE jumped 126.2 km (&gt;100 kn). 4D Kalman filter flagged <code>SPOOFING_IMPOSSIBLE_SPEED_JUMP</code>.
            </span>
            <button
              type="button"
              onClick={handleResetFleet}
              style={{
                background: "#ffffff",
                color: "#991b1b",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset Fleet
            </button>
          </div>
        )}

        {/* 3. LAYER BADGES & FRESHNESS STRIP OVERLAY */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", pointerEvents: "auto" }}>
            <span
              className="gov-tag"
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                color: "#38bdf8",
                border: "1px solid #1e293b",
                fontSize: "11px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Radio size={11} /> Live Vector GIS · 100% Air-Gapped Ready
            </span>
            <span
              className="gov-tag"
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                color: "#10b981",
                border: "1px solid #1e293b",
                fontSize: "11px",
              }}
            >
              5 Monitored Bulk Corridors Active
            </span>
          </div>
        </div>

        {/* 4. CORRIDOR HOVER CALLOUT CARD */}
        {hoveredCorridor && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              background: "rgba(15, 23, 42, 0.95)",
              border: `1px solid ${hoveredCorridor.color}`,
              borderRadius: "6px",
              padding: "10px 14px",
              color: "#e2e8f0",
              fontSize: "12px",
              zIndex: 8,
              maxWidth: "380px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Navigation size={14} style={{ color: hoveredCorridor.color }} />
              <strong style={{ color: "#ffffff", fontSize: "13px" }}>{hoveredCorridor.name}</strong>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Commodity: <strong>{hoveredCorridor.commodity}</strong>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
              Voyage Distance: <strong>{hoveredCorridor.distanceNm.toLocaleString()} nm</strong> &middot; Transit Time:{" "}
              <strong>{hoveredCorridor.steamingDays}</strong>
            </div>
          </div>
        )}

        {/* 5. CHOKEPOINT DETAIL POPUP */}
        {selectedChokepoint && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(15, 23, 42, 0.96)",
              border: `1px solid ${selectedChokepoint.id === "babelmandeb" ? "#ef4444" : "#f97316"}`,
              borderRadius: "6px",
              padding: "12px 16px",
              color: "#e2e8f0",
              fontSize: "12px",
              zIndex: 8,
              maxWidth: "320px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle
                  size={16}
                  style={{ color: selectedChokepoint.id === "babelmandeb" ? "#ef4444" : "#f97316" }}
                />
                <strong style={{ fontSize: "13px", color: "#ffffff" }}>{selectedChokepoint.name}</strong>
              </div>
              <button
                onClick={() => setSelectedChokepoint(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
              >
                <X size={15} />
              </button>
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "2px 6px",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: 700,
                background: selectedChokepoint.riskLevel === "CRITICAL" ? "#7f1d1d" : "#7c2d12",
                color: "#ffffff",
                marginBottom: "6px",
              }}
            >
              RISK: {selectedChokepoint.riskLevel}
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "#cbd5e1", lineHeight: 1.45 }}>
              {selectedChokepoint.impact}
            </p>
            <div style={{ marginTop: "8px", borderTop: "1px solid #334155", paddingTop: "6px", fontSize: "10px", color: "#94a3b8" }}>
              Coordinates: {selectedChokepoint.lat}&deg;N, {selectedChokepoint.lon}&deg;E &middot; Safe Navigational Radius:{" "}
              {selectedChokepoint.radiusKm} km
            </div>
          </div>
        )}

        {/* 6. PORT DETAIL POPUP */}
        {selectedPort && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid #38bdf8",
              borderRadius: "6px",
              padding: "12px 16px",
              color: "#e2e8f0",
              fontSize: "12px",
              zIndex: 8,
              maxWidth: "280px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <strong style={{ fontSize: "13px", color: "#38bdf8" }}>{selectedPort.name}</strong>
              <button
                onClick={() => setSelectedPort(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ fontSize: "11px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "3px" }}>
              <div>Category: <strong>{selectedPort.type.replace(/_/g, " ")}</strong></div>
              <div>Max Permissible Draft: <strong>{selectedPort.draft} m</strong></div>
              <div>Max Berth LOA: <strong>{selectedPort.loa} m</strong></div>
              <div>Coordinates: <strong>{selectedPort.lat}&deg;N, {selectedPort.lon}&deg;E</strong></div>
            </div>
          </div>
        )}

        {/* 7. SCRIPT REQUIRED: VESSEL DETAILS DRAWER / MODAL FOR M/V MAHA ANAND */}
        {selectedVessel && (() => {
          const isBharatPride = selectedVessel.name.includes("BHARAT PRIDE");
          const isVesselSpoofed = selectedVessel.is_spoofed || (isBharatPride && isSpoofedActive);

          return (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: "360px",
                background: "#0f172a",
                border: `2px solid ${isVesselSpoofed ? "#ef4444" : "#10b981"}`,
                borderRadius: "8px",
                padding: "14px 16px",
                color: "#e2e8f0",
                zIndex: 9,
                boxShadow: isVesselSpoofed ? "0 0 25px rgba(239, 68, 68, 0.5)" : "0 10px 30px rgba(0, 0, 0, 0.8)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: `1px solid ${isVesselSpoofed ? "#7f1d1d" : "#1e293b"}`,
                  paddingBottom: "8px",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <span
                    style={{
                      background: isVesselSpoofed ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.15)",
                      color: isVesselSpoofed ? "#fca5a5" : "#34d399",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      display: "inline-block",
                      marginBottom: "4px",
                      border: isVesselSpoofed ? "1px solid #ef4444" : "none",
                    }}
                  >
                    {isVesselSpoofed ? "🚨 SATELLITE KINEMATIC VIOLATION · BAY OF BENGAL" : "ACTIVE BULK CARRIER · BAY OF BENGAL"}
                  </span>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Ship size={18} style={{ color: isVesselSpoofed ? "#ef4444" : "#34d399" }} />
                    {selectedVessel.name}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVessel(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Operational Specs Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: "11px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ background: "#1e293b", padding: "6px 8px", borderRadius: "4px" }}>
                  <span style={{ color: "#94a3b8", display: "block" }}>IMO Number</span>
                  <strong style={{ color: "#ffffff", fontSize: "12px" }}>IMO {selectedVessel.imo}</strong>
                </div>

                <div style={{ background: "#1e293b", padding: "6px 8px", borderRadius: "4px" }}>
                  <span style={{ color: "#94a3b8", display: "block" }}>Flag & Registry</span>
                  <strong style={{ color: "#ffffff", fontSize: "12px" }}>{selectedVessel.flag} 🇮🇳</strong>
                </div>

                <div style={{ background: isVesselSpoofed ? "#450a0a" : "#1e293b", border: isVesselSpoofed ? "1px solid #dc2626" : "none", padding: "6px 8px", borderRadius: "4px" }}>
                  <span style={{ color: isVesselSpoofed ? "#fca5a5" : "#94a3b8", display: "block" }}>Current Speed</span>
                  <strong style={{ color: isVesselSpoofed ? "#f87171" : "#38bdf8", fontSize: "12px" }}>
                    {selectedVessel.sog_kn} knots {isVesselSpoofed ? "🚨" : ""}
                  </strong>
                </div>

                <div style={{ background: "#1e293b", padding: "6px 8px", borderRadius: "4px" }}>
                  <span style={{ color: "#94a3b8", display: "block" }}>Loaded Draft</span>
                  <strong style={{ color: "#facc15", fontSize: "12px" }}>{selectedVessel.draft_m} meters</strong>
                </div>

                <div style={{ background: "#1e293b", padding: "6px 8px", borderRadius: "4px", gridColumn: "1 / -1" }}>
                  <span style={{ color: "#94a3b8", display: "block" }}>Estimated Arrival (ETA)</span>
                  <strong style={{ color: "#34d399", fontSize: "12px" }}>
                    {selectedVessel.eta} @ {selectedVessel.destination}
                  </strong>
                </div>

                <div style={{ background: "#1e293b", padding: "6px 8px", borderRadius: "4px", gridColumn: "1 / -1" }}>
                  <span style={{ color: "#94a3b8", display: "block" }}>Cargo & Corridor</span>
                  <span style={{ color: "#e2e8f0" }}>{selectedVessel.cargo}</span>
                </div>
              </div>

              {/* Vetting & Kinematics */}
              <div
                style={{
                  borderTop: "1px solid #1e293b",
                  paddingTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "10px",
                  color: "#94a3b8",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} style={{ color: isVesselSpoofed ? "#ef4444" : "#10b981" }} />
                  <span>RightShip Vetting: <strong style={{ color: isVesselSpoofed ? "#fca5a5" : "#ffffff" }}>{selectedVessel.rightship_rating}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Radio size={13} style={{ color: isVesselSpoofed ? "#ef4444" : "#38bdf8" }} />
                  <span>Kinematic Validation: <strong style={{ color: isVesselSpoofed ? "#fca5a5" : "#38bdf8" }}>{selectedVessel.kalman_status}</strong></span>
                </div>

                {isVesselSpoofed && (
                  <button
                    type="button"
                    onClick={handleResetFleet}
                    className="gov-btn"
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      background: "#b91c1c",
                      color: "#ffffff",
                      border: "1px solid #ef4444",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "6px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={13} />
                    Clear Spoof Alarm & Reset Coordinates
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* 8. MAP CONTROLS & RISK LEGEND */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 5,
          }}
        >
          <RiskLegend />
        </div>
      </div>
    </div>
  );
}
