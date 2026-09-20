import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { AuditTimeline } from "../AuditTimeline";
import { AnchorStatus } from "../AnchorStatus";
import { TermTooltip } from "../ui/TermTooltip";
import { Shield, FileCheck, CheckCircle2, AlertTriangle, Lock, Award, History, FileText } from "lucide-react";

interface CvcGovernancePageProps {
  reviewForm: {
    reviewer_name: string;
    decision: string;
    tender_reference: string;
    comment: string;
  };
  setReviewForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmitReview: (e: React.FormEvent) => void;
  reviewMessage: string | null;
  auditData: any;
  auditLoading?: boolean;
}

export const CvcGovernancePage: React.FC<CvcGovernancePageProps> = ({
  reviewForm,
  setReviewForm,
  onSubmitReview,
  reviewMessage,
  auditData,
  auditLoading,
}) => {
  const handleLoadExample = () => {
    setReviewForm({
      reviewer_name: "Dr. R. K. Sharma (Director - Shipping & Chartering)",
      decision: "APPROVED",
      tender_reference: "MOC/CIL/BULK/2026/T-0894",
      comment: "Approved pursuant to GFR 2017 Rule 144. Rate is within P50 forecast band with lower modelled port delay exposure.",
    });
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "APPROVED" || s === "COMPLETED") {
      return (
        <span className="status status-healthy" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <CheckCircle2 size={12} /> {s}
        </span>
      );
    }
    if (s === "REJECTED" || s === "RETURNED") {
      return (
        <span className="status status-error" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <AlertTriangle size={12} /> {s}
        </span>
      );
    }
    return (
      <span className="status status-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {s}
      </span>
    );
  };

  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Governance"
        title="CVC Governance & Tender Review (Pillar 3)"
        purpose="Central Vigilance Commission (CVC) & General Financial Rules (GFR) 2017 compliant tender sign-off workflow with cryptographic SHA-256 tamper-evident audit trails and four-eyes review controls."
        questionsAnswered={[
          "Who authorized this charter fixture and under what official tender reference number?",
          "Has the recommendation undergone mandatory dual-officer sign-off under DoFP delegation?",
          "Is the audit trail cryptographically sealed against post-hoc tampering?",
        ]}
        truthClass="Static reference"
        lastUpdated="2026-09-20"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Inspect Algorithmic Fixture Recommendation"
        step2="Submit Human Officer Decision & Vigilance Remarks"
        step3="Verify Cryptographic Hash & Export Tender Brief"
        onLoadExample={handleLoadExample}
        exampleLabel="Load Example Approval Brief"
      />

      {/* 3. Formal CVC Human Review Sign-Off Form */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">GFR 2017 Rule 144 · Human Decision Sign-Off</span>
          <h3>Tender Review & Vigilance Officer Action</h3>
          <small style={{ color: "var(--ink-muted)", marginTop: "4px" }}>
            All approvals are permanently recorded in the immutable audit log with officer credential and timestamp.
          </small>
        </div>

        <form className="forecast-form" onSubmit={onSubmitReview}>
          <div className="form-grid">
            <label>
              <span>Reviewing Officer Name / Designation</span>
              <input
                type="text"
                value={reviewForm.reviewer_name}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })}
                placeholder="e.g. Shri V. K. Menon, Executive Director (Logistics)"
                required
              />
            </label>

            <label>
              <span>Procurement Action</span>
              <select
                value={reviewForm.decision}
                onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
              >
                <option value="APPROVED">APPROVED (Formal Concurrence)</option>
                <option value="MODIFIED">MODIFIED (Subject to Revised Laycan/Rate)</option>
                <option value="REJECTED">REJECTED (Return for Re-tendering)</option>
              </select>
            </label>

            <label>
              <span>Official Tender Reference</span>
              <input
                type="text"
                value={reviewForm.tender_reference}
                onChange={(e) => setReviewForm({ ...reviewForm, tender_reference: e.target.value })}
                placeholder="e.g. MOC/CIL/BULK/2026/T-0894"
                required
              />
            </label>

            <label>
              <span>Vigilance Comments / Technical Justification</span>
              <input
                type="text"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="State basis of concurrence, GFR conformity, and rate reasonableness"
                required
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "1.25rem" }}>
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} /> Log Official Tender Decision
            </button>
            {reviewMessage && (
              <span style={{ fontWeight: 600, color: "var(--gov-good)", fontSize: "13px" }}>
                ✓ {reviewMessage}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* 4. Audit Data and Recent Recommendations */}
      {auditData && (
        <section className="market-section" style={{ marginBottom: "2rem" }}>
          <div className="section-title">
            <span className="eyebrow">Tender Log</span>
            <h3>Recent Procurement Recommendations</h3>
          </div>

          <div className="table-wrap" style={{ marginBottom: "2rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Recommendation ID</th>
                  <th>Contract Type</th>
                  <th>Charter Strategy & Corridor</th>
                  <th>Workflow Status</th>
                  <th>Assigned Officer</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {(auditData.recent_recommendations || []).map((r: any) => (
                  <tr key={r.id}>
                    <td><strong>REC-{r.id}</strong></td>
                    <td>
                      <span className="gov-tag" style={{ background: "var(--sand-100)", color: "var(--ink)" }}>
                        {r.type ?? "SPOT"}
                      </span>
                    </td>
                    <td>{r.summary}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td style={{ fontWeight: 600 }}>{r.reviewer ?? "Pending Assignment"}</td>
                    <td style={{ fontSize: "12px", color: "var(--ink-muted)" }}>{r.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section-title">
            <span className="eyebrow">GFR 2017 Audit Log</span>
            <h3>Immutable System Audit Trail</h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Audit Log ID</th>
                  <th>Timestamp (UTC)</th>
                  <th>Action Performed</th>
                  <th>Officer / Terminal Desk</th>
                  <th>Entity Reference</th>
                </tr>
              </thead>
              <tbody>
                {(auditData.audit_trail || []).map((l: any) => (
                  <tr key={l.id}>
                    <td><code>AUD-{l.id}</code></td>
                    <td style={{ fontSize: "12px", color: "var(--ink-muted)" }}>{l.timestamp}</td>
                    <td><strong>{l.action}</strong></td>
                    <td style={{ fontWeight: 600 }}>{l.user_id}</td>
                    <td><code>{l.entity_id}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. Pillar 3: SHA-256 Decision Timeline & Sovereign Brief Export */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div className="section-title">
          <span className="eyebrow">Pillar 3 · Cryptographic Verifiability</span>
          <h3>SHA-256 Tamper-Evident Decision Timeline & Official Brief Export</h3>
          <small style={{ color: "var(--ink-muted)", marginTop: "4px" }}>
            Formal state machine (DRAFT → ANALYSED → SUBMITTED_FOR_REVIEW → APPROVED/RETURNED/REJECTED) with cryptographic hash integrity and reproducible briefing pack generation.
          </small>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <AuditTimeline />
        </div>

        {/* Optional Blockchain Testnet Anchor Widget */}
        <div style={{ marginTop: "1.5rem" }}>
          <AnchorStatus />
        </div>
      </section>

      {/* 6. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret CVC vigilance governance logs"
        rules={[
          "All tender approvals are sealed with a SHA-256 cryptographic hash calculated over input parameters, rate forecasts, and timestamp.",
          "Four-eyes review rule strictly prevents the proposing desk officer from signing off on their own procurement submission.",
          "Decisions logged in this module constitute the official record required for subsequent statutory CAG audit review.",
        ]}
        notAssumed={[
          "AI recommendations do NOT constitute procurement authority; statutory financial sign-off rests solely with the designated Competent Financial Authority under DoFP.",
          "Logging a decision does not substitute for executing the formal standard charter party agreement (e.g. AMWELSH 93 / NYPE 93).",
        ]}
      />
    </div>
  );
};
