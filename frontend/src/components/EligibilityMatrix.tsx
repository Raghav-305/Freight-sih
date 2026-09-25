import React, { useState } from "react";
import { checkEligibility, delayExposure } from "../api";

// Renders ELIGIBLE / ELIGIBLE_WITH_CONDITION / INELIGIBLE / UNKNOWN as
// distinct semantic states (never color-only, per Pillar 5 visual rules)
// and keeps delay-exposure vs contractual-demurrage visually separate,
// per the Pillar 4 "critical distinction" rule.

const STATUS_LABEL: Record<string, string> = {
  ELIGIBLE: "FEASIBILITY: APPROVED",
  ELIGIBLE_WITH_CONDITION: "FEASIBILITY: APPROVED (Condition Applies)",
  INELIGIBLE: "FEASIBILITY: REJECTED",
  UNKNOWN: "FEASIBILITY: UNKNOWN",
};

export function EligibilityMatrix() {
  const VESSEL_CLASSES = {
    Handysize: { loa_m: 175, beam_m: 28, draft_m: 10 },
    Supramax: { loa_m: 199, beam_m: 32.2, draft_m: 12.2 },
    Panamax: { loa_m: 225, beam_m: 32.2, draft_m: 14.5 },
    Capesize: { loa_m: 290, beam_m: 45, draft_m: 17.8 },
  };

  const [vesselClass, setVesselClass] = useState("Capesize");
  const [vessel, setVessel] = useState(VESSEL_CLASSES["Capesize"]);
  const [portId, setPortId] = useState("HALDIA");
  const [result, setResult] = useState<any>(null);
  const [exposure, setExposure] = useState<any>(null);

  const handleVesselClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cls = e.target.value as keyof typeof VESSEL_CLASSES;
    setVesselClass(cls);
    setVessel(VESSEL_CLASSES[cls]);
  };

  const run = async () => {
    const out = await checkEligibility({ vessel, port_id: portId });
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
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          Port
          <select 
            value={portId} 
            onChange={(e) => setPortId(e.target.value)} 
            style={{ display: "block", marginTop: "4px", padding: "6px" }}
          >
            <option value="PARADIP">Paradip</option>
            <option value="DHAMRA">Dhamra</option>
            <option value="HALDIA">Haldia Dock Complex</option>
            <option value="VIZAG">Vizag</option>
          </select>
        </label>
        
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          Vessel Class
          <select 
            value={vesselClass} 
            onChange={handleVesselClassChange} 
            style={{ display: "block", marginTop: "4px", padding: "6px" }}
          >
            <option value="Handysize">Handysize</option>
            <option value="Supramax">Supramax</option>
            <option value="Panamax">Panamax</option>
            <option value="Capesize">Capesize</option>
          </select>
        </label>

        {(["loa_m", "beam_m", "draft_m"] as const).map((field) => (
          <label key={field} style={{ fontSize: 12, fontWeight: 600 }}>
            {field === "loa_m" ? "LOA (m)" : field === "beam_m" ? "Beam (m)" : "Draft (m)"}
            <input
              type="number"
              step="0.1"
              value={(vessel as any)[field]}
              onChange={(e) => setVessel({ ...vessel, [field]: Number(e.target.value) })}
              style={{ display: "block", width: 80, marginTop: "4px", padding: "6px" }}
            />
          </label>
        ))}

        <button onClick={run} className="btn-primary" style={{ padding: "8px 16px", height: "fit-content" }}>
          Check Port Compatibility
        </button>
      </div>

      {result && (
        <div style={{ 
          border: `1px solid ${result.status === 'INELIGIBLE' ? 'var(--brick)' : result.status === 'ELIGIBLE' ? 'var(--gov-good)' : '#1f2937'}`, 
          backgroundColor: result.status === 'INELIGIBLE' ? 'var(--brick-bg)' : result.status === 'ELIGIBLE' ? 'rgba(46, 160, 67, 0.1)' : 'transparent',
          borderRadius: 8, padding: 12 
        }}>
          <div style={{ 
            fontWeight: 700, 
            color: result.status === 'INELIGIBLE' ? 'var(--brick)' : result.status === 'ELIGIBLE' ? 'var(--gov-good)' : 'var(--ink)'
          }}>
            {result.status === "ELIGIBLE" && "✅ "}
            {result.status === "ELIGIBLE_WITH_CONDITION" && "⚠️ "}
            {result.status === "INELIGIBLE" && "⛔ "}
            {STATUS_LABEL[result.status] ?? result.status}
          </div>
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
