import React, { useEffect, useState } from "react";
import { getDecisionAudit, reportUrl } from "../api";

// Shows the hash-chained event history plus the chain's own self-verification
// result -- makes the "tamper-evident, not magical legal certification"
// distinction visible to a jury instead of just claimed in a script.

export function AuditTimeline({ decisionId }: { decisionId: string }) {
  const [audit, setAudit] = useState<any>(null);

  useEffect(() => {
    getDecisionAudit(decisionId).then(setAudit).catch(() => setAudit(null));
  }, [decisionId]);

  if (!audit) return <div style={{ fontSize: 12, opacity: 0.6 }}>Loading audit trail...</div>;

  return (
    <div>
      <div
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 6,
          fontSize: 12,
          marginBottom: 8,
          background: audit.verification.valid ? "#064e3b" : "#7f1d1d",
          color: audit.verification.valid ? "#34d399" : "#fca5a5",
        }}
      >
        {audit.verification.valid
          ? `Chain verified -- ${audit.verification.event_count} events, tamper-evident`
          : `Chain integrity FAILED at event ${audit.verification.broken_at_event_id}`}
      </div>

      <ol style={{ listStyle: "none", padding: 0, margin: 0, borderLeft: "2px solid #1f2937" }}>
        {audit.chain.map((ev: any) => (
          <li key={ev.event_id} style={{ padding: "6px 0 6px 12px", fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>{ev.event_type}</div>
            <div style={{ opacity: 0.7 }}>
              {ev.actor} ({ev.role}) -- {new Date(ev.created_at).toLocaleString()}
              {ev.reason ? ` -- "${ev.reason}"` : ""}
            </div>
          </li>
        ))}
      </ol>

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <a href={reportUrl(decisionId, "pdf")}>Download tender brief (PDF)</a>
        <a href={reportUrl(decisionId, "xlsx")}>Download (XLSX)</a>
      </div>
    </div>
  );
}
