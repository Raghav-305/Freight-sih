import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { MapCanvas } from "../MapCanvas";
import { LiveAisStreamingPanel } from "../LiveAisStreamingPanel";
import { TermTooltip } from "../ui/TermTooltip";
import { MapPin, Navigation, Compass, AlertOctagon, ShieldCheck, Eye, Layers, Radio, ArrowRight, ShieldAlert } from "lucide-react";

interface MaritimeGisPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const MaritimeGisPage: React.FC<MaritimeGisPageProps> = ({ onNavigateTab }) => {
  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Operations"
        title="Maritime Geospatial Intelligence & Live Satellite AIS"
        purpose="100% offline-capable vector maritime GIS with real-time AIS satellite streaming, constant-velocity Kalman trajectory filtering, and kinematic spoofing anomaly detection."
        questionsAnswered={[
          "Which maritime corridors (Australia, Indonesia, Mozambique) are traversed by incoming coal shipments?",
          "How do geopolitical chokepoints (Malacca Strait, Bab-el-Mandeb) impact voyage transit time and insurance risk?",
          "Are incoming vessels maintaining normal kinematic transit, or exhibiting transponder spoofing jumps?",
        ]}
        truthClass="Live Satellite + Kalman Filter"
        lastUpdated="2026-09-24"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Inspect Vector Maritime Map, Bulk Corridors & Chokepoints"
        step2="Click M/V Maha Anand to Reveal Operational IMO, Draft & ETA"
        step3="Scroll to Live AIS Telemetry & Test Kinematic Spoofing Jump"
      />

      {/* 3. Layer Lineage and Truth Class Strip */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "10px 16px",
          background: "var(--paper)",
          border: "1px solid var(--gov-border)",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={16} style={{ color: "var(--gov-khaki-dark)" }} />
          <strong>GIS Data Layer Lineage:</strong>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <span className="gov-tag" style={{ background: "rgba(22, 101, 52, 0.12)", color: "var(--olive)" }}>
            <Radio size={12} style={{ marginRight: "4px" }} /> Live AIS Telemetry: <strong>4D Kalman Stream Active</strong>
          </span>
          <span className="gov-tag" style={{ background: "var(--sand-100)", color: "var(--ink)" }}>
            Corridors: <strong>Australia &middot; Indonesia &middot; Mozambique</strong>
          </span>
          <span className="gov-tag" style={{ background: "var(--sand-100)", color: "var(--ink)" }}>
            Ports & Terminals: <strong>16 Indian Major & Bulk Terminals</strong>
          </span>
          <span className="gov-tag" style={{ background: "var(--sand-100)", color: "var(--ink)" }}>
            Offline Vector Fallback: <strong>100% Air-Gapped Ready</strong>
          </span>
        </div>
      </section>

      {/* 4. MAIN GEOSPATIAL MAP DISPLAY (Placed on top per voiceover script) */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Pillar 2 · Vector Cartography Display</span>
          <h3>Geospatial Corridors, Chokepoints & Fleet Tracking</h3>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <MapCanvas />
        </div>
      </section>

      {/* 5. LIVE AIS SATELLITE STREAM & KALMAN TRAJECTORY FILTER PANEL (Below the map per script) */}
      <section style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Pillar 2 · Kinematic Telemetry Layer</span>
          <h3>Live Satellite AIS Streaming & Spoofing Detection Panel</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--ink-muted)" }}>
            Continuous 4D state-space Kalman filtering <code>[lat, lon, v_lat, v_lon]</code> comparing raw satellite GPS against filtered estimates to audit kinematic sanity.
          </p>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <LiveAisStreamingPanel />
        </div>
      </section>

      {/* 6. Strategic Maritime Chokepoint Guides */}
      <section className="market-grid" style={{ marginBottom: "2rem" }}>
        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Compass size={18} style={{ color: "var(--gov-khaki-dark)" }} />
            <strong style={{ color: "var(--ink)" }}>Strait of Malacca (Indonesian Coal)</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Vessels loading at South/East Kalimantan transiting to Indian East Coast ports utilize the Malacca or Singapore Straits. Under 20m depth restrictions at Phillips Channel, deep Capesize vessels may re-route via the Sunda or Lombok Straits, adding 3-5 steaming days.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <ShieldAlert size={18} style={{ color: "var(--gov-risk)" }} />
            <strong style={{ color: "var(--ink)" }}>Bab-el-Mandeb / Red Sea War Risk</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Geopolitical conflict zone at the southern entrance to the Red Sea. Under BIMCO CONWARTIME 2004 provisions, vessels trading or ballasting near the Gulf of Aden are subject to war risk insurance surcharges or mandatory diversion around the Cape of Good Hope.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <AlertOctagon size={18} style={{ color: "var(--gov-risk)" }} />
            <strong style={{ color: "var(--ink)" }}>Bay of Bengal Cyclone Season</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Pre-monsoon (April-May) and post-monsoon (October-December) cyclone formations in the Bay of Bengal trigger port authority suspensions and anchorage evacuations at Paradip, Dhamra, and Gopalpur.
          </p>
        </div>
      </section>

      {/* 7. SCRIPT NAVIGATION: PROCEED TO RISK INTELLIGENCE */}
      {onNavigateTab && (
        <div
          style={{
            padding: "16px 20px",
            background: "var(--paper)",
            border: "1px solid var(--gov-border)",
            borderRadius: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "2rem",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--gov-khaki-dark)", textTransform: "uppercase" }}>
              Next Workflow Step &middot; Chapter 4
            </span>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>
              Assess Corridor-Level Multi-Dimensional Exposure
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("risk")}
            className="gov-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <span>Click Risk Intelligence</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* 8. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret maritime GIS intelligence"
        rules={[
          "All port locations, navigational fairways, and chokepoints are verified against National Hydrographic Office and Admiralty charts.",
          "Vessel tracks shown are representative Great Circle / rhumb line routes commonly utilized by dry bulk carriers.",
          "When operating completely offline without external tile servers, the map renders high-contrast offline boundary polygons.",
        ]}
        notAssumed={[
          "The GIS map is designed for strategic chartering decisions and is NOT an Electronic Chart Display and Information System (ECDIS) for SOLAS navigation.",
          "Real-time vessel AIS streams utilize persistent WebSocket ingestion from AISStream.io coupled with constant-velocity Kalman filtering to bridge coverage blindspots and alert on kinematic spoofing jumps.",
          "Cyclone warnings represent simulated weather hazards and must be validated against official India Meteorological Department (IMD) bulletins.",
        ]}
      />
    </div>
  );
};
