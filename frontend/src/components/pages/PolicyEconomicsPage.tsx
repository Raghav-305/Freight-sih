import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { ScenarioComparator } from "../ScenarioComparator";
import { TermTooltip } from "../ui/TermTooltip";
import { Scale, Zap, Fuel, TrendingDown, Info, ShieldCheck } from "lucide-react";

export const PolicyEconomicsPage: React.FC = () => {
  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Economics"
        title="Policy & Economics Evaluation"
        purpose="Evaluate energy-normalized delivered costs ($USD/GJ) for power utilities (NTPC & State GENCOs), comparing landed costs of imported vs domestic coastal coal factoring in Gross Calorific Value (GCV)."
        questionsAnswered={[
          "What is the true delivered cost per gigajoule ($/GJ) after normalizing for Gross Calorific Value?",
          "At what ocean freight threshold does domestic coastal coal achieve landed price parity with imported coal?",
          "How do port tariffs, insurance, and inland freight impact the final burner-tip cost?",
        ]}
        truthClass="Modelled exposure"
        lastUpdated="2026-09-20"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Specify Coal Quality & GCV (kcal/kg)"
        step2="Input Freight, Insurance & Port Tariffs"
        step3="Compare Energy-Normalized $/GJ Delivered Costs"
      />

      {/* 3. Main Analytical Engine Container */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Pillar 1 · Landed Cost Parity Engine</span>
          <h3>Energy-Normalized ($USD/GJ) Coastal vs. Import Coal Parity</h3>
          <small style={{ color: "var(--ink-muted)", marginTop: "4px" }}>
            Delivered cost model compliant with Ministry of Power blending guidelines and Central Electricity Authority norms.
          </small>
        </div>

        {/* Embedded Sovereign Scenario Comparator */}
        <div style={{ marginTop: "1.5rem" }}>
          <ScenarioComparator />
        </div>
      </section>

      {/* 4. Strategic Guidance Cards */}
      <section className="market-grid" style={{ marginBottom: "2rem" }}>
        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Zap size={18} style={{ color: "var(--gov-khaki-dark)" }} />
            <strong style={{ color: "var(--ink)" }}>GCV Normalization Principle</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Comparing coal purely on a dollar-per-tonne ($/MT) basis is deceptive. Imported coal typically provides 5,000–6,000 kcal/kg, whereas domestic coastal coal ranges from 3,400–4,200 kcal/kg. Normalizing to $/GJ reflects actual heat energy delivered to the boilers.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Scale size={18} style={{ color: "var(--gov-khaki-dark)" }} />
            <strong style={{ color: "var(--ink)" }}>Coastal Rail-Sea-Rail (RSR) Parity</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Evaluating whether transporting domestic coal from Mahanadi or Eastern Coalfields via coastal shipping (Paradip/Dhamra to Ennore/Tuticorin) saves logistics costs versus all-rail routes or imported thermal coal.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <ShieldCheck size={18} style={{ color: "var(--gov-good)" }} />
            <strong style={{ color: "var(--ink)" }}>Regulatory Ash Blending</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            MOEFCC and CEA environmental guidelines restrict unblended high-ash coal combustion. Blending low-ash imported coal (8-12% ash) with domestic coal (35-45% ash) achieves compliance while optimizing landed energy expenditure.
          </p>
        </div>
      </section>

      {/* 5. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret policy and economic comparisons"
        rules={[
          "Landed cost is calculated as: FOB Coal + Ocean Freight + Marine Insurance + Port Dues & Cargo Handling + Inland Rail Transport.",
          "The $/GJ metric converts $/MT using the formula: ($/MT) / (GCV kcal/kg × 0.004184 GJ/kcal).",
          "Rankings always display the specific ranking criterion (e.g. 'Ranked by: $/GJ Landed Cost' or 'Ranked by: Delivered $/MT').",
        ]}
        notAssumed={[
          "Delivered energy costs do NOT include plant-specific boiler maintenance variations stemming from differing ash fusion temperatures.",
          "Customs duty, GST compensation cess, and clean energy cess should be confirmed against current Ministry of Finance tariff schedules.",
          "Port storage and demurrage beyond standard free days are excluded from the baseline scenario and must be factored separately.",
        ]}
      />
    </div>
  );
};
