import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EligibilityMatrix } from "../EligibilityMatrix";
import { TermTooltip } from "../ui/TermTooltip";
import { Anchor, Clock, AlertTriangle, ShieldAlert, CheckCircle2, Waves, Compass } from "lucide-react";

export const PortOperationsPage: React.FC = () => {
  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Operations"
        title="Port Physical Operations & Berth Eligibility"
        purpose="Verify physical vessel feasibility against official port berth notices (LOA, Beam, Arrival Draft) with high-tide conditional access and quantify statistical modelled delay exposure."
        questionsAnswered={[
          "Can the chartered vessel safely berth at Paradip, Dhamra, or Vizag given its draft and beam?",
          "Does berthing require high-water tidal assistance or daytime-only navigation windows?",
          "What is the statistical P10 / P50 / P90 waiting time and associated daily charter cost exposure?",
        ]}
        truthClass="Modelled exposure"
        lastUpdated="2026-09-20"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Specify Vessel LOA, Beam & Max Draft"
        step2="Select Discharge Port & Target Berth"
        step3="Inspect Eligibility & Modelled Delay Exposure"
      />

      {/* 3. Main Analytical Engine Container */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Pillar 4 · Operational Berth Compatibility Engine</span>
          <h3>Berth LOA / Beam / Draft Constraints & Modelled Delay Exposure</h3>
          <small style={{ color: "var(--ink-muted)", marginTop: "4px" }}>
            Real-time validation against published Major Port Trust berth specifications and historical waiting distributions.
          </small>
        </div>

        {/* Embedded Eligibility Matrix Component */}
        <div style={{ marginTop: "1.5rem" }}>
          <EligibilityMatrix />
        </div>
      </section>

      {/* 4. Critical Distinction Callout & Port Parameters */}
      <section className="market-grid" style={{ marginBottom: "2rem" }}>
        <div
          className="market-card"
          style={{
            borderLeft: "4px solid var(--gov-caution)",
            gridColumn: "span 2",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <AlertTriangle size={20} style={{ color: "var(--gov-caution)" }} />
            <strong style={{ color: "var(--ink)", fontSize: "15px" }}>
              Critical Operational Distinction: Modelled Delay Exposure vs Contractual Demurrage
            </strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.6 }}>
            <strong>Modelled delay exposure</strong> is a statistical estimation derived from AIS tracking and historical berth occupancy (P10, P50, P90 percentiles) multiplied by the daily vessel charter rate. It is <strong>NOT</strong> contractual demurrage. Demurrage liability is strictly governed by the governing charter party laytime terms, Notice of Readiness (NOR) tendering validity, weather working days (WWD), and specific SHINC/SHEX contractual clauses.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Waves size={18} style={{ color: "var(--gov-khaki-dark)" }} />
            <strong style={{ color: "var(--ink)" }}>Tidal Draft & Neap Windows</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Certain deep-draft berths (e.g. Paradip IOB, Dhamra) permit vessels exceeding 14.5m draft only during spring high water tides (+2.5m chart datum). Vessels arriving during neap tide periods face anchorage wait times until tidal rise permits safe channel transit.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Anchor size={18} style={{ color: "var(--gov-khaki-dark)" }} />
            <strong style={{ color: "var(--ink)" }}>Air Draft & Crane Clearance</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Alongside waterline draft limits, air draft restrictions (distance from sea surface to highest mast/hatch coaming) apply at ports with conveyor gallery bridges or tidal boom unloaders. Ballast management must maintain required air clearance upon arrival.
          </p>
        </div>
      </section>

      {/* 5. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret port eligibility and delay exposures"
        rules={[
          "ELIGIBLE indicates vessel physical dimensions (LOA, beam, draft) fall strictly within official berth limits at all tide stages.",
          "ELIGIBLE_WITH_CONDITION indicates clearance depends on specific operational factors, such as high water tide, daylight navigation, or selective hatch sequence de-ballasting.",
          "INELIGIBLE indicates physical constraints prevent safe alongside berthing; lighterage or transshipment at anchorage is mandatory.",
          "Delay exposure figures display P10 (optimistic), P50 (median expected), and P90 (congested) waiting periods based on empirical port turnaround datasets.",
        ]}
        notAssumed={[
          "Eligibility does NOT guarantee an immediate open berth; vessel priority protocols (e.g. coastal cargo priority, thermal power coal guidelines) determine actual queue allocation.",
          "Harbour master directives regarding channel dredging or temporary navigation closures take immediate legal precedence over published guidelines.",
          "Modelled delay exposure costs do not alter or prejudice the charter party laytime calculation submitted under maritime law.",
        ]}
      />
    </div>
  );
};
