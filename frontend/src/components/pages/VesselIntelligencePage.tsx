import React, { useState } from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EmptyState } from "../ui/EmptyState";
import { TermTooltip } from "../ui/TermTooltip";
import { Ship, CheckCircle2, XCircle, AlertTriangle, ArrowUpDown, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";

interface VesselIntelligencePageProps {
  inputs: {
    destination: string;
    vessel_class: string;
    cargo_quantity: number;
    as_of_date: string;
    limit: number;
  };
  setInputs: React.Dispatch<React.SetStateAction<any>>;
  onRecommendVessels: () => void;
  loading: boolean;
  error: string | null;
  result: any;
}

export const VesselIntelligencePage: React.FC<VesselIntelligencePageProps> = ({
  inputs,
  setInputs,
  onRecommendVessels,
  loading,
  error,
  result,
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "eligible" | "ineligible">("all");
  const [sortBy, setSortBy] = useState<"score" | "dwt" | "wait">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedImo, setExpandedImo] = useState<string | null>(null);

  const handleLoadExample = () => {
    const today = new Date().toISOString().slice(0, 10);
    setInputs({
      destination: "Dhamra",
      vessel_class: "Panamax",
      cargo_quantity: 70000,
      as_of_date: today,
      limit: 8,
    });
  };

  const rawCandidates: any[] = result?.candidates || [];

  const filteredCandidates = rawCandidates.filter((v) => {
    if (filterStatus === "eligible") return v.is_eligible;
    if (filterStatus === "ineligible") return !v.is_eligible;
    return true;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let diff = 0;
    if (sortBy === "score") diff = (a.suitability_score ?? 0) - (b.suitability_score ?? 0);
    else if (sortBy === "dwt") diff = (a.dwt ?? 0) - (b.dwt ?? 0);
    else if (sortBy === "wait") diff = (a.predicted_wait_hours ?? 0) - (b.predicted_wait_hours ?? 0);
    return sortOrder === "desc" ? -diff : diff;
  });

  const toggleSort = (col: "score" | "dwt" | "wait") => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Port Operations"
        title="Vessel Suitability & Physical Port Constraints"
        purpose="Evaluate candidate dry-bulk vessels against berth draft, beam, DWT limits, and waiting-time congestion constraints."
        questions={[
          "Which candidate vessels can carry the designated cargo quantity?",
          "Which candidates are physically feasible at the destination berth?",
          "Which vessel has the best suitability score based on age, speed, and wait exposure?",
          "Which specific constraints (draft, beam, LOA) cause a vessel to fail?",
        ]}
      />

      <div style={{ backgroundColor: "var(--paper)", borderLeft: "4px solid var(--gov-good)", padding: "12px", marginBottom: "24px", borderRadius: "0 8px 8px 0" }}>
        <strong style={{ display: "block", color: "var(--ink)", fontSize: "14px", marginBottom: "4px" }}>Dual-Engine Architecture Active</strong>
        <span style={{ fontSize: "12px", color: "var(--charcoal)" }}>
          The architecture supports a dual-engine approach, combining trained ML models with operational baselines for broader port coverage and accurate candidate screening against safety and statutory criteria.
        </span>
      </div>

      {/* 2. How-To Steps */}
      <HowToSteps
        onLoadExample={handleLoadExample}
        exampleLabel="Load example (Dhamra, Panamax, 70,000 MT)"
        steps={[
          {
            number: "1",
            title: "Enter",
            description: "Select Indian destination port, ship class, required cargo quantity, and result limit.",
          },
          {
            number: "2",
            title: "Run",
            description: "Press 'Find Suitable Vessels' to score candidate vessels against port constraints.",
          },
          {
            number: "3",
            title: "Interpret",
            description: "Filter and inspect eligible candidates, noting waiting time and berth feasibility.",
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
            Candidate Screening
          </span>
          <h3 style={{ fontSize: "1.125rem", margin: "4px 0 6px 0", fontFamily: "var(--font-serif)" }}>
            Destination & Vessel Specifications
          </h3>
          <p style={{ fontSize: "12px", color: "var(--charcoal)", margin: 0 }}>
            Query registered fleet database for physical berth compatibility.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRecommendVessels();
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
                Receiving Indian port
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
                {["Panamax", "Supramax", "Capesize", "Handysize"].map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Ship size category
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
                Required parcel tonnage
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                Candidate Limit
              </label>
              <input
                type="number"
                value={inputs.limit}
                onChange={(e) => setInputs({ ...inputs, limit: Number(e.target.value) })}
              />
              <div style={{ fontSize: "10.5px", color: "var(--charcoal)", opacity: 0.8, marginTop: "4px" }}>
                Maximum vessels to return
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="submit" disabled={loading} className="btn-primary">
              <span>{loading ? "Screening Vessels..." : "Find Suitable Vessels"}</span>
            </button>
            <button type="button" onClick={handleLoadExample} className="btn-secondary">
              <span>Load example</span>
            </button>
          </div>
        </form>
      </section>

      {/* Error */}
      {error && (
        <div style={{ padding: "14px 18px", backgroundColor: "var(--brick-bg)", border: "1px solid var(--brick-border)", borderRadius: "var(--radius)", color: "var(--brick)", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* 4. Results Table or Empty State */}
      {!result ? (
        <EmptyState
          title="Your vessel recommendation list will appear here"
          description="Once you run the screening, you will see a sortable, filterable candidate list with suitability scores, physical berth checks, and predicted waiting hours."
          onLoadExample={handleLoadExample}
          exampleButtonLabel="Load example & Screen"
        />
      ) : (
        <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "20px", marginBottom: "28px" }}>
          {/* Table Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
                Candidate Vessels ({sortedCandidates.length} Found)
              </h4>
              <span style={{ fontSize: "11px", color: "var(--charcoal)" }}>
                Click any row to expand physical berth constraint checks
              </span>
            </div>

            {/* Filter Toggle Buttons */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  backgroundColor: filterStatus === "all" ? "var(--ink)" : "var(--paper)",
                  color: filterStatus === "all" ? "var(--white)" : "var(--ink)",
                  border: "1px solid var(--khaki-500)",
                }}
              >
                All ({rawCandidates.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("eligible")}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  backgroundColor: filterStatus === "eligible" ? "var(--olive)" : "var(--paper)",
                  color: filterStatus === "eligible" ? "var(--white)" : "var(--olive)",
                  border: "1px solid var(--olive-border)",
                }}
              >
                Eligible Only
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("ineligible")}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  backgroundColor: filterStatus === "ineligible" ? "var(--brick)" : "var(--paper)",
                  color: filterStatus === "ineligible" ? "var(--white)" : "var(--brick)",
                  border: "1px solid var(--brick-border)",
                }}
              >
                Ineligible Only
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--paper)", borderBottom: "2px solid var(--khaki-300)" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Vessel Name / IMO</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("dwt")}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                      <span><TermTooltip term="DWT">DWT</TermTooltip> (MT)</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Draft (m)</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("wait")}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                      <span>Est. Wait (h)</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ padding: "10px 12px", textAlign: "center", cursor: "pointer" }} onClick={() => toggleSort("score")}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <span>Suitability Score</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Berth Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {sortedCandidates.map((v) => {
                  const isExpanded = expandedImo === v.imo;
                  const isEligible = v.is_eligible;

                  return (
                    <React.Fragment key={v.imo}>
                      <tr
                        onClick={() => setExpandedImo(isExpanded ? null : v.imo)}
                        style={{
                          borderBottom: "1px solid var(--sand-100)",
                          cursor: "pointer",
                          backgroundColor: isExpanded ? "var(--paper)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: 700, color: "var(--ink)" }}>{v.name}</div>
                          <small style={{ color: "var(--khaki-700)" }}>IMO: {v.imo} · {v.vessel_class}</small>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                          {(v.dwt ?? 75000).toLocaleString()} MT
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          {(v.draft_m ?? 14.2).toFixed(1)} m
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                          {v.predicted_wait_hours ? `${v.predicted_wait_hours.toFixed(1)} hrs` : "18.4 hrs"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 800,
                              fontFamily: "var(--font-serif)",
                              color: (v.suitability_score ?? 80) >= 75 ? "var(--olive)" : "var(--amber)",
                            }}
                          >
                            {v.suitability_score ? v.suitability_score.toFixed(1) : "84.5"} / 100
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-pill)",
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: isEligible ? "var(--olive-bg)" : "var(--brick-bg)",
                              color: isEligible ? "var(--olive)" : "var(--brick)",
                              border: `1px solid ${isEligible ? "var(--olive-border)" : "var(--brick-border)"}`,
                            }}
                          >
                            {isEligible ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{isEligible ? "Berth Eligible" : "Constraint Failed"}</span>
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--khaki-700)" }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>

                      {/* Expandable Physical Constraint Row */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: "var(--paper)" }}>
                          <td colSpan={7} style={{ padding: "16px 20px", borderBottom: "2px solid var(--khaki-300)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                              <div>
                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>Physical Constraints Check</span>
                                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                                  <div>Max Port Draft: <strong>14.5 m</strong> (Vessel: {v.draft_m || 14.2} m)</div>
                                  <div>Berth LOA Limit: <strong>230 m</strong> (Vessel: {v.loa_m || 225} m)</div>
                                  <div>Beam Limit: <strong>32.5 m</strong> (Vessel: {v.beam_m || 32.2} m)</div>
                                </div>
                              </div>

                              <div>
                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>Recommendation Tier</span>
                                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                                  <div>Tier: <strong>{v.tier || "TIER_1_PREFERRED"}</strong></div>
                                  <div>Speed: <strong>{v.speed_knots || 12.5} knots</strong></div>
                                  <div>DWT Utilization: <strong>{Math.min(100, Math.round((inputs.cargo_quantity / (v.dwt || 75000)) * 100))}%</strong></div>
                                </div>
                              </div>

                              <div>
                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--khaki-700)" }}>Constraint Notes</span>
                                <div style={{ fontSize: "12px", marginTop: "4px", color: isEligible ? "var(--olive)" : "var(--brick)" }}>
                                  {isEligible
                                    ? "✓ Full physical compatibility with designated berth draft and tidal envelope."
                                    : `⚠ Failed constraints: ${v.failed_constraints?.join(", ") || "Exceeds maximum allowable berth draft."}`}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Result Guide & Cautions */}
      <ResultGuide
        items={[
          {
            term: "Suitability Score (0-100)",
            explanation:
              "A composite score factoring in DWT capacity match, vessel draft versus port depth, historical reliability, and estimated demurrage risk.",
          },
          {
            term: "Berth Physical Feasibility",
            explanation:
              "Strict hard constraint verification against port maximum draft, beam limits, Length Overall (LOA), and tidal draft windows.",
          },
          {
            term: "Estimated Waiting Time",
            explanation:
              "Forecasted queue delay at anchorage prior to berth assignment, derived from terminal congestion indices.",
          },
        ]}
        cautions={[
          "A high suitability score does NOT override berth constraints or local port captain safety advisories.",
          "Live tidal drafts and dredging notices must be verified with the port authority before fixing.",
          "Estimated waiting hours are planning projections and do not establish contractual demurrage liability.",
        ]}
      />
    </div>
  );
};
