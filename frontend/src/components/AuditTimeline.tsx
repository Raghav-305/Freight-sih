import React, { useEffect, useState } from "react";
import { createDecision, decisionAction, getDecision, getDecisionAudit, reportUrl } from "../api";

export function AuditTimeline({ decisionId: initialId }: { decisionId?: string }) {
  const [activeId, setActiveId] = useState<string | null>(initialId && initialId !== "current" ? initialId : null);
  const [decision, setDecision] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");

  const refresh = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const [dec, aud] = await Promise.all([getDecision(id), getDecisionAudit(id)]);
      setDecision(dec);
      setAudit(aud);
      setActiveId(id);
    } catch (e: any) {
      setError(e.message || "Failed to load decision audit");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const created = await createDecision({
        cargo_description: "Coking Coal 75,000 MT (Gladstone to Paradip)",
        scenario_snapshot: {
          result: { landed_cost_per_tonne: 124.5, cost_per_gj: 4.88 },
          assumptions: { vessel_class: "Panamax", target_port: "PARADIP" },
        },
        eligibility_snapshot: {
          status: "ELIGIBLE_WITH_CONDITION",
          condition: "HIGH_TIDE draft window required at Paradip Berth-05",
        },
        forecast_quantiles: { p10: 18.2, p50: 20.4, p90: 23.8, unit: "USD/MT" },
        explanation_reference: "SHAP drivers: bunker_vlsfo (+1.42), port_congestion (+0.85)",
        source_versions: {
          market_model: "xgb_panamax_v7",
          port_notice: "PPA-2026-02-23",
          provenance: "OFFICIAL_PERIODIC",
        },
        created_by: "procurement_officer_01",
        created_by_role: "Procurement Lead",
      });
      await refresh((created as any).decision_id);
    } catch (e: any) {
      setError(e.message || "Failed to create decision case");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "analyse" | "submit" | "approve" | "return" | "reject", actor: string, role: string) => {
    if (!activeId) return;
    setError(null);
    try {
      await decisionAction(activeId, action, {
        actor,
        role,
        reason: reason || (action === "return" || action === "reject" ? "Vigilance audit review required" : undefined),
      });
      setReason("");
      await refresh(activeId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (initialId && initialId !== "current") {
      void refresh(initialId);
    }
  }, [initialId]);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Case Header & Creator */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          {activeId ? (
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Decision Case</span>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", fontFamily: "monospace" }}>{activeId}</div>
              {decision && (
                <div style={{ fontSize: "12px", marginTop: "4px", color: "#94a3b8" }}>
                  Status: <strong style={{ color: "#38bdf8" }}>{decision.status}</strong> · Version: <strong>v{decision.analysis_version}</strong> · Creator: <strong>{decision.created_by}</strong>
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>No active decision loaded. Initialize a new governance case:</span>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={handleCreate} disabled={loading} style={{ background: "#2563eb", color: "#fff", fontSize: "12px", padding: "8px 14px" }}>
            {loading ? "Initializing..." : "+ Create New Decision Case"}
          </button>
          {activeId && (
            <button type="button" onClick={() => refresh(activeId)} disabled={loading} style={{ background: "#334155", color: "#fff", fontSize: "12px", padding: "8px 14px" }}>
              Refresh Chain
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "#7f1d1d", color: "#fca5a5", borderRadius: "6px", fontSize: "12px", border: "1px solid #b91c1c" }}>
          <strong>Governance Rule Alert:</strong> {error}
        </div>
      )}

      {/* State Machine Transition Actions */}
      {decision && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", padding: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "10px" }}>
            State Machine Transitions (Current: {decision.status})
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            {decision.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => handleAction("analyse", "procurement_officer_01", "Analyst")}
                style={{ background: "#0284c7", color: "#fff", fontSize: "12px", padding: "6px 12px" }}
              >
                1. Mark Analysed
              </button>
            )}

            {decision.status === "ANALYSED" && (
              <button
                type="button"
                onClick={() => handleAction("submit", "procurement_officer_01", "Procurement Lead")}
                style={{ background: "#059669", color: "#fff", fontSize: "12px", padding: "6px 12px" }}
              >
                2. Submit For Review (Freeze Snapshot)
              </button>
            )}

            {decision.status === "SUBMITTED_FOR_REVIEW" && (
              <>
                <button
                  type="button"
                  onClick={() => handleAction("approve", "vigilance_director_09", "Approving Authority")}
                  style={{ background: "#16a34a", color: "#fff", fontSize: "12px", padding: "6px 12px" }}
                >
                  ✓ Approve (Authorized Director)
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("approve", decision.created_by, "Approving Authority")}
                  title="Tests CVC vigilance blocking: approver cannot be the same as creator"
                  style={{ background: "#b45309", color: "#fff", fontSize: "12px", padding: "6px 12px" }}
                >
                  ⚠️ Test Self-Approval (Must Block 409)
                </button>
                <input
                  type="text"
                  placeholder="Reason for return/rejection..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ fontSize: "12px", padding: "6px 10px", width: "220px", background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: "4px" }}
                />
                <button
                  type="button"
                  onClick={() => handleAction("return", "vigilance_director_09", "Reviewer")}
                  style={{ background: "#d97706", color: "#fff", fontSize: "12px", padding: "6px 12px" }}
                >
                  Return for Recalculation
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("reject", "vigilance_director_09", "Reviewer")}
                  style={{ background: "#dc2626", color: "#fff", fontSize: "12px", padding: "6px 12px" }}
                >
                  Reject Tender
                </button>
              </>
            )}

            {decision.status === "RETURNED" && (
              <button
                type="button"
                onClick={() => handleAction("analyse", "procurement_officer_01", "Analyst")}
                style={{ background: "#0284c7", color: "#fff", fontSize: "12px", padding: "6px 12px" }}
              >
                Re-analyse (Increments to v{decision.analysis_version + 1})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cryptographic Hash Chain Verification */}
      {audit && (
        <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: "8px", padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 600,
                background: audit.verification?.valid ? "#064e3b" : "#7f1d1d",
                color: audit.verification?.valid ? "#34d399" : "#fca5a5",
              }}
            >
              <span>{audit.verification?.valid ? "🔒" : "⚠️"}</span>
              {audit.verification?.valid
                ? `SHA-256 Hash Chain Verified (${audit.verification.event_count} events · Tamper-Evident)`
                : `Chain Integrity Broken at event ID ${audit.verification.broken_at_event_id}`}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <a
                href={reportUrl(activeId!, "pdf")}
                target="_blank"
                rel="noreferrer"
                style={{ background: "#1e293b", border: "1px solid #334155", color: "#38bdf8", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", textDecoration: "none", fontWeight: 600 }}
              >
                📄 Download Brief (PDF)
              </a>
              <a
                href={reportUrl(activeId!, "xlsx")}
                target="_blank"
                rel="noreferrer"
                style={{ background: "#1e293b", border: "1px solid #334155", color: "#4ade80", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", textDecoration: "none", fontWeight: 600 }}
              >
                📊 Download (Excel XLSX)
              </a>
            </div>
          </div>

          <ol style={{ listStyle: "none", padding: 0, margin: 0, borderLeft: "2px solid #334155" }}>
            {audit.chain.map((ev: any) => (
              <li key={ev.event_id} style={{ padding: "8px 0 8px 14px", position: "relative" }}>
                <div style={{ position: "absolute", left: "-6px", top: "12px", width: "10px", height: "10px", borderRadius: "50%", background: "#38bdf8" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "13px", color: "#f1f5f9" }}>{ev.event_type}</strong>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{new Date(ev.created_at).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                  Actor: <span style={{ color: "#e2e8f0" }}>{ev.actor}</span> ({ev.role})
                  {ev.reason ? ` · "${ev.reason}"` : ""}
                </div>
                <div style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace", marginTop: "4px", wordBreak: "break-all" }}>
                  hash: {ev.current_hash}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
