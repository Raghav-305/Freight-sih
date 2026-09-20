import React, { useEffect, useState } from "react";
import { getCommandCenterSummary } from "../api";
import { FreshnessBadge } from "./FreshnessBadge";
import { ShieldCheck, Activity } from "lucide-react";

export function CommandHeader() {
  const [summary, setSummary] = useState<any>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = () =>
      getCommandCenterSummary()
        .then((data) => {
          if (isMounted) {
            setSummary(data);
            setIsError(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsError(true);
        });

    load();
    const id = setInterval(load, 30_000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px",
        background: "var(--charcoal)",
        border: "1px solid var(--khaki-700)",
        borderRadius: "var(--radius)",
        color: "var(--sand-100)",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "var(--white)" }}>
        <ShieldCheck size={16} style={{ color: "var(--khaki-300)" }} />
        <span>Freight-SIH Command Center Status</span>
      </div>

      {summary ? (
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={13} style={{ color: "var(--olive-border)" }} />
            System: <strong style={{ color: "var(--white)" }}>{summary.system_health ?? "Operational"}</strong>
          </span>
          <span>
            Pending review: <strong style={{ color: "var(--white)" }}>{summary.pending_review_count ?? 0}</strong>
          </span>
          <FreshnessBadge
            truthClass={summary.map_freshness?.layers?.hazards?.truth_class ?? "STATIC_REFERENCE"}
            lastSuccessAt={summary.map_freshness?.layers?.hazards?.last_success_at}
          />
        </div>
      ) : isError ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", color: "var(--khaki-300)" }}>
          <span style={{ fontSize: "11px" }}>Local air-gapped node active · Offline cache enabled</span>
        </div>
      ) : (
        <span style={{ fontSize: "11px", opacity: 0.8, color: "var(--sand-100)" }}>
          Initializing command telemetry…
        </span>
      )}
    </header>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  source,
}: {
  label: string;
  value: string | number;
  unit?: string;
  source?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--khaki-300)",
        borderRadius: "var(--radius)",
        padding: 12,
        minWidth: 140,
        backgroundColor: "var(--white)",
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", color: "var(--khaki-700)", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", margin: "2px 0" }}>
        {value} {unit && <span style={{ fontSize: 12, opacity: 0.7 }}>{unit}</span>}
      </div>
      {source && <div style={{ fontSize: 10, opacity: 0.6, color: "var(--charcoal)" }}>{source}</div>}
    </div>
  );
}
