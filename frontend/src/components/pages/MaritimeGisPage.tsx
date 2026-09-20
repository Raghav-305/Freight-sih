import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { MapCanvas } from "../MapCanvas";
import { TermTooltip } from "../ui/TermTooltip";
import { MapPin, Navigation, Compass, AlertOctagon, ShieldCheck, Eye, Layers } from "lucide-react";

export const MaritimeGisPage: React.FC = () => {
  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Operations"
        title="Maritime Geospatial Intelligence"
        purpose="100% offline-capable vector maritime GIS displaying verified Indian major ports, international shipping corridors, strategic maritime chokepoints, and weather warning overlays."
        questionsAnswered={[
          "Which maritime corridors (Cape of Good Hope, Malacca, Lombok) are traversed by incoming coal shipments?",
          "Are active cyclone advisories or monsoon swells intersecting the planned voyage track?",
          "What are the precise spatial coordinates and anchorage zones for East Coast discharge terminals?",
        ]}
        truthClass="Static reference"
        lastUpdated="2026-09-20"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Toggle Shipping Corridors & Chokepoints"
        step2="Click Ports for Berth & Anchorage Specs"
        step3="Inspect Cyclone Warning Buffers & Sea States"
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
          <span className="gov-tag" style={{ background: "var(--sand-100)", color: "var(--ink)" }}>
            Ports & Corridors: <strong>Static Reference (Hydrographic Office)</strong>
          </span>
          <span className="gov-tag" style={{ background: "var(--sand-100)", color: "var(--ink)" }}>
            Weather & Swell: <strong>Demo Simulation / IMD Feed</strong>
          </span>
          <span className="gov-tag" style={{ background: "var(--sand-100)", color: "var(--ink)" }}>
            Offline Vector Fallback: <strong>100% Air-Gapped Ready</strong>
          </span>
        </div>
      </section>

      {/* 4. Main Geospatial Map Display */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Pillar 2 · Vector Cartography Display</span>
          <h3>Geospatial Corridors, Chokepoints & Terminal Nodes</h3>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <MapCanvas />
        </div>
      </section>

      {/* 5. Strategic Maritime Chokepoint Guides */}
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
            <Navigation size={18} style={{ color: "var(--gov-khaki-dark)" }} />
            <strong style={{ color: "var(--ink)" }}>Cape of Good Hope / Mozambique</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Coal liftings from Maputo/Richards Bay traverse the southern Indian Ocean westward of Madagascar. Winter southern ocean swells (May-September) typically require 1.5-knot speed reductions to preserve bunker efficiency and avoid hull slamming.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <AlertOctagon size={18} style={{ color: "var(--gov-risk)" }} />
            <strong style={{ color: "var(--ink)" }}>Bay of Bengal Cyclone Season</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Pre-monsoon (April-May) and post-monsoon (October-December) cyclone formations in the Bay of Bengal trigger port authority suspensions and anchorage evacuations at Paradip, Dhamra, and Gopalpur. Simulated alerts display safe holding anchorages outside storm radii.
          </p>
        </div>
      </section>

      {/* 6. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret maritime GIS intelligence"
        rules={[
          "All port locations, navigational fairways, and chokepoints are verified against National Hydrographic Office and Admiralty charts.",
          "Vessel tracks shown are representative Great Circle / rhumb line routes commonly utilized by dry bulk carriers.",
          "When operating completely offline without external tile servers, the map renders high-contrast offline boundary polygons.",
        ]}
        notAssumed={[
          "The GIS map is designed for strategic chartering decisions and is NOT an Electronic Chart Display and Information System (ECDIS) for SOLAS navigation.",
          "Real-time vessel AIS positions are simulated for demonstration purposes; operational vessel tracking requires integration with authorized coastal radar/AIS streams.",
          "Cyclone warnings represent simulated weather hazards and must be validated against official India Meteorological Department (IMD) bulletins.",
        ]}
      />
    </div>
  );
};
