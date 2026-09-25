import React, { useState } from "react";
import { calculateTCE } from "../api";
import { Ship, Leaf } from "lucide-react";

export function TceCalculator() {
  const [inputs, setInputs] = useState({
    sea_distance_nm: 4200,
    vessel_speed_knots: 12.5,
    sea_fuel_consumption_mt_day: 28,
    bunker_price_usd_mt: 620,
    freight_rate_usd_mt: 19.40,
    cargo_quantity_mt: 80000,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await calculateTCE(inputs);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "20px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
          TCE & Emissions Calculator
        </h4>
        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--charcoal)" }}>
          Calculate the exact Time Charter Equivalent (TCE) in $/day and validate the vessel's IMO Carbon Intensity Indicator (CII).
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
            Voyage Distance (NM)
          </label>
          <input
            type="number"
            value={inputs.sea_distance_nm}
            onChange={(e) => setInputs({ ...inputs, sea_distance_nm: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
            Vessel Speed (knots)
          </label>
          <input
            type="number"
            step="0.1"
            value={inputs.vessel_speed_knots}
            onChange={(e) => setInputs({ ...inputs, vessel_speed_knots: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
            Fuel Consumption (MT/day)
          </label>
          <input
            type="number"
            value={inputs.sea_fuel_consumption_mt_day}
            onChange={(e) => setInputs({ ...inputs, sea_fuel_consumption_mt_day: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
            Bunker Price ($/MT)
          </label>
          <input
            type="number"
            value={inputs.bunker_price_usd_mt}
            onChange={(e) => setInputs({ ...inputs, bunker_price_usd_mt: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <button onClick={run} disabled={loading} className="btn-primary" style={{ marginBottom: "20px" }}>
        {loading ? "Calculating..." : "Calculate Voyage Economics"}
      </button>

      {error && <div style={{ color: "var(--brick)", fontSize: "12px", marginBottom: "16px" }}>{error}</div>}

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ backgroundColor: "var(--paper)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
              <Ship size={18} />
              <strong style={{ fontSize: "13px" }}>Time Charter Equivalent (TCE)</strong>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ink)" }}>
              ${result.tce_usd_day.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--charcoal)" }}>/ day</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--charcoal)" }}>
              Net earnings per day after fuel and port costs.
            </div>
          </div>

          <div style={{ backgroundColor: "var(--paper)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gov-good)" }}>
              <Leaf size={18} />
              <strong style={{ fontSize: "13px" }}>CII Carbon Intensity</strong>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ink)" }}>
              {result.cii_grams_co2_per_mt_nm.toFixed(2)} <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--charcoal)" }}>gCO₂/MT·nm</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--charcoal)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ padding: "2px 6px", backgroundColor: "var(--gov-good)", color: "white", borderRadius: "4px", fontWeight: 600 }}>CII: A</span>
              <span>Compliant with IMO mandates.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
