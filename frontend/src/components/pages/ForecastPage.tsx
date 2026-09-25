import React, { useState } from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EmptyState } from "../ui/EmptyState";
import { TermTooltip } from "../ui/TermTooltip";
import { BarChart3, TrendingUp, Sliders, Table as TableIcon, HelpCircle, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ForecastPageProps {
  inputs: {
    origin: string;
    destination: string;
    vessel_type: string;
    cargo_type: string;
    cargo_quantity: number;
    laycan_start: string;
    laycan_end: string;
  };
  setInputs: React.Dispatch<React.SetStateAction<any>>;
  onRunForecast: () => void;
  loading: boolean;
  error: string | null;
  forecast: any;
  whatIfInputs: {
    origin: string;
    destination: string;
    vessel_type: string;
    cargo_type: string;
    cargo_quantity: number;
    freight_change_pct: number;
    bunker_change_pct: number;
  };
  setWhatIfInputs: React.Dispatch<React.SetStateAction<any>>;
  onRunWhatIf: () => void;
  whatIfLoading: boolean;
  whatIfError: string | null;
  whatIfResult: any;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({
  inputs,
  setInputs,
  onRunForecast,
  loading,
  error,
  forecast,
  whatIfInputs,
  setWhatIfInputs,
  onRunWhatIf,
  whatIfLoading,
  whatIfError,
  whatIfResult,
}) => {
  const [activeView, setActiveView] = useState<"cards" | "table" | "shap" | "whatif">("cards");

  const handleLoadExample = () => {
    setInputs({
      origin: "Australia",
      destination: "Dhamra",
      vessel_type: "Panamax",
      cargo_type: "Coal",
      cargo_quantity: 80000,
      laycan_start: "2026-10-10",
      laycan_end: "2026-10-20",
    });
  };

  const money = (v?: number) => (v != null ? `$${v.toFixed(2)}` : "—");

  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Economics"
        title="Route Freight Rate Forecast & Explainability"
        purpose="Forecast expected freight rate ranges across multi-horizon planning windows and explain the drivers pushing the forecast up or down."
        questions={[
          "What freight rate should be expected over the next 7, 30, 60, and 90-day planning horizons?",
          "How wide is the uncertainty spread between P10 (optimistic) and P90 (adverse) estimates?",
          "Which market and operational features (bunker, congestion, FFA) pushed the rate up or down?",
          "What happens to the rate if bunker fuel or market freight experiences an unexpected shock?",
        ]}
      />

      {/* 2. How-To Steps */}
      <HowToSteps
        onLoadExample={handleLoadExample}
        exampleLabel="Load example (Australia → Dhamra, Panamax, 80,000 MT, 10–20 Oct 2026)"
        steps={[
          {
            number: "1",
            title: "Enter",
            description: "Select origin, destination, vessel class, cargo quantity (MT), and laycan dates.",
          },
          {
            number: "2",
            title: "Run",
            description: "Press 'Generate Forecast' to execute the registered quantile model.",
          },
          {
            number: "3",
            title: "Interpret",
            description: "Compare P50 central case with the P10/P90 spread, and review SHAP factor attributions.",
          },
        ]}
      />

      {/* 3. Parameter Form */}
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
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--khaki-700)" }}>
            Voyage Inputs
          </span>
          <h3 style={{ fontSize: "1.125rem", margin: "4px 0 6px 0", fontFamily: "var(--font-serif)" }}>
            Route & Laycan Parameters
          </h3>
          <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0 }}>
            Specify shipment parameters to query the quantile forecasting service.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRunForecast();
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
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Origin
              </label>
              <select
                value={inputs.origin}
                onChange={(e) => setInputs({ ...inputs, origin: e.target.value })}
              >
                {["Australia", "Indonesia", "Mozambique", "Russia", "USA"].map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Load country or region
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Destination
              </label>
              <select
                value={inputs.destination}
                onChange={(e) => setInputs({ ...inputs, destination: e.target.value })}
              >
                {["Dhamra", "Gangavaram", "Gopalpur", "Haldia", "Paradip", "Vizag"].map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Indian discharge port
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Vessel Class
              </label>
              <select
                value={inputs.vessel_type}
                onChange={(e) => setInputs({ ...inputs, vessel_type: e.target.value })}
              >
                {["Panamax", "Supramax", "Capesize"].map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Ship size class
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Cargo Quantity (MT)
              </label>
              <input
                type="number"
                value={inputs.cargo_quantity}
                onChange={(e) => setInputs({ ...inputs, cargo_quantity: Number(e.target.value) })}
              />
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Shipment size in metric tonnes
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Laycan Start (<TermTooltip term="Laycan" />)
              </label>
              <input
                type="date"
                value={inputs.laycan_start}
                onChange={(e) => setInputs({ ...inputs, laycan_start: e.target.value })}
              />
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                First acceptable loading date
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Laycan End (<TermTooltip term="Laycan" />)
              </label>
              <input
                type="date"
                value={inputs.laycan_end}
                onChange={(e) => setInputs({ ...inputs, laycan_end: e.target.value })}
              />
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Last acceptable loading date
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="submit" disabled={loading} className="btn-primary">
              <span>{loading ? "Generating Quantile Forecast..." : "Generate Forecast"}</span>
            </button>
            <button type="button" onClick={handleLoadExample} className="btn-secondary">
              <span>Load example</span>
            </button>
          </div>
        </form>
      </section>

      {/* Error display */}
      {error && (
        <div style={{ padding: "14px 18px", backgroundColor: "var(--brick-bg)", border: "1px solid var(--brick-border)", borderRadius: "var(--radius)", color: "var(--brick)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Results or Empty State */}
      {!forecast ? (
        <EmptyState
          title="Your freight rate forecast will appear here"
          description="Once you run the model, you will see multi-horizon rate predictions across P10/P50/P90 confidence bounds, SHAP factor impacts, and sensitivity scenario tools."
          onLoadExample={handleLoadExample}
          exampleButtonLabel="Load example & Run"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "28px" }}>
          {/* View Mode Switcher */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--khaki-300)", paddingBottom: "10px" }}>
            <button
              type="button"
              onClick={() => setActiveView("cards")}
              style={{
                backgroundColor: activeView === "cards" ? "var(--ink)" : "var(--white)",
                color: activeView === "cards" ? "var(--white)" : "var(--ink)",
                border: "1px solid",
                borderColor: activeView === "cards" ? "var(--ink)" : "var(--khaki-300)",
                fontSize: "12px",
                padding: "6px 14px",
              }}
            >
              <BarChart3 size={13} />
              <span>Horizon Cards (P10/P50/P90)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("table")}
              style={{
                backgroundColor: activeView === "table" ? "var(--ink)" : "var(--white)",
                color: activeView === "table" ? "var(--white)" : "var(--ink)",
                border: "1px solid",
                borderColor: activeView === "table" ? "var(--ink)" : "var(--khaki-300)",
                fontSize: "12px",
                padding: "6px 14px",
              }}
            >
              <TableIcon size={13} />
              <span>Spread Table</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("shap")}
              style={{
                backgroundColor: activeView === "shap" ? "var(--ink)" : "var(--white)",
                color: activeView === "shap" ? "var(--white)" : "var(--ink)",
                border: "1px solid",
                borderColor: activeView === "shap" ? "var(--ink)" : "var(--khaki-300)",
                fontSize: "12px",
                padding: "6px 14px",
              }}
            >
              <TrendingUp size={13} />
              <span>Why? (<TermTooltip term="SHAP">SHAP Feature Impacts</TermTooltip>)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("whatif")}
              style={{
                backgroundColor: activeView === "whatif" ? "var(--ink)" : "var(--white)",
                color: activeView === "whatif" ? "var(--white)" : "var(--ink)",
                border: "1px solid",
                borderColor: activeView === "whatif" ? "var(--ink)" : "var(--khaki-300)",
                fontSize: "12px",
                padding: "6px 14px",
              }}
            >
              <Sliders size={13} />
              <span>What-If Shock Simulator</span>
            </button>
          </div>

          {/* VIEW 1: HORIZON CARDS */}
          {activeView === "cards" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {Object.entries(forecast.forecast || {}).map(([horizon, band]: [string, any]) => {
                const spread = band.p90 - band.p10;
                return (
                  <div
                    key={horizon}
                    style={{
                      backgroundColor: "var(--white)",
                      border: "1px solid var(--khaki-300)",
                      borderRadius: "var(--radius)",
                      padding: "18px",
                      boxShadow: "var(--shadow-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--paper)",
                            border: "1px solid var(--khaki-300)",
                            color: "var(--ink)",
                            textTransform: "uppercase",
                          }}
                        >
                          {horizon.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--khaki-700)", fontWeight: 600 }}>
                          Spread: ${spread.toFixed(2)}/MT
                        </span>
                      </div>

                      <div style={{ margin: "12px 0 8px 0" }}>
                        <span style={{ fontSize: "11px", color: "var(--charcoal)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                          Central Case (P50)
                        </span>
                        <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-serif)" }}>
                          {money(band.p50)} <span style={{ fontSize: "12px", color: "var(--charcoal)" }}>/ MT</span>
                        </div>
                      </div>

                      {/* Visual Quantile Range Bar */}
                      <div style={{ margin: "14px 0 8px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--charcoal)", marginBottom: "3px" }}>
                          <span style={{ color: "var(--olive)", fontWeight: 700 }}>P10: {money(band.p10)}</span>
                          <span style={{ color: "var(--amber)", fontWeight: 700 }}>P90: {money(band.p90)}</span>
                        </div>
                        <div style={{ height: "8px", backgroundColor: "var(--paper)", border: "1px solid var(--khaki-300)", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                          <div
                            style={{
                              position: "absolute",
                              left: "20%",
                              width: "60%",
                              height: "100%",
                              backgroundColor: "var(--sand-100)",
                              borderRadius: "2px",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              width: "3px",
                              height: "100%",
                              backgroundColor: "var(--ink)",
                            }}
                            title={`P50 Central: ${money(band.p50)}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--sand-100)", paddingTop: "8px", marginTop: "8px", fontSize: "10.5px", color: "var(--charcoal)" }}>
                      <span>Model: <code style={{ fontSize: "10px" }}>{forecast.model_version}</code></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: SPREAD TABLE */}
          {activeView === "table" && (
            <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--paper)", borderBottom: "2px solid var(--khaki-300)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Planning Horizon</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>P10 (Lower Bound)</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>P50 (Central Case)</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>P90 (Adverse Case)</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Uncertainty Spread</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Spread Volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(forecast.forecast || {}).map(([horizon, band]: [string, any]) => {
                    const spread = band.p90 - band.p10;
                    const isHighUncertainty = spread > 4.0;
                    return (
                      <tr key={horizon} style={{ borderBottom: "1px solid var(--sand-100)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>{horizon.toUpperCase()}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--olive)", fontWeight: 600 }}>{money(band.p10)}/MT</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--ink)" }}>{money(band.p50)}/MT</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--amber)", fontWeight: 600 }}>{money(band.p90)}/MT</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>${spread.toFixed(2)}/MT</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "var(--radius-pill)",
                              fontSize: "10.5px",
                              fontWeight: 600,
                              backgroundColor: isHighUncertainty ? "var(--brick-bg)" : "var(--olive-bg)",
                              color: isHighUncertainty ? "var(--brick)" : "var(--olive)",
                              border: `1px solid ${isHighUncertainty ? "var(--brick-border)" : "var(--olive-border)"}`,
                            }}
                          >
                            {isHighUncertainty ? "Elevated Spread" : "Normal Spread"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 3: SHAP EXPLAINABILITY */}
          {activeView === "shap" && (
            <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "20px" }}>
              <div style={{ marginBottom: "14px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
                  SHAP Factor Impact Attribution
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--charcoal)" }}>
                  Factors pushing the forecast above (brick) or below (olive) the historical training baseline.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(forecast.shap || []).map((item: any, idx: number) => {
                  const isUp = item.impact > 0;
                  const absImpact = Math.abs(item.impact);
                  const widthPct = Math.min(100, (absImpact / 3.0) * 100);

                  return (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "220px 1fr 90px",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "12px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.feature}
                      </span>

                      <div style={{ height: "12px", backgroundColor: "var(--paper)", border: "1px solid var(--sand-100)", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.max(10, widthPct)}%`,
                            height: "100%",
                            backgroundColor: isUp ? "var(--brick)" : "var(--olive)",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>

                      <span style={{ fontWeight: 700, textAlign: "right", color: isUp ? "var(--brick)" : "var(--olive)" }}>
                        {isUp ? "+$" : "-$"}{absImpact.toFixed(2)}/MT
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px solid var(--sand-100)", fontSize: "11px", color: "var(--charcoal)", display: "flex", justifyContent: "space-between" }}>
                <span>Model Confidence: <strong>{Math.round((forecast.confidence || 0.85) * 100)}%</strong></span>
                <span>Training Cutoff: <strong>{forecast.training_date || "2026-06-30"}</strong></span>
              </div>
            </div>
          )}

          {/* VIEW 4: WHAT-IF SENSITIVITY */}
          {activeView === "whatif" && (
            <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
                  What-If Scenario Shocks
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--charcoal)" }}>
                  Simulate instantaneous market perturbations on fuel and base freight.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onRunWhatIf();
                }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Freight Shock (%)
                  </label>
                  <input
                    type="number"
                    value={whatIfInputs.freight_change_pct}
                    onChange={(e) => setWhatIfInputs({ ...whatIfInputs, freight_change_pct: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Bunker Fuel Shock (%)
                  </label>
                  <input
                    type="number"
                    value={whatIfInputs.bunker_change_pct}
                    onChange={(e) => setWhatIfInputs({ ...whatIfInputs, bunker_change_pct: Number(e.target.value) })}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button type="submit" disabled={whatIfLoading} className="btn-primary" style={{ width: "100%" }}>
                    <span>{whatIfLoading ? "Simulating..." : "Run What-If Shock"}</span>
                  </button>
                </div>
              </form>

              {whatIfResult && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "16px" }}>
                  {whatIfResult.horizons?.map((item: any) => {
                    const isUp = item.delta_usd_mt >= 0;
                    return (
                      <div
                        key={item.horizon}
                        style={{
                          backgroundColor: "var(--paper)",
                          border: "1px solid var(--khaki-300)",
                          borderRadius: "var(--radius)",
                          padding: "14px",
                        }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                          {item.horizon} Shock Case
                        </span>
                        <div style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--ink)", margin: "4px 0" }}>
                          {money(item.scenario_usd_mt)}/MT
                        </div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: isUp ? "var(--brick)" : "var(--olive)", display: "flex", alignItems: "center", gap: "2px" }}>
                          {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          <span>{isUp ? `+${item.delta_usd_mt.toFixed(2)}` : item.delta_usd_mt.toFixed(2)}/MT ({item.delta_pct > 0 ? `+${item.delta_pct}%` : `${item.delta_pct}%`})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Result Guide & Cautions */}
      <ResultGuide
        items={[
          {
            term: "P10 / P50 / P90",
            explanation:
              "Three planning quantiles. P50 is the expected central case, P10 is the lower optimistic case, and P90 is the adverse market ceiling.",
          },
          {
            term: "SHAP Feature Impacts",
            explanation:
              "Explains how specific market variables (FFA, bunker price, port congestion, vessel supply) pushed this prediction higher or lower relative to historical benchmarks.",
          },
          {
            term: "Multi-Horizon Planning",
            explanation:
              "Evaluates freight across 7-day, 30-day, 60-day, and 90-day windows to determine whether forward market pressure increases with voyage lead time.",
          },
          {
            term: "Scenario Shocks (What-If)",
            explanation:
              "Deterministic sensitivity analysis to stress-test procurement budgets against sudden bunker spikes or spot freight volatility.",
          },
        ]}
        cautions={[
          "A forecast is an empirical range, not a guaranteed contractual rate.",
          "High confidence indicates statistical model fit, not an exemption from commercial market diligence.",
          "A wide gap between P10 and P90 indicates higher market risk requiring stronger hedging or COA coverage.",
          "Deterministic what-if shifts do not replace re-running the full model when underlying market structures change.",
        ]}
      />
    </div>
  );
};
