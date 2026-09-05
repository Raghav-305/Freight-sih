import React, { useState } from "react";
import { checkEligibility, delayExposure } from "../api";

// Renders ELIGIBLE / ELIGIBLE_WITH_CONDITION / INELIGIBLE / UNKNOWN as
// distinct semantic states (never color-only, per Pillar 5 visual rules)
// and keeps delay-exposure vs contractual-demurrage visually separate,
// per the Pillar 4 "critical distinction" rule.

const STATUS_LABEL: Record<string, string> = {
  ELIGIBLE: "✅ Eligible",
  ELIGIBLE_WITH_CONDITION: "⚠️ Eligible (condition applies)",
  INELIGIBLE: "⛔ Ineligible",
  UNKNOWN: "❔ Unknown -- insufficient data",
};

export function EligibilityMatrix() {
  const [vessel, setVessel] = useState({ loa_m: 290, beam_m: 45, draft_m: 15.5 });
  const [portId, setPortId] = useState("PARADIP");
  const [berthId, setBerthId] = useState("BERTH_05");
  const [result, setResult] = useState<any>(null);
  const [exposure, setExposure] = useState<any>(null);

  const run = async () => {
    const out = await checkEligibility({ vessel, port_id: portId, berth_id: berthId || undefined });
    setResult(out);

    if (out.status === "ELIGIBLE_WITH_CONDITION" || out.status === "INELIGIBLE") {
      const exp = await delayExposure({
        waiting_days_p10: 1, waiting_days_p50: 3, waiting_days_p90: 7, daily_charter_hire_rate_usd: 18500,
      });
      setExposure(exp);
    } else {
      setExposure(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["loa_m", "beam_m", "draft_m"] as const).map((field) => (
          <label key={field} style={{ fontSize: 12 }}>
            {field}
            <input
              type="number"
              value={(vessel as any)[field]}
              onChange={(e) => setVessel({ ...vessel, [field]: Number(e.target.value) })}
              style={{ display: "block", width: 90 }}
            />
          </label>
        ))}
        <label style={{ fontSize: 12 }}>
          Port
          <input value={portId} onChange={(e) => setPortId(e.target.value)} style={{ display: "block", width: 110 }} />
        </label>
        <label style={{ fontSize: 12 }}>
          Berth (optional)
          <input value={berthId} onChange={(e) => setBerthId(e.target.value)} style={{ display: "block", width: 110 }} />
        </label>
        <button onClick={run} style={{ alignSelf: "flex-end" }}>Check eligibility</button>
      </div>

      {result && (
        <div style={{ border: "1px solid #1f2937", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700 }}>{STATUS_LABEL[result.status] ?? result.status}</div>
          {result.reasons?.length > 0 && <div style={{ fontSize: 12, opacity: 0.8 }}>Reasons: {result.reasons.join(", ")}</div>}
          {result.checks?.map((c: any) => (
            <div key={c.berth_id} style={{ fontSize: 12, marginTop: 4 }}>
              {c.berth_name ?? c.berth_id}: {STATUS_LABEL[c.status] ?? c.status}
            </div>
          ))}
          {result.warnings?.length > 0 && <div style={{ fontSize: 12, color: "#fcd34d" }}>{result.warnings.join(" ")}</div>}
        </div>
      )}

      {exposure && (
        <div style={{ border: "1px dashed #78350f", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fcd34d" }}>
            Modelled delay exposure (NOT contractual demurrage)
          </div>
          <div style={{ fontSize: 12 }}>
            P10: ${exposure.result.delay_exposure_low_p10_usd.toLocaleString()} &nbsp;|&nbsp;
            P50: ${exposure.result.delay_exposure_base_p50_usd.toLocaleString()} &nbsp;|&nbsp;
            P90: ${exposure.result.delay_exposure_high_p90_usd.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
