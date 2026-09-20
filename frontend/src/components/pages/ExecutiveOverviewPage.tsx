import React, { useRef } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EmptyState } from "../ui/EmptyState";
import { TermTooltip } from "../ui/TermTooltip";
import { PageTab } from "../ui/GovSidebar";
import {
  Sparkles,
  ArrowRight,
  Shield,
  HardDrive,
  FileCheck2,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Anchor,
  LayoutDashboard,
  CheckCircle2,
  Circle,
  HelpCircle,
} from "lucide-react";

interface ExecutiveOverviewPageProps {
  marketInputs: {
    origin: string;
    destination: string;
    vessel_class: string;
    as_of_date: string;
  };
  setMarketInputs: React.Dispatch<React.SetStateAction<{
    origin: string;
    destination: string;
    vessel_class: string;
    as_of_date: string;
  }>>;
  onGenerateMarketIntelligence: () => void;
  marketLoading: boolean;
  market: any;
  marketContext: any;
  onNavigateTab: (tab: PageTab) => void;
  visitedTabs: Set<string>;
  onStartTour: () => void;
}

export const ExecutiveOverviewPage: React.FC<ExecutiveOverviewPageProps> = ({
  marketInputs,
  setMarketInputs,
  onGenerateMarketIntelligence,
  marketLoading,
  market,
  marketContext,
  onNavigateTab,
  visitedTabs,
  onStartTour,
}) => {
  const { t } = useTranslation();
  const formRef = useRef<HTMLDivElement>(null);

  const handleStartAnalysis = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoadExample = () => {
    const today = new Date().toISOString().slice(0, 10);
    setMarketInputs({
      origin: "Australia",
      destination: "Dhamra",
      vessel_class: "Panamax",
      as_of_date: today,
    });
  };

  // 12-step review workflow items
  const workflowSteps: { id: PageTab; number: number; title: string; desc: string }[] = [
    { id: "overview", number: 1, title: "Market", desc: "Understand current freight environment." },
    { id: "forecast", number: 2, title: "Forecast", desc: "Estimate rate range and driving factors." },
    { id: "opportunity", number: 3, title: "Opportunity", desc: "Judge whether fixing window is favourable." },
    { id: "vessels", number: 4, title: "Vessel", desc: "Find ships that fit the cargo and port." },
    { id: "ports", number: 5, title: "Port", desc: "Confirm berth access and delay exposure." },
    { id: "risk", number: 6, title: "Risk", desc: "Review route and port risks and mitigations." },
    { id: "scenarios", number: 7, title: "Economics", desc: "Compare landed and energy cost across sources." },
    { id: "charter", number: 8, title: "Portfolio", desc: "Split cargo across spot, COA and period contracts." },
    { id: "map", number: 9, title: "GIS", desc: "Check route geography and maritime chokepoints." },
    { id: "quality", number: 10, title: "Data Quality", desc: "Confirm inputs are complete and ISO 8000 verified." },
    { id: "models", number: 11, title: "Model", desc: "Note active model version supporting the analysis." },
    { id: "governance", number: 12, title: "Governance", desc: "Record decision trail and submit for DoFP review." },
  ];

  const reviewedCount = visitedTabs.size;

  // Output guide terms
  const resultGuideItems = [
    { term: "Market regime", explanation: "The overall direction of freight. Bullish points to rising rates, bearish to falling, neutral to a steady market." },
    { term: "Chartering signal", explanation: "A practical posture such as monitor, wait or consider fixing. It shapes where you look next, not what you approve." },
    { term: "Freight direction", explanation: "Whether rates are expected to rise, fall or stay stable over the 30-day horizon." },
    { term: "Volatility", explanation: "How uncertain the market is. Higher volatility means more risk in waiting or committing." },
    { term: "Bullish / neutral / bearish probabilities", explanation: "How confident the assessment is in each direction. Look at the spread as well as the leader." },
    { term: "Bunker pressure", explanation: "Whether fuel cost (VLSFO) is adding to procurement risk and landed cost burden." },
    { term: "Bunker and coal prices", explanation: "Reference benchmark prices that directly affect voyage and delivered energy costs." },
    { term: "FFA curve", explanation: "Forward freight agreement prices for future periods, showing what financial derivative markets expect." },
    { term: "Coal imports", explanation: "Summary of monthly import volume on the route, indicating demand intensity." },
    { term: "Market events", explanation: "Active market, weather or geopolitical alerts that may disrupt shipping or port turnaround." },
    { term: "Fixture history", explanation: "Number of past fixtures and their average rate, useful as an empirical reality check." },
  ];

  // Critical cautions
  const resultGuideCautions = [
    "A bullish signal is not an instruction to fix freight immediately.",
    "A good opportunity signal is a screening result and does not authorize a purchase.",
    "Reference and demo data are not live market feeds. Check the label on each figure.",
    "A forecast is a range, not a guaranteed price.",
    "A model being registered does not mean every page uses it.",
    "A generated recommendation is not an approval under the Delegation of Financial Powers.",
  ];

  return (
    <div className="tab-content">
      {/* 1. LANDING HERO */}
      <section
        style={{
          backgroundColor: "var(--ink)",
          color: "var(--white)",
          padding: "36px 32px",
          borderRadius: "var(--radius)",
          marginBottom: "28px",
          border: "1px solid var(--charcoal)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ maxWidth: "860px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--sand-100)",
              marginBottom: "8px",
              padding: "2px 8px",
              backgroundColor: "var(--charcoal)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--khaki-700)",
            }}
          >
            {t("overview.landingHeroEyebrow")}
          </span>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--white)",
              margin: "6px 0 12px 0",
              fontFamily: "var(--font-serif)",
              lineHeight: 1.2,
            }}
          >
            {t("overview.landingHeroHeadline")}
          </h1>

          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "var(--sand-100)",
              margin: "0 0 24px 0",
            }}
          >
            {t("overview.landingHeroBody")}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
            <button
              type="button"
              onClick={handleStartAnalysis}
              style={{
                backgroundColor: "var(--khaki-300)",
                color: "var(--ink)",
                border: "1px solid var(--khaki-300)",
                padding: "10px 20px",
                fontWeight: 700,
              }}
            >
              <span>{t("overview.startAnalysis")}</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={onStartTour}
              style={{
                backgroundColor: "transparent",
                color: "var(--white)",
                border: "1px solid var(--khaki-500)",
                padding: "10px 18px",
              }}
            >
              <span>{t("overview.takeTour")}</span>
            </button>
          </div>

          {/* Trust strip (three badges) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
              borderTop: "1px solid var(--charcoal)",
              paddingTop: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--sand-100)" }}>
              <Shield size={14} style={{ color: "var(--khaki-300)", flexShrink: 0 }} />
              <span>{t("overview.trustBadge1")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--sand-100)" }}>
              <HardDrive size={14} style={{ color: "var(--khaki-300)", flexShrink: 0 }} />
              <span>{t("overview.trustBadge2")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--sand-100)" }}>
              <FileCheck2 size={14} style={{ color: "var(--khaki-300)", flexShrink: 0 }} />
              <span>{t("overview.trustBadge3")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT THIS MODULE HERO PANEL */}
      <PageHero
        pillar="Command Center"
        title="Executive Command Center · Market Signals & Advisory"
        purpose="Track market regime, price movements, Baltic benchmarks, forward freight expectations, and review progress across all sovereign decision pillars."
        questions={[
          "What is the current freight rate direction and 30-day volatility for my coal route?",
          "Are macro indicators (<TermTooltip term='BDI / BPI'>BDI/BPI</TermTooltip>, bunker fuel) supporting a decision to fix or wait?",
          "How confident is the model in bullish versus bearish market postures?",
          "Which operational, risk, and economic modules should be examined next for this route?",
        ]}
      />

      {/* 3. HOW TO USE THIS PAGE STRIP */}
      <HowToSteps
        onLoadExample={handleLoadExample}
        exampleLabel="Load example (Australia → Dhamra, Panamax, today)"
        steps={[
          {
            number: "1",
            title: "Enter",
            description: "Select origin, destination, vessel class and date, or press 'Load example'.",
          },
          {
            number: "2",
            title: "Run",
            description: "Press 'Generate market intelligence'. The platform assembles the market picture for that route.",
          },
          {
            number: "3",
            title: "Interpret",
            description: "Read the signal, then move to Forecast, Vessel and Port pages for detail. This page never approves anything.",
          },
        ]}
      />

      {/* 4. MARKET INTELLIGENCE FORM */}
      <div ref={formRef} style={{ scrollMarginTop: "20px" }}>
        <section
          style={{
            backgroundColor: "var(--white)",
            border: "1px solid var(--khaki-300)",
            borderRadius: "var(--radius)",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--khaki-700)",
              }}
            >
              Route Parameters
            </span>
            <h3 style={{ fontSize: "1.125rem", margin: "4px 0 6px 0", fontFamily: "var(--font-serif)" }}>
              {t("overview.formTitle")}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0 }}>
              {t("overview.formIntro")}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onGenerateMarketIntelligence();
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {/* Origin */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  {t("overview.fieldOrigin")}
                </label>
                <select
                  value={marketInputs.origin}
                  onChange={(e) => setMarketInputs({ ...marketInputs, origin: e.target.value })}
                >
                  {["Australia", "Indonesia", "Mozambique", "Russia", "USA"].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                  {t("overview.originHelp")}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  {t("overview.fieldDestination")}
                </label>
                <select
                  value={marketInputs.destination}
                  onChange={(e) => setMarketInputs({ ...marketInputs, destination: e.target.value })}
                >
                  {["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                  {t("overview.destinationHelp")}
                </div>
              </div>

              {/* Vessel Class */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  {t("overview.fieldVesselClass")}
                </label>
                <select
                  value={marketInputs.vessel_class}
                  onChange={(e) => setMarketInputs({ ...marketInputs, vessel_class: e.target.value })}
                >
                  {["Panamax", "Supramax", "Capesize", "Handysize"].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                  {t("overview.vesselClassHelp")}
                </div>
              </div>

              {/* As of Date */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  {t("overview.fieldAsOfDate")}
                </label>
                <input
                  type="date"
                  value={marketInputs.as_of_date}
                  onChange={(e) => setMarketInputs({ ...marketInputs, as_of_date: e.target.value })}
                />
                <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                  {t("overview.asOfDateHelp")}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button type="submit" disabled={marketLoading} className="btn-primary">
                <span>{marketLoading ? "Loading Intelligence..." : t("overview.generateMarketIntelligence")}</span>
              </button>
              <button type="button" onClick={handleLoadExample} className="btn-secondary">
                <Sparkles size={13} style={{ color: "var(--khaki-700)" }} />
                <span>{t("overview.loadExample")}</span>
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* 5. RESULTS GRID OR EMPTY STATE */}
      {!market ? (
        <EmptyState
          title={t("overview.emptyStateTitle")}
          description={t("overview.emptyStateText")}
          onLoadExample={handleLoadExample}
          exampleButtonLabel="Load example & Run"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
          {/* Primary Macro Signals */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Regime Card */}
            <div
              style={{
                backgroundColor: "var(--white)",
                border: "1px solid var(--khaki-300)",
                borderRadius: "var(--radius)",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                Market Regime
              </span>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", margin: "4px 0" }}>
                {market.market_regime}
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--charcoal)", margin: 0 }}>
                {market.market_regime_interpretation}
              </p>
            </div>

            {/* Chartering Signal */}
            <div
              style={{
                backgroundColor: "var(--white)",
                border: "1px solid var(--khaki-300)",
                borderRadius: "var(--radius)",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                Chartering Signal
              </span>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--olive)", margin: "4px 0" }}>
                {market.chartering_signal}
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--charcoal)", margin: 0 }}>
                {market.freight_direction} · {market.market_volatility} Volatility
              </p>
            </div>

            {/* Probabilities */}
            <div
              style={{
                backgroundColor: "var(--white)",
                border: "1px solid var(--khaki-300)",
                borderRadius: "var(--radius)",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                Regime Probabilities
              </span>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", margin: "4px 0" }}>
                Bullish {market.probabilities ? Math.round(market.probabilities.bullish * 100) : 0}%
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--charcoal)" }}>
                Neutral {market.probabilities ? Math.round(market.probabilities.neutral * 100) : 0}% · Bearish {market.probabilities ? Math.round(market.probabilities.bearish * 100) : 0}%
              </div>
            </div>

            {/* Bunker Pressure */}
            <div
              style={{
                backgroundColor: "var(--white)",
                border: "1px solid var(--khaki-300)",
                borderRadius: "var(--radius)",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                Bunker Pressure (<TermTooltip term="VLSFO" />)
              </span>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", margin: "4px 0" }}>
                {market.bunker_pressure}
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--charcoal)", margin: 0 }}>
                Bunker ${market.bunker}/MT · Coal ${market.coal}/MT
              </p>
            </div>
          </div>

          {/* Context Rows (FFA, Imports, Events, Fixtures) */}
          {marketContext && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--sand-100)", borderRadius: "var(--radius)", padding: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                  <TermTooltip term="FFA">FFA Curve</TermTooltip>
                </span>
                <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)", margin: "4px 0" }}>
                  {marketContext.ffa?.map((p: any) => `${p.period}: $${p.price}`).join(" · ") || "Flat"}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--charcoal)" }}>Forward freight agreements</div>
              </div>

              <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--sand-100)", borderRadius: "var(--radius)", padding: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                  Coal Imports
                </span>
                <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)", margin: "4px 0" }}>
                  {marketContext.import_summary ? `${(marketContext.import_summary.quantity_mt / 1000000).toFixed(2)}M MT` : "4.82M MT"}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--charcoal)" }}>Monthly import volume on route</div>
              </div>

              <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--sand-100)", borderRadius: "var(--radius)", padding: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                  Active Events
                </span>
                <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)", margin: "4px 0" }}>
                  {marketContext.active_events?.length ?? 0} Events Monitored
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--charcoal)" }}>Geopolitical, chokepoint & weather alerts</div>
              </div>

              <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--sand-100)", borderRadius: "var(--radius)", padding: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                  Fixture History
                </span>
                <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)", margin: "4px 0" }}>
                  {marketContext.fixtures?.fixture_count ?? 0} Recorded Fixtures
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--charcoal)" }}>
                  {marketContext.fixtures?.average_rate ? `Avg: $${marketContext.fixtures.average_rate.toFixed(2)}/MT` : "Empirical market fixtures"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. RESULT GUIDE ("Read the result correctly" & "What not to assume") */}
      <ResultGuide items={resultGuideItems} cautions={resultGuideCautions} />

      {/* 7. THE FIVE PILLARS (Capability Cards) */}
      <section style={{ marginTop: "36px" }}>
        <div style={{ marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--khaki-700)" }}>
            Sovereign Capabilities
          </span>
          <h3 style={{ fontSize: "1.25rem", margin: "4px 0 6px 0", fontFamily: "var(--font-serif)" }}>
            The Five Pillars of Freight Intelligence
          </h3>
          <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0 }}>
            Every pillar addresses a distinct dimension of maritime procurement and decision governance.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {/* Economics */}
          <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <TrendingUp size={16} style={{ color: "#1D4ED8" }} />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Economics (Policy & Economics)</h4>
              </div>
              <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0, lineHeight: 1.4 }}>
                Compare landed cost and energy cost across import and coastal coal options. Find the cheapest source per tonne and per unit of energy (<TermTooltip term="GCV" />).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("scenarios")}
              className="btn-outline"
              style={{ marginTop: "16px", width: "fit-content", fontSize: "11px", padding: "4px 10px" }}
            >
              <span>Open module</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Maritime GIS */}
          <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <MapPin size={16} style={{ color: "#15803D" }} />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Maritime GIS</h4>
              </div>
              <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0, lineHeight: 1.4 }}>
                See ports, shipping corridors, chokepoints and advisories on a map. Understand the physical maritime geography behind every voyage route.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("map")}
              className="btn-outline"
              style={{ marginTop: "16px", width: "fit-content", fontSize: "11px", padding: "4px 10px" }}
            >
              <span>Open module</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Governance */}
          <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <ShieldCheck size={16} style={{ color: "#7E22CE" }} />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Governance (CVC Governance)</h4>
              </div>
              <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0, lineHeight: 1.4 }}>
                Record, review and approve decisions with a full audit trail under CVC and GFR 2017 standards. No important reasoning is lost in email or spreadsheets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("governance")}
              className="btn-outline"
              style={{ marginTop: "16px", width: "fit-content", fontSize: "11px", padding: "4px 10px" }}
            >
              <span>Open module</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Port Operations */}
          <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Anchor size={16} style={{ color: "#C2410C" }} />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Port Operations</h4>
              </div>
              <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0, lineHeight: 1.4 }}>
                Check whether a vessel physically fits a berth, and estimate what delay could cost (<TermTooltip term="Modelled delay exposure" />). Catch problems before a ship is fixed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("ports")}
              className="btn-outline"
              style={{ marginTop: "16px", width: "fit-content", fontSize: "11px", padding: "4px 10px" }}
            >
              <span>Open module</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Command Center */}
          <div style={{ backgroundColor: "var(--paper)", border: "2px solid var(--charcoal)", borderRadius: "var(--radius)", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <LayoutDashboard size={16} style={{ color: "var(--ink)" }} />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Command Center</h4>
              </div>
              <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0, lineHeight: 1.4 }}>
                Track market direction, model status, data freshness and review status in one view.
              </p>
            </div>
            <span
              style={{
                marginTop: "16px",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--ink)",
                display: "inline-block",
                padding: "3px 8px",
                backgroundColor: "var(--white)",
                border: "1px solid var(--khaki-500)",
                borderRadius: "var(--radius-sm)",
                width: "fit-content",
              }}
            >
              ✓ You are here
            </span>
          </div>
        </div>
      </section>

      {/* 8. RECOMMENDED REVIEW WORKFLOW (12 Steps) */}
      <section style={{ marginTop: "36px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--khaki-700)" }}>
              Governed Review Process
            </span>
            <h3 style={{ fontSize: "1.25rem", margin: "4px 0 6px 0", fontFamily: "var(--font-serif)" }}>
              Recommended Review Workflow (12 Steps)
            </h3>
            <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0, maxWidth: "680px" }}>
              The order can change with the business question. The principle is to combine market, model, operational, economic and governance evidence rather than rely on a single score.
            </p>
          </div>

          <div
            style={{
              padding: "8px 14px",
              backgroundColor: "var(--white)",
              border: "1px solid var(--khaki-300)",
              borderRadius: "var(--radius)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            {t("overview.progressText", { reviewed: reviewedCount })}
          </div>
        </div>

        {/* 12-Step Clickable Stepper Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {workflowSteps.map((s) => {
            const isReviewed = visitedTabs.has(s.id);
            return (
              <div
                key={s.id}
                onClick={() => onNavigateTab(s.id)}
                style={{
                  backgroundColor: isReviewed ? "var(--olive-bg)" : "var(--white)",
                  border: "1px solid",
                  borderColor: isReviewed ? "var(--olive-border)" : "var(--khaki-300)",
                  borderRadius: "var(--radius)",
                  padding: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--khaki-700)" }}>
                      Step {s.number}
                    </span>
                    {isReviewed ? (
                      <CheckCircle2 size={15} style={{ color: "var(--olive)" }} />
                    ) : (
                      <Circle size={14} style={{ color: "var(--khaki-300)" }} />
                    )}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--charcoal)", lineHeight: 1.35 }}>
                    {s.desc}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "6px",
                    borderTop: "1px solid var(--sand-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "10.5px",
                    color: "var(--khaki-700)",
                    fontWeight: 600,
                  }}
                >
                  <span>{isReviewed ? "Reviewed" : "Review module"}</span>
                  <ArrowRight size={10} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. KEY TERMS GLOSSARY */}
      <section style={{ marginTop: "36px" }}>
        <div style={{ marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--khaki-700)" }}>
            Standard Terminology
          </span>
          <h3 style={{ fontSize: "1.25rem", margin: "4px 0 6px 0", fontFamily: "var(--font-serif)" }}>
            Key Terms & Definitions
          </h3>
          <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0 }}>
            Hover or click on any term to see its formal planning meaning.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            { term: "P10 / P50 / P90", meaning: "Three planning estimates. P50 is the central case, P10 the lower case, P90 the adverse case. A wide gap between P10 and P90 means more uncertainty." },
            { term: "FOS", meaning: "Freight Opportunity Score. A 0–100 screening score for whether conditions favour fixing freight now." },
            { term: "GCV", meaning: "Gross Calorific Value. The energy in a tonne of coal. Two coals with the same price per tonne can differ a lot in cost per unit of energy." },
            { term: "DWT", meaning: "Deadweight tonnage. How much cargo, fuel and supplies a ship can carry." },
            { term: "COA", meaning: "Contract of Affreightment. A longer-term agreement to move a set quantity of cargo over a period." },
            { term: "Laycan", meaning: "The window of dates in which the ship must arrive to load." },
            { term: "Demurrage", meaning: "A payment owed under a charter contract when loading or discharge takes longer than agreed." },
            { term: "Modelled delay exposure", meaning: "The platform's planning estimate of what a delay might cost. It is not the same as contractual demurrage, which depends on the actual charter terms." },
            { term: "SHAP", meaning: "A method that shows which factors pushed a forecast up or down, so the result can be reviewed and questioned." },
            { term: "BDI / BPI", meaning: "Baltic Dry Index and Baltic Panamax Index. Standard benchmarks for dry bulk freight." },
            { term: "FFA", meaning: "Forward Freight Agreement. A price for future freight, showing market expectations." },
            { term: "VLSFO", meaning: "Very Low Sulphur Fuel Oil, a common ship fuel." },
          ].map((tItem, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "var(--white)",
                border: "1px solid var(--sand-100)",
                borderRadius: "var(--radius)",
                padding: "12px",
                fontSize: "12px",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                <TermTooltip term={tItem.term}>{tItem.term}</TermTooltip>
              </div>
              <div style={{ color: "var(--charcoal)", lineHeight: 1.4, fontSize: "11.5px" }}>
                {tItem.meaning}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
