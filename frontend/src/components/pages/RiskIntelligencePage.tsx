import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EmptyState } from "../ui/EmptyState";
import { TermTooltip } from "../ui/TermTooltip";
import { ShieldAlert, AlertTriangle, CheckCircle2, Sliders, ArrowDownRight, Compass, Anchor, ExternalLink } from "lucide-react";

interface RiskIntelligencePageProps {
  inputs: {
    route_id: string;
    origin_country: string;
    destination_port: string;
    date: string;
  };
  setInputs: React.Dispatch<React.SetStateAction<any>>;
  onAssessRisk: () => void;
  loading: boolean;
  error: string | null;
  result: any;
  riskCfLoading: boolean;
  riskCfError: string | null;
  riskCfResult: any;
  onNavigateToSandbox?: (factor: string) => void;
}

export const RiskIntelligencePage: React.FC<RiskIntelligencePageProps> = ({
  inputs,
  setInputs,
  onAssessRisk,
  loading,
  error,
  result,
  riskCfLoading,
  riskCfError,
  riskCfResult,
  onNavigateToSandbox,
}) => {
  const handleLoadExample = () => {
    const today = new Date().toISOString().slice(0, 10);
    setInputs({
      route_id: "RT-AU-DHA-01",
      origin_country: "Australia",
      destination_port: "DHA",
      date: today,
    });
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "var(--gov-risk)";
    if (score >= 45) return "var(--gov-caution)";
    return "var(--gov-good)";
  };

  const getRiskIcon = (score: number) => {
    if (score >= 70) return <AlertTriangle size={18} style={{ color: "var(--gov-risk)" }} />;
    if (score >= 45) return <ShieldAlert size={18} style={{ color: "var(--gov-caution)" }} />;
    return <CheckCircle2 size={18} style={{ color: "var(--gov-good)" }} />;
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "High Exposure";
    if (score >= 45) return "Moderate Exposure";
    return "Lower Exposure";
  };

  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Risk"
        title="Route & Port Risk Intelligence"
        purpose="Evaluate multidimensional operational, geopolitical, weather, and port congestion risk scores across strategic coal import routes."
        questionsAnswered={[
          "What is the overall composite risk index for the selected voyage?",
          "Which operational dimension (weather, port, geopolitical) carries the heaviest hazard?",
          "What single counterfactual lever would reduce overall route risk the fastest?",
        ]}
        truthClass="Modelled exposure"
        lastUpdated="2026-09-20"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Specify Route & Origin Country"
        step2="Generate 6-Factor Risk Matrix"
        step3="Inspect Counterfactual De-risking Levers"
        onLoadExample={handleLoadExample}
        exampleLabel="Load Route (Australia → Dhamra)"
      />

      {/* 3. Input Parameters Form */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Risk Parameters</span>
          <h3>Voyage & Destination Definition</h3>
        </div>

        <form
          className="forecast-form"
          onSubmit={(e) => {
            e.preventDefault();
            onAssessRisk();
          }}
        >
          <div className="form-grid">
            <label>
              <span>Route Identifier</span>
              <input
                type="text"
                value={inputs.route_id}
                onChange={(e) => setInputs({ ...inputs, route_id: e.target.value })}
                placeholder="e.g. RT-AU-DHA-01"
              />
            </label>

            <label>
              <span>Origin Country</span>
              <select
                value={inputs.origin_country}
                onChange={(e) => setInputs({ ...inputs, origin_country: e.target.value })}
              >
                {["Australia", "Indonesia", "Mozambique", "Russia", "USA"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Destination Port</span>
              <select
                value={inputs.destination_port}
                onChange={(e) => setInputs({ ...inputs, destination_port: e.target.value })}
              >
                {[
                  { code: "DHA", name: "Dhamra (DHA)" },
                  { code: "GAN", name: "Gangavaram (GAN)" },
                  { code: "GOP", name: "Gopalpur (GOP)" },
                  { code: "HAL", name: "Haldia (HAL)" },
                  { code: "PAR", name: "Paradip (PAR)" },
                  { code: "VIZ", name: "Visakhapatnam (VIZ)" },
                ].map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Assessment Date</span>
              <input
                type="date"
                value={inputs.date}
                onChange={(e) => setInputs({ ...inputs, date: e.target.value })}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem", alignItems: "center" }}>
            <button type="submit" disabled={loading}>
              {loading ? "Evaluating Route Risks..." : "Assess Route Risk"}
            </button>
            <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
              Engine computes 6 normalized risk dimensions calibrated against Lloyd's and AIS data.
            </span>
          </div>
        </form>

        {error && (
          <div className="error-panel" style={{ marginTop: "1rem" }}>
            <strong>Risk Assessment Error</strong>
            <p>{error}</p>
          </div>
        )}
      </section>

      {/* 4. Results Section or Empty State */}
      {!result && !loading ? (
        <EmptyState
          title="No Risk Assessment Evaluated"
          description="Define the origin country and Indian receiving port above to compute composite operational, weather, congestion, and contract risks."
          onAction={handleLoadExample}
          actionLabel="Load Australia → Dhamra Reference Assessment"
        />
      ) : result ? (
        <section className="market-section" style={{ marginBottom: "2rem" }}>
          <div className="section-title">
            <span className="eyebrow">Risk Analytics Report</span>
            <h3>Composite Risk Profile & Factor Attribution</h3>
          </div>

          {/* Top Key Metrics */}
          <div className="metrics-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="metric" style={{ borderLeft: `4px solid ${getRiskColor(result.overall_risk ?? result.overall ?? 50)}` }}>
              <span>Composite Overall Risk</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                {getRiskIcon(result.overall_risk ?? result.overall ?? 50)}
                <strong style={{ fontSize: "1.6rem" }}>
                  {(result.overall_risk ?? result.overall ?? 0).toFixed(1)}
                  <span style={{ fontSize: "1rem", fontWeight: "normal", color: "var(--ink-muted)" }}> / 100</span>
                </strong>
              </div>
              <small style={{ marginTop: "4px", color: getRiskColor(result.overall_risk ?? result.overall ?? 50) }}>
                {getRiskLabel(result.overall_risk ?? result.overall ?? 50)}
              </small>
            </div>

            <div className="metric">
              <span>Evaluated Route</span>
              <strong style={{ fontSize: "1.3rem" }}>{result.route_id}</strong>
              <small>{result.origin_country} → {result.destination_port_name ?? result.destination_port}</small>
            </div>

            <div className="metric">
              <span>Destination Port</span>
              <strong style={{ fontSize: "1.3rem" }}>{result.destination_port_name ?? result.destination_port}</strong>
              <small>East Coast Bulk Berth Terminal</small>
            </div>

            <div className="metric">
              <span>Modelling Engine</span>
              <strong style={{ fontSize: "1.3rem" }}>{result.mode?.toUpperCase() ?? "STANDALONE"}</strong>
              <small>Calibrated Risk Heuristics v3.2</small>
            </div>
          </div>

          {/* 6 Risk Dimension Breakdown Cards */}
          <h4 style={{ marginBottom: "1rem", color: "var(--ink)" }}>Individual Risk Dimensions</h4>
          <div className="market-grid" style={{ marginBottom: "2rem" }}>
            {Object.entries(result.scores || {}).map(([dim, score]: [string, any]) => {
              const numScore = Number(score);
              return (
                <div
                  key={dim}
                  className="market-card"
                  style={{
                    borderTop: `3px solid ${getRiskColor(numScore)}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                        {dim.toUpperCase()} RISK
                      </span>
                      {getRiskIcon(numScore)}
                    </div>
                    <strong style={{ fontSize: "1.5rem", margin: "8px 0 4px" }}>
                      {numScore.toFixed(1)}
                      <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)", fontWeight: "normal" }}> / 100</span>
                    </strong>
                    <div style={{ width: "100%", background: "var(--sand-100)", height: "6px", borderRadius: "3px", overflow: "hidden", margin: "6px 0 10px" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(5, numScore))}%`,
                          background: getRiskColor(numScore),
                          height: "100%",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: getRiskColor(numScore), fontWeight: 600 }}>
                      {getRiskLabel(numScore)}
                    </span>
                    <small style={{ color: "var(--ink-muted)" }}>
                      {dim === "port"
                        ? "Congestion & tidal draft"
                        : dim === "weather"
                        ? "Monsoon & cyclone swell"
                        : dim === "geopolitical"
                        ? "Chokepoint stability"
                        : dim === "market"
                        ? "Freight volatility index"
                        : dim === "supply"
                        ? "Tonnage availability"
                        : "Demurrage terms"}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Layer 6: Counterfactual Risk Explanations */}
          <div style={{ marginTop: "2rem", borderTop: "1px solid var(--gov-border)", paddingTop: "1.5rem" }}>
            <div className="section-title">
              <span className="eyebrow">Layer 6 Explainability · Systematic Perturbation Search</span>
              <h4>Counterfactual Risk Levers & Decision Drivers</h4>
              <small style={{ color: "var(--ink-muted)" }}>
                Answers: <em>"What is the smallest realistic operational change that would flip or resolve this route risk?"</em>
              </small>
            </div>

            {riskCfLoading && (
              <p style={{ color: "var(--ink-muted)", marginTop: "0.75rem" }}>
                Calculating smallest lever perturbations across operational factors...
              </p>
            )}

            {riskCfError && (
              <div className="error-panel" style={{ marginTop: "1rem" }}>
                <strong>Counterfactual Engine Notice</strong>
                <p>{riskCfError}</p>
              </div>
            )}

            {!riskCfLoading && riskCfResult && (
              <div style={{ marginTop: "1rem" }}>
                <div className="cf-banner" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div className="cf-banner-badge" style={{ whiteSpace: "nowrap" }}>
                    PRIMARY LEVER: {riskCfResult.biggest_lever?.toUpperCase()}
                  </div>
                  <div className="cf-banner-text">{riskCfResult.summary_insight}</div>
                </div>

                <div className="table-wrap" style={{ marginTop: "1.25rem" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Risk Factor Lever</th>
                        <th>Current Score</th>
                        <th>If Resolved (Floor 10.0)</th>
                        <th>Overall Risk Drops By</th>
                        <th>Impact Share</th>
                        <th>Interactive Sandbox</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(riskCfResult.counterfactuals || []).map((cf: any, idx: number) => (
                        <tr key={cf.factor}>
                          <td><strong>#{idx + 1}</strong></td>
                          <td>
                            <span className={`factor-badge factor-${cf.factor}`}>
                              {cf.factor.toUpperCase()}
                            </span>
                          </td>
                          <td><strong>{cf.current_score.toFixed(1)}/100</strong></td>
                          <td>
                            <span style={{ color: "var(--gov-good)", fontWeight: 700 }}>
                              {cf.if_resolved_overall_becomes.toFixed(1)}/100
                            </span>
                          </td>
                          <td>
                            <span className="delta-drop-pill" style={{ color: "var(--gov-good)" }}>
                              <ArrowDownRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
                              -{cf.overall_drops_by.toFixed(1)} pts
                            </span>
                          </td>
                          <td>
                            <div className="progress-bar-cf">
                              <div
                                className="progress-fill-cf"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      10,
                                      (cf.overall_drops_by /
                                        (riskCfResult.counterfactuals[0]?.overall_drops_by || 1)) *
                                        100
                                    )
                                  )}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="small-action-btn"
                              onClick={() => {
                                if (onNavigateToSandbox) {
                                  onNavigateToSandbox(cf.factor);
                                }
                              }}
                              title="Send this factor to the interactive What-If sandbox"
                            >
                              <Sliders size={13} style={{ marginRight: "4px" }} />
                              Test in Sandbox →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 5. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret this route risk assessment"
        rules={[
          "Overall Risk is a composite index calibrated from 0 (lowest operational hazard) to 100 (critical hazard).",
          "Scores of 70 and above indicate mandatory escalation to the Tender Vigilance Committee before fixing.",
          "Weather and port congestion risk values are statistical modelled exposures based on historical wait hours and seasonal swell.",
          "Counterfactual levers rank the operational interventions that yield the largest drop in composite route risk.",
        ]}
        notAssumed={[
          "A low port risk score does NOT guarantee immediate berthing; tidal windows, berth notices, and port authority priorities govern actual vessel discharge.",
          "Composite risk scores do not replace technical pre-vetting of individual vessel flag, age, and classification society records.",
          "Weather scores represent climatological risk during the projected voyage window, not real-time meteorological cyclone warnings.",
        ]}
      />
    </div>
  );
};
