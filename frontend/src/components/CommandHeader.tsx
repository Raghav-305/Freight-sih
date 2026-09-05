import React, { useEffect, useState } from "react";
import { getCommandCenterSummary } from "../api";
import { FreshnessBadge } from "./FreshnessBadge";

// Top navigation bar per 05_PILLAR_5_COMMAND_CENTER/DEEP_RESEARCH.md:
// data freshness, active decision cases, route-risk alerts, system health.
// Pulls from the single server-side /command-center/summary aggregation
// endpoint -- this component makes exactly one call, per the "frontend is
// not orchestrating unrelated calls" rule in IMPLEMENTATION_SPEC.md.

export function CommandHeader() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const load = () => getCommandCenterSummary().then(setSummary).catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        background: "#0b1220",
        borderBottom: "1px solid #1f2937",
        color: "#e5e7eb",
      }}
    >
      <div style={{ fontWeight: 700 }}>Freight-SIH Command Center</div>
      {summary ? (
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12 }}>
          <span>System: {summary.system_health}</span>
          <span>Pending review: {summary.pending_review_count}</span>
          <FreshnessBadge
            truthClass={summary.map_freshness?.layers?.hazards?.truth_class ?? "STATIC_REFERENCE"}
            lastSuccessAt={summary.map_freshness?.layers?.hazards?.last_success_at}
          />
        </div>
      ) : (
        <span style={{ fontSize: 12, opacity: 0.6 }}>Connecting...</span>
      )}
    </header>
  );
}

export function KpiCard({ label, value, unit, source }: { label: string; value: string | number; unit?: string; source?: string }) {
  // KPI contract per DEEP_RESEARCH.md: value/unit/source/observed_at/confidence
  // must all be drill-down-able. This stub renders the visible half; wire
  // the drill-down drawer to the same data the parent already fetched.
  return (
    <div style={{ border: "1px solid #1f2937", borderRadius: 8, padding: 12, minWidth: 140 }}>
      <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>
        {value} {unit && <span style={{ fontSize: 12, opacity: 0.6 }}>{unit}</span>}
      </div>
      {source && <div style={{ fontSize: 10, opacity: 0.5 }}>{source}</div>}
    </div>
  );
}
