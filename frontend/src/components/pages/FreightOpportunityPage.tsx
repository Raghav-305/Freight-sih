import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EmptyState } from "../ui/EmptyState";
import { TermTooltip } from "../ui/TermTooltip";
import { Sparkles, TrendingUp, Clock, AlertCircle, CheckCircle2, ChevronRight, DollarSign, Calendar, Layers } from "lucide-react";

interface FreightOpportunityPageProps {
  inputs: {
    origin: string;
    destination: string;
    vessel_class: string;
    horizon: number;
    as_of_date: string;
  };
  setInputs: React.Dispatch<React.SetStateAction<any>>;
  onAssessOpportunity: () => void;
  loading: boolean;
  error: string | null;
  result: any;
}

export const FreightOpportunityPage: React.FC<FreightOpportunityPageProps> = ({
  inputs,
  setInputs,
  onAssessOpportunity,
  loading,
  error,
  result,
}) => {
  const handleLoadExample = () => {
    const today = new Date().toISOString().slice(0, 10);
    setInputs({
      origin: "Australia",
      destination: "Dhamra",
      vessel_class: "Panamax",
      horizon: 30,
      as_of_date: today,
    });
  };

  const money = (v?: number) => (v != null ? `$${v.toFixed(2)}` : "—");

  const getFosColor = (score: number) => {
    if (score >= 65) return "var(--gov-good)";
    if (score >= 40) return "var(--gov-caution)";
    return "var(--gov-risk)";
  };

  const getFosLabel = (rec?: string, score?: number) => {
    if (rec === "GOOD_OPPORTUNITY" || (score ?? 0) >= 65) return "Favourable Fixing Window";
    if (rec === "WAIT" || (score ?? 0) < 40) return "Unfavourable / Defer Fixing";
    return "Neutral / Discretionary";
  };

  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Economics"
        title="Freight Opportunity Score (FOS)"
        purpose="Screen strategic fixing windows across key dry bulk corridors by synthesizing spot rate forecasts, forward FFA curves, bunker prices, and port pressure."
        questionsAnswered={[
          "Is the current market window favourable for fixing tonnage or should procurement be deferred?",
          "What is the expected freight change over a 7, 30, or 60-day horizon?",
          "Which underlying economic component (fuel, port, forward freight) drives the opportunity signal?",
        ]}
        truthClass="Modelled exposure"
        lastUpdated="2026-09-20"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Select Route & Vessel Class"
        step2="Set Horizon (7, 30, or 60 Days)"
        step3="Inspect FOS Gauge & Component Breakdown"
        onLoadExample={handleLoadExample}
        exampleLabel="Load Australia → Dhamra (30-Day Horizon)"
      />

      {/* 3. Input Parameters Form */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Opportunity Search Criteria</span>
          <h3>Corridor & Horizon Selection</h3>
        </div>

        <form
          className="forecast-form"
          onSubmit={(e) => {
            e.preventDefault();
            onAssessOpportunity();
          }}
        >
          <div className="form-grid">
            <label>
              <span>Origin</span>
              <select
                value={inputs.origin}
                onChange={(e) => setInputs({ ...inputs, origin: e.target.value })}
              >
                {["Australia", "Indonesia", "Mozambique", "Russia", "USA"].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Destination Port</span>
              <select
                value={inputs.destination}
                onChange={(e) => setInputs({ ...inputs, destination: e.target.value })}
              >
                {["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Vessel Class</span>
              <select
                value={inputs.vessel_class}
                onChange={(e) => setInputs({ ...inputs, vessel_class: e.target.value })}
              >
                {["Panamax", "Capesize", "Supramax"].map((vc) => (
                  <option key={vc} value={vc}>
                    {vc}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Forecast Horizon</span>
              <select
                value={String(inputs.horizon)}
                onChange={(e) => setInputs({ ...inputs, horizon: Number(e.target.value) })}
              >
                <option value="7">7 Days (Immediate Fix)</option>
                <option value="30">30 Days (Tactical Window)</option>
                <option value="60">60 Days (Quarterly Horizon)</option>
              </select>
            </label>

            <label>
              <span>As of Date</span>
              <input
                type="date"
                value={inputs.as_of_date}
                onChange={(e) => setInputs({ ...inputs, as_of_date: e.target.value })}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem", alignItems: "center" }}>
            <button type="submit" disabled={loading}>
              {loading ? "Computing Opportunity Score..." : "Calculate Opportunity Score"}
            </button>
            <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
              Engine aggregates spot forecasts, bunker swaps, port delays, and Baltic indices.
            </span>
          </div>
        </form>

        {error && (
          <div className="error-panel" style={{ marginTop: "1rem" }}>
            <strong>Calculation Error</strong>
            <p>{error}</p>
          </div>
        )}
      </section>

      {/* 4. Results Section or Empty State */}
      {!result && !loading ? (
        <EmptyState
          title="No Freight Opportunity Score Evaluated"
          description="Select an origin country, Indian discharge port, and planning horizon above to compute the composite fixing opportunity index."
          onAction={handleLoadExample}
          actionLabel="Load Australia → Dhamra (30-Day Reference)"
        />
      ) : result ? (
        <section className="market-section" style={{ marginBottom: "2rem" }}>
          <div className="section-title">
            <span className="eyebrow">Fixing Window Evaluation</span>
            <h3>Freight Opportunity Index & Market Drivers</h3>
          </div>

          {/* Top Key Metrics */}
          <div className="metrics-grid" style={{ marginBottom: "1.5rem" }}>
            <div
              className="metric"
              style={{
                borderLeft: `4px solid ${getFosColor(result.fos)}`,
              }}
            >
              <span>Freight Opportunity Score</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <Sparkles size={20} style={{ color: getFosColor(result.fos) }} />
                <strong style={{ fontSize: "1.7rem" }}>
                  {result.fos}
                  <span style={{ fontSize: "1rem", fontWeight: "normal", color: "var(--ink-muted)" }}> / 100</span>
                </strong>
              </div>
              <small style={{ marginTop: "4px", color: getFosColor(result.fos), fontWeight: 600 }}>
                {getFosLabel(result.recommendation, result.fos)}
              </small>
            </div>

            <div className="metric">
              <span>Fixing Recommendation</span>
              <strong style={{ fontSize: "1.2rem", marginTop: "4px", color: "var(--ink)" }}>
                {result.recommendation?.replaceAll("_", " ") ?? "EVALUATED"}
              </strong>
              <small>{result.vessel_class} · {result.horizon_days ?? inputs.horizon}-Day Horizon</small>
            </div>

            <div className="metric">
              <span>Expected Rate Change</span>
              <strong
                style={{
                  fontSize: "1.4rem",
                  marginTop: "4px",
                  color: (result.expected_return_pct ?? 0) >= 0 ? "var(--gov-risk)" : "var(--gov-good)",
                }}
              >
                {(result.expected_return_pct ?? 0) > 0 ? "+" : ""}
                {(result.expected_return_pct ?? 0).toFixed(2)}%
              </strong>
              <small>Projected shift relative to current spot</small>
            </div>

            <div className="metric">
              <span>Expected Freight Rate</span>
              <strong style={{ fontSize: "1.4rem", marginTop: "4px" }}>
                {money(result.expected_freight_usd_mt)}
                <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)", fontWeight: "normal" }}>/MT</span>
              </strong>
              <small>Spot baseline: {money(result.freight_usd_mt)}/MT</small>
            </div>
          </div>

          {/* Component Score Cards */}
          <h4 style={{ marginBottom: "1rem", color: "var(--ink)" }}>Opportunity Component Breakdown</h4>
          <div className="market-grid" style={{ marginBottom: "1.5rem" }}>
            {Object.entries(result.components || {}).map(([name, score]: [string, any]) => {
              const numScore = Number(score);
              const contribution = result.contributions?.[`${name}_score`] ?? result.contributions?.[name] ?? "Normal";
              return (
                <div
                  key={name}
                  className="market-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                      {name.replaceAll("_", " ").toUpperCase()}
                    </span>
                    <strong style={{ fontSize: "1.5rem", margin: "8px 0 4px" }}>
                      {numScore.toFixed(1)}
                      <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)", fontWeight: "normal" }}> / 100</span>
                    </strong>
                    <div style={{ width: "100%", background: "var(--sand-100)", height: "6px", borderRadius: "3px", overflow: "hidden", margin: "6px 0 10px" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(5, numScore))}%`,
                          background: numScore >= 60 ? "var(--gov-good)" : numScore >= 40 ? "var(--gov-caution)" : "var(--gov-risk)",
                          height: "100%",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: "var(--ink-muted)" }}>Weight Contribution:</span>
                    <strong style={{ color: "var(--ink)" }}>{contribution}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lineage and Governance Note */}
          <div
            style={{
              padding: "12px 16px",
              background: "var(--paper)",
              border: "1px solid var(--gov-border)",
              borderRadius: "4px",
              fontSize: "12px",
              color: "var(--ink-muted)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              <strong>Model Lineage:</strong> {result.model_version ?? "fos_heuristic_v2.4"} · Source: {result.forecast_source ?? "Ensemble Model & FFA Curves"}
            </span>
            <span>{result.note ?? "Advisory screening index only."}</span>
          </div>
        </section>
      ) : null}

      {/* 5. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret the Freight Opportunity Score"
        rules={[
          "The Freight Opportunity Score (FOS) is an automated 0-100 advisory index indicating whether fixing freight now is commercially advantageous.",
          "Scores above 65 suggest a favourable fixing window where forward freight is expected to firm or bunker costs are projected to rise.",
          "Scores below 40 suggest procurement officers should consider deferring commitment if laycan tolerance allows.",
          "Expected Return indicates the projected percentage savings or premium compared to executing on current spot.",
        ]}
        notAssumed={[
          "The FOS is an advisory screening metric and does NOT constitute an automated trading order or procurement authorization under GFR 2017.",
          "Commercial chartering decisions must comply with the delegated powers of the competent procurement authority (DoFP).",
          "Calculations assume standard demurrage rates and typical laycan windows; unique bilateral contract terms require manual adjustment.",
        ]}
      />
    </div>
  );
};
