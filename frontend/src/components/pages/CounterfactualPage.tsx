import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { TermTooltip } from "../ui/TermTooltip";
import { Sliders, ArrowDownRight, Compass, ShieldAlert, DollarSign, RefreshCw, BarChart2, CheckCircle2 } from "lucide-react";

interface CounterfactualPageProps {
  cfMode: "risk" | "charter" | "sandbox";
  setCfMode: (mode: "risk" | "charter" | "sandbox") => void;
  riskInputs: {
    route_id: string;
    origin_country: string;
    destination_port: string;
    date: string;
  };
  setRiskInputs: React.Dispatch<React.SetStateAction<any>>;
  fetchRiskCounterfactuals: (inputs?: any) => Promise<void>;
  riskCfLoading: boolean;
  riskCfError: string | null;
  riskCfResult: any;
  riskOverrides: Record<string, number>;
  setRiskOverrides: React.Dispatch<React.SetStateAction<any>>;
  runRiskSimulation: (customOverrides?: any) => Promise<void>;
  riskSimResult: any;
  riskSimLoading: boolean;
  charterInputs: {
    cargo_quantity: number;
    origin: string;
    destination: string;
    vessel_class: string;
    delivery_date: string;
  };
  setCharterInputs: React.Dispatch<React.SetStateAction<any>>;
  fetchCharterCounterfactuals: (inputs?: any) => Promise<void>;
  charterCfLoading: boolean;
  charterCfError: string | null;
  charterCfResult: any;
  charterShifts: {
    bunker_pct_change: number;
    congestion_days_delta: number;
    spot_rate_pct_change: number;
  };
  setCharterShifts: React.Dispatch<React.SetStateAction<any>>;
  runCharterSimulation: (customShifts?: any) => Promise<void>;
  charterSimResult: any;
  charterSimLoading: boolean;
}

export const CounterfactualPage: React.FC<CounterfactualPageProps> = ({
  cfMode,
  setCfMode,
  riskInputs,
  setRiskInputs,
  fetchRiskCounterfactuals,
  riskCfLoading,
  riskCfError,
  riskCfResult,
  riskOverrides,
  setRiskOverrides,
  runRiskSimulation,
  riskSimResult,
  riskSimLoading,
  charterInputs,
  setCharterInputs,
  fetchCharterCounterfactuals,
  charterCfLoading,
  charterCfError,
  charterCfResult,
  charterShifts,
  setCharterShifts,
  runCharterSimulation,
  charterSimResult,
  charterSimLoading,
}) => {
  const money = (v?: number) => (v != null ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—");

  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Intelligence"
        title="Counterfactual Explanations & Sensitivity Hub (Layer 6)"
        purpose="Systematic algorithmic search identifying the minimal realistic parameter perturbations that flip risk classifications or yield the highest capital savings in charter procurement."
        questionsAnswered={[
          "What is the smallest operational change that flips an evaluated route from 'High Risk' to 'Safe'?",
          "How sensitive is the linear programming contract mix to bunker fuel swings, port congestion, or freight softening?",
          "What happens to total procurement spend when market variables shift simultaneously in real-time?",
        ]}
        truthClass="Modelled exposure"
        lastUpdated="2026-09-20"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Select Analytical Mode (Risk, Charter, or Interactive Sandbox)"
        step2="Execute Systematic Sensitivity Perturbation Search"
        step3="Simulate Real-time What-If Scenarios on Dynamic Dials"
      />

      {/* 3. Main Analytical Section */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Layer 6 Explainability · Decision Flip Engine</span>
          <h3>Sensitivity & Systematic Perturbation Explorer</h3>
        </div>

        {/* Sub-mode Switcher */}
        <div className="mode-switcher" style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
          <button
            type="button"
            className={`mode-btn ${cfMode === "risk" ? "active" : ""}`}
            onClick={() => setCfMode("risk")}
          >
            1. Risk Decision Explainer
          </button>
          <button
            type="button"
            className={`mode-btn ${cfMode === "charter" ? "active" : ""}`}
            onClick={() => setCfMode("charter")}
          >
            2. Charter Cost Sensitivity Explainer
          </button>
          <button
            type="button"
            className={`mode-btn ${cfMode === "sandbox" ? "active" : ""}`}
            onClick={() => {
              setCfMode("sandbox");
              void runRiskSimulation();
              void runCharterSimulation();
            }}
          >
            3. Interactive What-If Sandbox
          </button>
        </div>

        {/* MODE 1: RISK DECISION EXPLAINER */}
        {cfMode === "risk" && (
          <div>
            <form
              className="forecast-form"
              onSubmit={(e) => {
                e.preventDefault();
                void fetchRiskCounterfactuals(riskInputs);
              }}
            >
              <div className="form-grid">
                <label>
                  <span>Route Identifier</span>
                  <input
                    type="text"
                    value={riskInputs.route_id}
                    onChange={(e) => setRiskInputs({ ...riskInputs, route_id: e.target.value })}
                  />
                </label>
                <label>
                  <span>Origin Country</span>
                  <select
                    value={riskInputs.origin_country}
                    onChange={(e) => setRiskInputs({ ...riskInputs, origin_country: e.target.value })}
                  >
                    {["Australia", "Indonesia", "Mozambique", "Russia", "USA"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Destination Port</span>
                  <select
                    value={riskInputs.destination_port}
                    onChange={(e) => setRiskInputs({ ...riskInputs, destination_port: e.target.value })}
                  >
                    {["DHA", "GAN", "GOP", "HAL", "PAR", "VIZ"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Assessment Date</span>
                  <input
                    type="date"
                    value={riskInputs.date}
                    onChange={(e) => setRiskInputs({ ...riskInputs, date: e.target.value })}
                  />
                </label>
              </div>
              <div style={{ marginTop: "1.25rem" }}>
                <button type="submit" disabled={riskCfLoading}>
                  {riskCfLoading ? "Searching Levers..." : "Run Systematic Risk Counterfactual Search"}
                </button>
              </div>
            </form>

            {riskCfError && (
              <div className="error-panel" style={{ marginTop: "1rem" }}>
                <strong>Search Error</strong>
                <p>{riskCfError}</p>
              </div>
            )}

            {!riskCfLoading && riskCfResult && (
              <div style={{ marginTop: "1.5rem" }}>
                <div className="metrics-grid">
                  <div className="metric">
                    <span>Baseline Overall Risk</span>
                    <strong style={{ fontSize: "1.5rem" }}>{riskCfResult.baseline?.overall}/100</strong>
                  </div>
                  <div className="metric" style={{ borderLeft: "4px solid var(--gov-good)" }}>
                    <span>Primary Risk Driver Lever</span>
                    <strong style={{ fontSize: "1.3rem", color: "var(--ink)" }}>
                      {riskCfResult.biggest_lever?.toUpperCase()}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Max Single Factor Drop</span>
                    <strong style={{ fontSize: "1.4rem", color: "var(--gov-good)" }}>
                      -{riskCfResult.counterfactuals?.[0]?.overall_drops_by?.toFixed(1)} pts
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Target If Resolved</span>
                    <strong style={{ fontSize: "1.4rem" }}>
                      {riskCfResult.counterfactuals?.[0]?.if_resolved_overall_becomes?.toFixed(1)}/100
                    </strong>
                  </div>
                </div>

                <div className="cf-banner" style={{ marginTop: "1.25rem" }}>
                  <div className="cf-banner-badge">EXECUTIVE SUMMARY</div>
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
                            <strong style={{ color: "var(--gov-good)" }}>
                              {cf.if_resolved_overall_becomes.toFixed(1)}/100
                            </strong>
                          </td>
                          <td>
                            <span className="delta-drop-pill" style={{ color: "var(--gov-good)" }}>
                              <ArrowDownRight size={13} style={{ display: "inline" }} />
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
                                        (riskCfResult.counterfactuals[0]?.overall_drops_by || 1)) * 100
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
                                setCfMode("sandbox");
                                const newOverrides = { ...riskOverrides, [cf.factor]: 10.0 };
                                setRiskOverrides(newOverrides);
                                void runRiskSimulation(newOverrides);
                              }}
                            >
                              <Sliders size={12} style={{ marginRight: "4px" }} />
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
        )}

        {/* MODE 2: CHARTER COST EXPLAINER */}
        {cfMode === "charter" && (
          <div>
            <form
              className="forecast-form"
              onSubmit={(e) => {
                e.preventDefault();
                void fetchCharterCounterfactuals(charterInputs);
              }}
            >
              <div className="form-grid">
                <label>
                  <span>Total Cargo Commitment (MT)</span>
                  <input
                    type="number"
                    value={charterInputs.cargo_quantity}
                    onChange={(e) => setCharterInputs({ ...charterInputs, cargo_quantity: Number(e.target.value) })}
                  />
                </label>
                <label>
                  <span>Load Port</span>
                  <select
                    value={charterInputs.origin}
                    onChange={(e) => setCharterInputs({ ...charterInputs, origin: e.target.value })}
                  >
                    {[
                      "Gladstone", "Newcastle", "Hay Point", "Dalrymple Bay",
                      "Taboneo", "Muara Pantai", "Samarinda", "Hampton Roads",
                      "Baltimore", "New Orleans", "Beira", "Nacala", "Vostochny (Far East)"
                    ].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Discharge Port</span>
                  <select
                    value={charterInputs.destination}
                    onChange={(e) => setCharterInputs({ ...charterInputs, destination: e.target.value })}
                  >
                    {["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Vessel Class</span>
                  <select
                    value={charterInputs.vessel_class}
                    onChange={(e) => setCharterInputs({ ...charterInputs, vessel_class: e.target.value })}
                  >
                    {["Panamax", "Capesize"].map((vc) => (
                      <option key={vc} value={vc}>{vc}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Delivery / Laycan Date</span>
                  <input
                    type="date"
                    value={charterInputs.delivery_date}
                    onChange={(e) => setCharterInputs({ ...charterInputs, delivery_date: e.target.value })}
                  />
                </label>
              </div>
              <div style={{ marginTop: "1.25rem" }}>
                <button type="submit" disabled={charterCfLoading}>
                  {charterCfLoading ? "Simulating Market Shifts..." : "Run HiGHS LP Cost Sensitivity Search"}
                </button>
              </div>
            </form>

            {charterCfError && (
              <div className="error-panel" style={{ marginTop: "1rem" }}>
                <strong>Sensitivity Search Error</strong>
                <p>{charterCfError}</p>
              </div>
            )}

            {!charterCfLoading && charterCfResult && (
              <div style={{ marginTop: "1.5rem" }}>
                <div className="metrics-grid">
                  <div className="metric">
                    <span>LP Optimized Baseline</span>
                    <strong style={{ fontSize: "1.5rem" }}>{money(charterCfResult.baseline?.optimized_cost_usd)}</strong>
                  </div>
                  <div className="metric" style={{ borderLeft: "4px solid var(--gov-good)" }}>
                    <span>Max Sensitivity Lever</span>
                    <strong style={{ fontSize: "1.3rem", color: "var(--ink)" }}>
                      {charterCfResult.biggest_lever?.replace("_", " ").toUpperCase()}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Route</span>
                    <strong style={{ fontSize: "1.2rem" }}>
                      {charterCfResult.baseline?.origin_port} → {charterCfResult.baseline?.destination_port_name}
                    </strong>
                  </div>
                  <div className="metric">
                    <span>Voyages Needed</span>
                    <strong style={{ fontSize: "1.4rem" }}>
                      {charterCfResult.baseline?.voyages_needed} Voyages
                    </strong>
                  </div>
                </div>

                <div className="cf-banner" style={{ marginTop: "1.25rem" }}>
                  <div className="cf-banner-badge">COST LEVERAGE INSIGHT</div>
                  <div className="cf-banner-text">{charterCfResult.summary_insight}</div>
                </div>

                <div className="cf-sensitivity-grid" style={{ marginTop: "1.5rem" }}>
                  {/* Bunker Sensitivity */}
                  <div className="sensitivity-column">
                    <div className="sens-header">
                      <strong>Bunker Price Shifts</strong>
                      <small>VLSFO USD/MT shifts (-2% to -20%)</small>
                    </div>
                    <div className="sens-cards">
                      {(charterCfResult.cost_sensitivity || [])
                        .filter((s: any) => s.lever === "bunker_price")
                        .map((s: any) => (
                          <div className="sens-card" key={s.change}>
                            <span className="sens-change">{s.change}</span>
                            <div className="sens-cost">{money(s.new_cost_usd)}</div>
                            <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Congestion Sensitivity */}
                  <div className="sensitivity-column">
                    <div className="sens-header">
                      <strong>Port Congestion Reduction</strong>
                      <small>Fewer berth wait days (-0.5 to -3.0 d)</small>
                    </div>
                    <div className="sens-cards">
                      {(charterCfResult.cost_sensitivity || [])
                        .filter((s: any) => s.lever === "congestion")
                        .map((s: any) => (
                          <div className="sens-card" key={s.change}>
                            <span className="sens-change">{s.change}</span>
                            <div className="sens-cost">{money(s.new_cost_usd)}</div>
                            <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Spot Rate Sensitivity */}
                  <div className="sensitivity-column">
                    <div className="sens-header">
                      <strong>Spot Freight Rate Drops</strong>
                      <small>Market softening (-2% to -20%)</small>
                    </div>
                    <div className="sens-cards">
                      {(charterCfResult.cost_sensitivity || [])
                        .filter((s: any) => s.lever === "spot_rate")
                        .map((s: any) => (
                          <div className="sens-card" key={s.change}>
                            <span className="sens-change">{s.change}</span>
                            <div className="sens-cost">{money(s.new_cost_usd)}</div>
                            <span className="savings-pill">Saves {money(s.saving_usd)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {charterCfResult.note && (
                  <div
                    style={{
                      marginTop: "1.25rem",
                      padding: "12px 16px",
                      background: "var(--paper)",
                      border: "1px solid var(--gov-border)",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "var(--ink-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Architectural Truth & Contract Allocation Stability:</strong> {charterCfResult.note}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 3: INTERACTIVE WHAT-IF SANDBOX */}
        {cfMode === "sandbox" && (
          <div style={{ marginTop: "1rem" }}>
            <div className="content-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Left: Risk Sandbox */}
              <div className="sandbox-slider-card">
                <div className="section-title">
                  <span className="eyebrow">Interactive Risk Engine Sandbox</span>
                  <h4>Dynamic Sub-Score Dial</h4>
                  <small style={{ color: "var(--ink-muted)" }}>
                    Tweak any individual risk sub-score to evaluate hypothetical route safety in real-time.
                  </small>
                </div>

                {Object.keys(riskOverrides).map((factor) => (
                  <div className="slider-row" key={factor}>
                    <span className="slider-label">{factor}</span>
                    <input
                      type="range"
                      className="slider-input"
                      min="0"
                      max="100"
                      step="1"
                      value={riskOverrides[factor]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = { ...riskOverrides, [factor]: val };
                        setRiskOverrides(updated);
                        void runRiskSimulation(updated);
                      }}
                    />
                    <span className="slider-val">{riskOverrides[factor].toFixed(0)}</span>
                  </div>
                ))}

                {riskSimResult && (
                  <div style={{ marginTop: "1rem", padding: "12px", background: "var(--paper)", borderRadius: "4px", border: "1px solid var(--gov-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Simulated Overall Risk:</span>
                      <strong style={{ fontSize: "16px", color: "var(--ink)" }}>
                        {riskSimResult.simulated?.overall?.toFixed(1)}/100
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                      <span>Change from Baseline:</span>
                      <span
                        className="delta-drop-pill"
                        style={{
                          background: riskSimResult.overall_delta >= 0 ? "rgba(79, 107, 42, 0.1)" : "rgba(155, 44, 44, 0.1)",
                          color: riskSimResult.overall_delta >= 0 ? "var(--gov-good)" : "var(--gov-risk)",
                          borderColor: riskSimResult.overall_delta >= 0 ? "var(--gov-good)" : "var(--gov-risk)",
                        }}
                      >
                        {riskSimResult.overall_delta >= 0 ? `-${riskSimResult.overall_delta.toFixed(1)} pts` : `+${Math.abs(riskSimResult.overall_delta).toFixed(1)} pts`} ({riskSimResult.impact_direction})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Charter Solver Sandbox */}
              <div className="sandbox-slider-card">
                <div className="section-title">
                  <span className="eyebrow">Interactive HiGHS Solver Sandbox</span>
                  <h4>Procurement Parameter Shift</h4>
                  <small style={{ color: "var(--ink-muted)" }}>
                    Simulate macro bunker price swings, port congestion shocks, and freight rate shifts.
                  </small>
                </div>

                <div className="slider-row">
                  <span className="slider-label">Bunker Price (%)</span>
                  <input
                    type="range"
                    className="slider-input"
                    min="-30"
                    max="30"
                    step="1"
                    value={charterShifts.bunker_pct_change}
                    onChange={(e) => {
                      const updated = { ...charterShifts, bunker_pct_change: Number(e.target.value) };
                      setCharterShifts(updated);
                      void runCharterSimulation(updated);
                    }}
                  />
                  <span className="slider-val">{charterShifts.bunker_pct_change > 0 ? `+${charterShifts.bunker_pct_change}%` : `${charterShifts.bunker_pct_change}%`}</span>
                </div>

                <div className="slider-row">
                  <span className="slider-label">Congestion (Days)</span>
                  <input
                    type="range"
                    className="slider-input"
                    min="-4"
                    max="4"
                    step="0.5"
                    value={charterShifts.congestion_days_delta}
                    onChange={(e) => {
                      const updated = { ...charterShifts, congestion_days_delta: Number(e.target.value) };
                      setCharterShifts(updated);
                      void runCharterSimulation(updated);
                    }}
                  />
                  <span className="slider-val">{charterShifts.congestion_days_delta > 0 ? `+${charterShifts.congestion_days_delta}d` : `${charterShifts.congestion_days_delta}d`}</span>
                </div>

                <div className="slider-row">
                  <span className="slider-label">Spot Rate (%)</span>
                  <input
                    type="range"
                    className="slider-input"
                    min="-30"
                    max="30"
                    step="1"
                    value={charterShifts.spot_rate_pct_change}
                    onChange={(e) => {
                      const updated = { ...charterShifts, spot_rate_pct_change: Number(e.target.value) };
                      setCharterShifts(updated);
                      void runCharterSimulation(updated);
                    }}
                  />
                  <span className="slider-val">{charterShifts.spot_rate_pct_change > 0 ? `+${charterShifts.spot_rate_pct_change}%` : `${charterShifts.spot_rate_pct_change}%`}</span>
                </div>

                {charterSimResult && (
                  <div style={{ marginTop: "1rem", padding: "12px", background: "var(--paper)", borderRadius: "4px", border: "1px solid var(--gov-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Simulated Optimized Cost:</span>
                      <strong style={{ fontSize: "16px", color: "var(--ink)" }}>
                        {money(charterSimResult.simulated?.optimized_cost_usd)}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                      <span>Net Cost Delta:</span>
                      <span
                        className="savings-pill"
                        style={{
                          background: charterSimResult.saving_usd >= 0 ? "rgba(79, 107, 42, 0.1)" : "rgba(155, 44, 44, 0.1)",
                          color: charterSimResult.saving_usd >= 0 ? "var(--gov-good)" : "var(--gov-risk)",
                          borderColor: charterSimResult.saving_usd >= 0 ? "var(--gov-good)" : "var(--gov-risk)",
                        }}
                      >
                        {charterSimResult.saving_usd >= 0 ? `Saves ${money(charterSimResult.saving_usd)}` : `Increases by ${money(Math.abs(charterSimResult.saving_usd))}`}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                      <span>Contract Mix Shift:</span>
                      <small style={{ fontWeight: 700, color: charterSimResult.mix_changed ? "var(--gov-khaki-dark)" : "var(--ink-muted)" }}>
                        {charterSimResult.mix_changed ? "Mix Re-allocated" : "Mix Unchanged (Cost Shift Only)"}
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret Layer 6 counterfactual explanations"
        rules={[
          "Counterfactual analysis answers: 'What minimal realistic modification to inputs flips the model decision or produces the highest savings?'",
          "Risk perturbations floor variables at 10.0 (realistic operational best-case) rather than 0.0 to prevent impossible mathematical solutions.",
          "Cost sensitivities re-solve the underlying HiGHS Linear Program to test whether contract allocation proportions (Spot vs COA) remain stable under market shocks.",
        ]}
        notAssumed={[
          "Simulated counterfactual savings are hypothetical scenario projections and do not guarantee market counterparty rate acceptance.",
          "Moving sandbox dials demonstrates model sensitivity; it does not alter logged baseline audit records.",
        ]}
      />
    </div>
  );
};
