import React, { useState } from "react";
import { compareScenarios } from "../api";

// Renders the "Assumptions" drawer explicitly next to results, per
// 01_PILLAR_1_POLICY_ECONOMICS/IMPLEMENTATION_SPEC.md task 4, and never
// labels a row "best" without showing ranked_by (Definition of Done).

type ScenarioDraft = {
  label: string;
  scenario_type: "IMPORT" | "COASTAL";
  costs: { commodity: number; freight: number; insurance: number; port: number; handling: number; inland: number; other: number };
  gcv_kcal_per_kg?: number;
};

const emptyScenario = (label: string, type: "IMPORT" | "COASTAL"): ScenarioDraft => ({
  label,
  scenario_type: type,
  costs: { commodity: 0, freight: 0, insurance: 0, port: 0, handling: 0, inland: 0, other: 0 },
});

export function ScenarioComparator() {
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>([
    emptyScenario("Import (Gladstone -> Paradip)", "IMPORT"),
    emptyScenario("Coastal (Paradip -> Ennore)", "COASTAL"),
  ]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const updateCost = (idx: number, field: string, value: number) => {
    setScenarios((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], costs: { ...next[idx].costs, [field]: value } };
      return next;
    });
  };

  const run = async () => {
    setError(null);
    try {
      const payload = scenarios.map((s) => ({
        scenario_type: s.scenario_type,
        label: s.label,
        costs: s.costs,
        gcv_kcal_per_kg: s.gcv_kcal_per_kg ?? null,
        metadata: { currency: "USD", observed_at: new Date().toISOString() },
      }));
      const res = await compareScenarios(payload);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${scenarios.length}, 1fr)`, gap: 12 }}>
        {scenarios.map((s, idx) => (
          <div key={idx} style={{ border: "1px solid #1f2937", borderRadius: 8, padding: 12 }}>
            <strong>{s.label}</strong> <span style={{ opacity: 0.6 }}>({s.scenario_type})</span>
            {Object.keys(s.costs).map((field) => (
              <div key={field} style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <label style={{ fontSize: 12, opacity: 0.8 }}>{field}</label>
                <input
                  type="number"
                  value={(s.costs as any)[field]}
                  onChange={(e) => updateCost(idx, field, Number(e.target.value))}
                  style={{ width: 90 }}
                />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>GCV (kcal/kg)</label>
              <input
                type="number"
                value={s.gcv_kcal_per_kg ?? ""}
                onChange={(e) =>
                  setScenarios((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], gcv_kcal_per_kg: e.target.value ? Number(e.target.value) : undefined };
                    return next;
                  })
                }
                style={{ width: 90 }}
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={run}>Compare scenarios</button>
      {error && <div style={{ color: "#fca5a5" }}>{error}</div>}

      {result && (
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Rank</th>
                <th style={{ textAlign: "left" }}>Scenario</th>
                <th style={{ textAlign: "right" }}>Landed cost / t</th>
                <th style={{ textAlign: "right" }}>Cost / GJ</th>
              </tr>
            </thead>
            <tbody>
              {result.result.map((r: any) => (
                <tr key={r.result.label}>
                  <td>{r.result.rank}</td>
                  <td>{r.result.label}</td>
                  <td style={{ textAlign: "right" }}>{r.result.landed_cost_per_tonne}</td>
                  <td style={{ textAlign: "right" }}>{r.result.cost_per_gj ?? "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setAssumptionsOpen((v) => !v)} style={{ marginTop: 8 }}>
            {assumptionsOpen ? "Hide" : "Show"} assumptions
          </button>
          {assumptionsOpen && (
            <pre style={{ background: "#111827", padding: 8, borderRadius: 6, fontSize: 12, overflowX: "auto" }}>
              {JSON.stringify(result.result[0].assumptions, null, 2)}
              {"\n"}
              {result.warnings?.length ? `Warnings: ${result.warnings.join("; ")}` : ""}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
