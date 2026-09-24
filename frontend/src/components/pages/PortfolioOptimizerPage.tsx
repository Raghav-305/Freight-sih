import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EmptyState } from "../ui/EmptyState";
import { TermTooltip } from "../ui/TermTooltip";
import { Briefcase, PieChart, ShieldAlert, CheckCircle, ArrowRight, DollarSign, Calendar } from "lucide-react";

interface PortfolioOptimizerPageProps {
  inputs: {
    cargo_quantity: number;
    origin: string;
    destination: string;
    vessel_class: string;
    period_start: string;
    period_end: string;
    delivery_date: string;
    max_share: number;
    contract_options: string[];
    market_regime: string;
  };
  setInputs: React.Dispatch<React.SetStateAction<any>>;
  onRunOptimization: () => void;
  loading: boolean;
  error: string | null;
  result: any;
}

export const PortfolioOptimizerPage: React.FC<PortfolioOptimizerPageProps> = ({
  inputs,
  setInputs,
  onRunOptimization,
  loading,
  error,
  result,
}) => {
  const handleLoadExample = () => {
    setInputs({
      cargo_quantity: 480000,
      origin: "Gladstone",
      destination: "Dhamra",
      vessel_class: "Panamax",
      period_start: "2026-10-01",
      period_end: "2027-03-31",
      delivery_date: "2026-10-15",
      max_share: 0.5,
      contract_options: ["spot", "short_term", "multi_voyage", "coa"],
      market_regime: "BULLISH",
    });
  };

  const money = (v?: number) => (v != null ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—");

  const baselineCost = result?.baseline_cost ?? result?.baseline_cost_usd ?? result?.current_plan_cost_usd ?? 0;
  const optimizedCost = result?.expected_cost ?? result?.optimized_cost_usd ?? 0;
  const savings = result?.expected_saving ?? result?.expected_saving_usd ?? result?.cost_reduction_usd ?? result?.savings_usd ?? 0;
  const savingsPct = result?.expected_saving_pct ?? (baselineCost > 0 ? (savings / baselineCost) * 100 : 0);
  const distance = result?.distance_nm ?? result?.route_distance_nm ?? 4616;
  const voyages = result?.voyages_needed ?? Math.max(1, Math.round(inputs.cargo_quantity / 70000));
  const alloc = result?.allocation || { coa: 35, multi_voyage: 25, short_term: 20, spot: 20 };
  const rates = result?.rates_usd_mt || { coa: 18.20, multi_voyage: 18.80, short_term: 19.10, spot: 19.40 };

  const coaPct = alloc.coa ?? 0;
  const mvcPct = alloc.multi_voyage ?? alloc.mvc ?? 0;
  const shortTermPct = alloc.short_term ?? 0;
  const spotPct = alloc.spot ?? 0;

  const coaRate = rates.coa ?? 18.14;
  const mvcRate = rates.multi_voyage ?? 18.72;
  const shortTermRate = rates.short_term ?? 18.43;
  const spotRate = rates.spot ?? 19.40;

  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Economics"
        title="Charter Contract Portfolio Optimization"
        purpose="Calculate lower-cost cargo coverage allocations across spot, short-term, multi-voyage, and COA contracts using linear programming."
        questions={[
          "How should total cargo commitments be split between spot voyages and long-term contracts?",
          "What is the projected procurement cost savings versus 100% spot market exposure?",
          "How many total voyages are needed to move the required tonnage?",
          "What is the recommended fixing window to balance market risk and budget certainty?",
        ]}
      />

      {/* 2. How-To Steps */}
      <HowToSteps
        onLoadExample={handleLoadExample}
        exampleLabel="Load example (Gladstone → Dhamra, Panamax, 480,000 MT, Max Share 50%)"
        steps={[
          {
            number: "1",
            title: "Enter",
            description: "Define total cargo volume (MT), origin load port, discharge port, and maximum single-contract share.",
          },
          {
            number: "2",
            title: "Run",
            description: "Press 'Calculate Optimal Contract Allocation' to execute the HiGHS LP solver.",
          },
          {
            number: "3",
            title: "Interpret",
            description: "Compare baseline spot exposure with the optimized portfolio and review the volume split.",
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
            Allocation Constraints
          </span>
          <h3 style={{ fontSize: "1.125rem", margin: "4px 0 6px 0", fontFamily: "var(--font-serif)" }}>
            Contract Portfolio Constraints & Commitment
          </h3>
          <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0 }}>
            Configure total tonnage and risk limits for the linear programming solver.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRunOptimization();
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
                Total Commitment (MT)
              </label>
              <input
                type="number"
                value={inputs.cargo_quantity}
                onChange={(e) => setInputs({ ...inputs, cargo_quantity: Number(e.target.value) })}
              />
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Total coal quantity to transport
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Load Port
              </label>
              <select
                value={inputs.origin}
                onChange={(e) => setInputs({ ...inputs, origin: e.target.value })}
              >
                {[
                  "Gladstone",
                  "Newcastle",
                  "Hay Point",
                  "Dalrymple Bay",
                  "Taboneo",
                  "Muara Pantai",
                  "Samarinda",
                  "Hampton Roads",
                  "Baltimore",
                  "New Orleans",
                  "Beira",
                  "Nacala",
                  "Vostochny (Far East)",
                ].map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Designated origin loading terminal
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Discharge Port
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
                Indian receiving port
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Vessel Class
              </label>
              <select
                value={inputs.vessel_class}
                onChange={(e) => setInputs({ ...inputs, vessel_class: e.target.value })}
              >
                {["Panamax", "Capesize"].map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Target ship size
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Max Single Contract Share: {Math.round(inputs.max_share * 100)}%
              </label>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={inputs.max_share}
                onChange={(e) => setInputs({ ...inputs, max_share: Number(e.target.value) })}
                style={{ height: "38px" }}
              />
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Prevents over-concentration in one structure
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="submit" disabled={loading} className="btn-primary">
              <span>{loading ? "Optimizing Portfolio..." : "Calculate Optimal Contract Allocation"}</span>
            </button>
            <button type="button" onClick={handleLoadExample} className="btn-secondary">
              <span>Load example</span>
            </button>
          </div>
        </form>
      </section>

      {/* Error display */}
      {error && (
        <div style={{ padding: "14px 18px", backgroundColor: "var(--brick-bg)", border: "1px solid var(--brick-border)", borderRadius: "var(--radius)", color: "var(--brick)", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* 4. Results or Empty State */}
      {!result ? (
        <EmptyState
          title="Your portfolio allocation will appear here"
          description="Once you run the optimizer, you will see the recommended contract mix across spot, short-term, multi-voyage, and COA agreements, with projected dollar savings and voyage counts."
          onLoadExample={handleLoadExample}
          exampleButtonLabel="Load example & Optimize"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "28px" }}>
              {/* Strategy & Market Regime Banner */}
              <div
                style={{
                  backgroundColor: "var(--paper)",
                  border: "1px solid var(--khaki-400)",
                  borderRadius: "var(--radius)",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--khaki-700)" }}>
                    Recommended LP Charter Strategy
                  </div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-serif)" }}>
                    {result.strategy || "COA-HEAVY FORWARD HEDGE"}
                  </div>
                  {result.fixing_window && (
                    <div style={{ fontSize: "12px", color: "var(--charcoal)", marginTop: "4px" }}>
                      <strong>Fixing Window:</strong> {result.fixing_window}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: "var(--olive-bg)",
                      color: "var(--olive)",
                      border: "1px solid var(--olive-border)",
                    }}
                  >
                    {result.risk || "MODERATE-LOW (HEDGED)"}
                  </span>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: "var(--khaki-100)",
                      color: "var(--khaki-800)",
                      border: "1px solid var(--khaki-300)",
                    }}
                  >
                    {inputs.market_regime || "BULLISH"} REGIME
                  </span>
                </div>
              </div>

              {/* Baseline vs Optimized Cost Banner */}
              <div
                style={{
                  backgroundColor: "var(--white)",
                  border: "1px solid var(--khaki-300)",
                  borderRadius: "var(--radius)",
                  padding: "20px",
                  boxShadow: "var(--shadow-subtle)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                    Baseline Spot Cost
                  </span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--charcoal)" }}>
                    {money(baselineCost)}
                  </div>
                  <small style={{ color: "var(--charcoal)", fontSize: "11px" }}>If 100% procured on spot</small>
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--olive)" }}>
                    LP Optimized Cost
                  </span>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-serif)" }}>
                    {money(optimizedCost)}
                  </div>
                  <small style={{ color: "var(--olive)", fontSize: "11px", fontWeight: 700 }}>Recommended portfolio</small>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--olive-bg)",
                    border: "1px solid var(--olive-border)",
                    borderRadius: "var(--radius)",
                    padding: "12px 16px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--olive)" }}>
                    Projected Savings
                  </span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--olive)" }}>
                    {money(savings)}
                  </div>
                  <small style={{ color: "var(--olive)", fontSize: "11px", fontWeight: 600 }}>
                    {savingsPct > 0 ? `${savingsPct.toFixed(1)}% capital savings` : "Reduction vs Spot"}
                  </small>
                </div>

                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>
                    Total Voyages Required
                  </span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ink)" }}>
                    {voyages} Voyages
                  </div>
                  <small style={{ color: "var(--charcoal)", fontSize: "11px" }}>
                    Distance: {distance.toLocaleString()} nm
                  </small>
                </div>
              </div>

              {/* Allocation Stacked Bar Breakdown */}
              <div
                style={{
                  backgroundColor: "var(--white)",
                  border: "1px solid var(--khaki-300)",
                  borderRadius: "var(--radius)",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
                      Recommended Contract Volume Allocation
                    </h4>
                    <span style={{ fontSize: "11px", color: "var(--charcoal)" }}>
                      Split across spot, short-term, multi-voyage, and <TermTooltip term="COA">COA</TermTooltip> agreements
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--khaki-700)" }}>
                    Total: {(inputs.cargo_quantity / 1000).toFixed(0)}k MT
                  </div>
                </div>

                {/* Visual allocation progress strip */}
                <div style={{ height: "20px", width: "100%", display: "flex", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--sand-100)", marginBottom: "16px" }}>
                  {coaPct > 0 && <div style={{ width: `${coaPct}%`, backgroundColor: "#1D4ED8" }} title={`COA (${coaPct}%)`} />}
                  {mvcPct > 0 && <div style={{ width: `${mvcPct}%`, backgroundColor: "#0284C7" }} title={`Multi-Voyage (${mvcPct}%)`} />}
                  {shortTermPct > 0 && <div style={{ width: `${shortTermPct}%`, backgroundColor: "#0D9488" }} title={`Short-Term (${shortTermPct}%)`} />}
                  {spotPct > 0 && <div style={{ width: `${spotPct}%`, backgroundColor: "#EAB308" }} title={`Spot (${spotPct}%)`} />}
                </div>

                {/* Structure Breakdown Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "12px", border: "1px solid var(--sand-100)", borderRadius: "var(--radius)", backgroundColor: "var(--paper)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#1D4ED8" }}>■ Contract of Affreightment (COA)</span>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700, margin: "4px 0" }}>
                      {coaPct}% ({Math.round((coaPct / 100) * inputs.cargo_quantity).toLocaleString()} MT)
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "10.5px" }}>
                      Est. Rate: ${coaRate.toFixed(2)} / MT · {(voyages * (coaPct / 100)).toFixed(1)} Voyages
                    </small>
                  </div>

                  <div style={{ padding: "12px", border: "1px solid var(--sand-100)", borderRadius: "var(--radius)", backgroundColor: "var(--paper)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>■ Multi-Voyage Arrangement</span>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700, margin: "4px 0" }}>
                      {mvcPct}% ({Math.round((mvcPct / 100) * inputs.cargo_quantity).toLocaleString()} MT)
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "10.5px" }}>
                      Est. Rate: ${mvcRate.toFixed(2)} / MT · {(voyages * (mvcPct / 100)).toFixed(1)} Voyages
                    </small>
                  </div>

                  <div style={{ padding: "12px", border: "1px solid var(--sand-100)", borderRadius: "var(--radius)", backgroundColor: "var(--paper)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0D9488" }}>■ Short-Term Coverage</span>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700, margin: "4px 0" }}>
                      {shortTermPct}% ({Math.round((shortTermPct / 100) * inputs.cargo_quantity).toLocaleString()} MT)
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "10.5px" }}>
                      Est. Rate: ${shortTermRate.toFixed(2)} / MT · {(voyages * (shortTermPct / 100)).toFixed(1)} Voyages
                    </small>
                  </div>

                  <div style={{ padding: "12px", border: "1px solid var(--sand-100)", borderRadius: "var(--radius)", backgroundColor: "var(--paper)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#B45309" }}>■ Spot Voyage Buffer</span>
                    <div style={{ fontSize: "1.125rem", fontWeight: 700, margin: "4px 0" }}>
                      {spotPct}% ({Math.round((spotPct / 100) * inputs.cargo_quantity).toLocaleString()} MT)
                    </div>
                    <small style={{ color: "var(--charcoal)", fontSize: "10.5px" }}>
                      Est. Rate: ${spotRate.toFixed(2)} / MT · {(voyages * (spotPct / 100)).toFixed(1)} Voyages
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* 5. Result Guide & Cautions */}
      <ResultGuide
        items={[
          {
            term: "Contract of Affreightment (COA)",
            explanation:
              "A long-term volume commitment with a shipowner to move a designated quantity over fixed dates at locked rates.",
          },
          {
            term: "Maximum Share Constraint",
            explanation:
              "Ensures procurement risk is diversified across multiple owners and contract types rather than creating a single counterparty dependency.",
          },
          {
            term: "HiGHS LP Solver",
            explanation:
              "An open-source mathematical linear-programming solver that computes the lowest-cost allocation subject to volume and share constraints.",
          },
          {
            term: "Spot vs Term Arbitrage",
            explanation:
              "Term agreements discount freight in exchange for volume certainty, whereas spot charters allow capturing falling rate cycles.",
          },
        ]}
        cautions={[
          "An LP-optimized allocation is an advisory planning target, not an executed charter contract.",
          "Over-constraining the portfolio to low-cost term structures can reduce flexibility if discharge schedules change.",
          "Execution requires verified market counterparty appetite under the applicable tender framework.",
        ]}
      />
    </div>
  );
};
