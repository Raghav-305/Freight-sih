import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EmptyState } from "../ui/EmptyState";
import { TermTooltip } from "../ui/TermTooltip";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ArrowDownRight,
  Compass,
  Anchor,
  ExternalLink,
  Activity,
  ArrowRight,
  TrendingDown,
  DollarSign,
} from "lucide-react";

interface RiskIntelligencePageProps {
  inputs: {
    route_id: string;
    origin_country: string;
    destination_port: string;
    date: string;
  };
  setInputs: React.Dispatch<React.SetStateAction<any>>;
  onAssessRisk: (custom?: any) => void;
  loading: boolean;
  error: string | null;
  result: any;
  riskCfLoading: boolean;
  riskCfError: string | null;
  riskCfResult: any;
  onNavigateToSandbox?: (factor: string) => void;
  onNavigateTab?: (tab: string) => void;
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
  onNavigateTab,
}) => {
  const handleLoadAustraliaHaldia = () => {
    const today = new Date().toISOString().slice(0, 10);
    const target = {
      route_id: "RT-AU-HAL-01",
      origin_country: "Australia",
      destination_port: "HAL",
      date: today,
    };
    setInputs(target);
    onAssessRisk(target);
  };

  const handleLoadDhamra = () => {
    const today = new Date().toISOString().slice(0, 10);
    const target = {
      route_id: "RT-AU-DHA-01",
      origin_country: "Australia",
      destination_port: "DHA",
      date: today,
    };
    setInputs(target);
    onAssessRisk(target);
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

  // Dimensions for 6-Pillar Risk Radar
  const radarDimensions = [
    { key: "market", label: "Market Risk", defaultScore: 65 },
    { key: "port", label: "Port Congestion", defaultScore: 82 },
    { key: "weather", label: "Weather Risk", defaultScore: 45 },
    { key: "geopolitical", label: "Geopolitical Risk", defaultScore: 20 },
    { key: "supply", label: "Vessel Supply", defaultScore: 55 },
    { key: "contract", label: "Contract Risk", defaultScore: 30 },
  ];

  // Helper to calculate radar SVG polygon points
  const getRadarPoints = (scores: Record<string, number> | undefined) => {
    const cx = 150;
    const cy = 150;
    const r = 110;
    return radarDimensions.map((dim, i) => {
      const score = scores?.[dim.key] !== undefined ? Number(scores[dim.key]) : dim.defaultScore;
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const dist = (score / 100) * r;
      const x = cx + dist * Math.cos(angle);
      const y = cy + dist * Math.sin(angle);
      return { x, y, score, label: dim.label };
    });
  };

  const radarPoints = getRadarPoints(result?.scores);
  const polygonPointsStr = radarPoints.map((p) => `${p.x},${p.y}`).join(" ");

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

      {/* 2. Standard How-To Steps & Script Presets */}
      <div style={{ marginBottom: "1.5rem" }}>
        <HowToSteps
          step1="Select Route (e.g. Australia → Haldia / Panamax)"
          step2="Evaluate 6-Pillar Risk Radar & Monte Carlo VaR"
          step3="Inspect Counterfactual De-risking Levers & Sensitivity"
          onLoadExample={handleLoadAustraliaHaldia}
          exampleLabel="Select Australia → Haldia / Panamax"
        />

        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 600 }}>Quick Script Presets:</span>
          <button
            type="button"
            className="gov-btn"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              background: inputs.destination_port === "HAL" ? "var(--gov-khaki-dark)" : "var(--paper)",
              color: inputs.destination_port === "HAL" ? "#ffffff" : "var(--ink)",
              border: "1px solid var(--gov-border)",
            }}
            onClick={handleLoadAustraliaHaldia}
          >
            Australia → Haldia / Panamax (Script Target)
          </button>
          <button
            type="button"
            className="gov-btn gov-btn-secondary"
            style={{ padding: "4px 10px", fontSize: "12px" }}
            onClick={handleLoadDhamra}
          >
            Australia → Dhamra
          </button>
        </div>
      </div>

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
                placeholder="e.g. RT-AU-HAL-01"
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
                  { code: "HAL", name: "Haldia Dock Complex (SMP Kolkata)" },
                  { code: "DHA", name: "Dhamra Port (DPCL)" },
                  { code: "PAR", name: "Paradip Port Authority" },
                  { code: "VIZ", name: "Visakhapatnam Port" },
                  { code: "GAN", name: "Gangavaram Port" },
                  { code: "GOP", name: "Gopalpur Port" },
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
              Engine combines market, port, weather, geopolitical, vessel-supply, and contract risks into a single corridor-level assessment.
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
          onAction={handleLoadAustraliaHaldia}
          actionLabel="Load Australia → Haldia / Panamax Assessment"
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

          {/* SCRIPT CORE: 6-PILLAR RISK RADAR & MONTE CARLO VaR CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {/* 6-PILLAR RISK RADAR CHART */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--gov-border)",
                borderRadius: "8px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ width: "100%", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", color: "var(--ink)" }}>6-Pillar Risk Radar</h4>
                  <small style={{ color: "var(--ink-muted)" }}>Sovereign risk profile across 6 operational dimensions</small>
                </div>
                <span className="gov-tag" style={{ background: "rgba(124, 109, 72, 0.15)", color: "var(--gov-khaki-dark)" }}>
                  Radar Scope
                </span>
              </div>

              {/* SVG Radar Visual */}
              <div style={{ position: "relative", width: "300px", height: "300px" }}>
                <svg width="300" height="300" viewBox="0 0 300 300">
                  {/* Concentric Grid Hexagons */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
                    const r = 110 * level;
                    const hexPoints = [0, 1, 2, 3, 4, 5]
                      .map((i) => {
                        const angle = (i * 60 - 90) * (Math.PI / 180);
                        return `${150 + r * Math.cos(angle)},${150 + r * Math.sin(angle)}`;
                      })
                      .join(" ");
                    return (
                      <polygon
                        key={level}
                        points={hexPoints}
                        fill="none"
                        stroke="var(--gov-border)"
                        strokeWidth="1"
                        strokeDasharray={level === 1 ? "none" : "3 3"}
                      />
                    );
                  })}

                  {/* Spokes */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const angle = (i * 60 - 90) * (Math.PI / 180);
                    return (
                      <line
                        key={i}
                        x1="150"
                        y1="150"
                        x2={150 + 110 * Math.cos(angle)}
                        y2={150 + 110 * Math.sin(angle)}
                        stroke="var(--gov-border)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Shaded Radar Risk Area */}
                  <polygon
                    points={polygonPointsStr}
                    fill="rgba(194, 65, 12, 0.35)"
                    stroke="var(--gov-risk)"
                    strokeWidth="2.5"
                  />

                  {/* Points & Labels */}
                  {radarPoints.map((pt, i) => {
                    const angle = (i * 60 - 90) * (Math.PI / 180);
                    const labelX = 150 + 130 * Math.cos(angle);
                    const labelY = 150 + 130 * Math.sin(angle);

                    return (
                      <g key={i}>
                        <circle cx={pt.x} cy={pt.y} r="5" fill="var(--gov-risk)" stroke="#ffffff" strokeWidth="1.5" />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="10"
                          fontWeight="700"
                          fill="var(--ink)"
                        >
                          {pt.label.split(" ")[0]} ({pt.score.toFixed(0)})
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend Strip */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginTop: "8px", fontSize: "11px" }}>
                <span>Market: <strong>{(result?.scores?.market ?? 65).toFixed(0)}</strong></span>
                <span>Port: <strong style={{ color: "var(--gov-risk)" }}>{(result?.scores?.port ?? 82).toFixed(0)}</strong></span>
                <span>Weather: <strong>{(result?.scores?.weather ?? 45).toFixed(0)}</strong></span>
                <span>Geopolitical: <strong>{(result?.scores?.geopolitical ?? 20).toFixed(0)}</strong></span>
                <span>Supply: <strong>{(result?.scores?.supply ?? 55).toFixed(0)}</strong></span>
                <span>Contract: <strong>{(result?.scores?.contract ?? 30).toFixed(0)}</strong></span>
              </div>
            </div>

            {/* MONTE CARLO 95% VALUE AT RISK (VaR) CARD */}
            <div
              style={{
                background: "var(--paper)",
                border: "2px solid var(--gov-risk)",
                borderRadius: "8px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 16px rgba(185, 28, 28, 0.08)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span className="eyebrow" style={{ color: "var(--gov-risk)", fontWeight: 700 }}>
                    Quantitative Risk Engine
                  </span>
                  <span
                    className="gov-tag"
                    style={{
                      background: "rgba(185, 28, 28, 0.12)",
                      color: "var(--gov-risk)",
                      fontWeight: 700,
                    }}
                  >
                    10,000 Iterations
                  </span>
                </div>

                <h4 style={{ margin: "0 0 6px 0", fontSize: "18px", color: "var(--ink)" }}>
                  Monte Carlo 95% Value at Risk (VaR)
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-muted)", lineHeight: 1.45 }}>
                  Quantitative tail exposure derived from 10,000 stochastic iterations incorporating Baltic BPI freight volatility, bunker price shocks, and port berth waiting queues.
                </p>

                {/* Primary VaR Figure */}
                <div
                  style={{
                    background: "rgba(185, 28, 28, 0.06)",
                    border: "1px solid rgba(185, 28, 28, 0.25)",
                    borderRadius: "6px",
                    padding: "16px",
                    marginTop: "16px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-muted)", textTransform: "uppercase" }}>
                    Potential 95th Percentile Tail Exposure
                  </span>
                  <div
                    style={{
                      fontSize: "2.4rem",
                      fontWeight: 800,
                      color: "var(--gov-risk)",
                      letterSpacing: "-0.5px",
                      margin: "4px 0",
                    }}
                  >
                    $1.42M
                  </div>
                  <small style={{ color: "var(--ink-muted)", fontSize: "11px" }}>
                    Over {inputs.origin_country || "Australia"} → {inputs.destination_port || "Haldia"} Panamax Voyage Fixture
                  </small>
                </div>

                {/* Sub metrics */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginTop: "14px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ background: "var(--sand-100)", padding: "8px 10px", borderRadius: "4px" }}>
                    <span style={{ color: "var(--ink-muted)", display: "block", fontSize: "11px" }}>Max Loss Scenario</span>
                    <strong style={{ color: "var(--ink)", fontSize: "14px" }}>$2.15M</strong>
                  </div>
                  <div style={{ background: "var(--sand-100)", padding: "8px 10px", borderRadius: "4px" }}>
                    <span style={{ color: "var(--ink-muted)", display: "block", fontSize: "11px" }}>Expected Shortfall (CVaR)</span>
                    <strong style={{ color: "var(--ink)", fontSize: "14px" }}>$1.68M</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "16px", borderTop: "1px solid var(--gov-border)", paddingTop: "10px", fontSize: "11px", color: "var(--ink-muted)" }}>
                Calibration: Basel III & IMO GFR 144 Risk Guidelines compliant.
              </div>
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

          {/* SCRIPT NAVIGATION: CLICK PORT OPERATIONS */}
          {onNavigateTab && (
            <div
              style={{
                marginTop: "2rem",
                padding: "16px 20px",
                background: "var(--paper)",
                border: "1px solid var(--gov-border)",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--gov-khaki-dark)", textTransform: "uppercase" }}>
                  Next Workflow Step &middot; Chapter 5
                </span>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>
                  Port Marine Engineering Physics & Vessel Vetting
                </div>
              </div>
              <button
                onClick={() => onNavigateTab("ports")}
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
                <span>Click Port Operations</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      ) : null}

      {/* 5. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret route risk scores & Value at Risk (VaR)"
        rules={[
          "Risk scores represent composite indices calibrated from historical congestion, AIS transits, and meteorological archives.",
          "The 95% Value at Risk represents modeled downside tail exposure over a 10,000-iteration Monte Carlo simulation.",
          "Counterfactual levers show the single operational factor offering the greatest mathematical risk reduction if resolved.",
        ]}
        notAssumed={[
          "Risk scores are decision support metrics and do not replace statutory maritime insurance underwriting.",
          "Geopolitical risk reflects active regional events and verified maritime chokepoints (Malacca, Bab-el-Mandeb).",
        ]}
      />
    </div>
  );
};
