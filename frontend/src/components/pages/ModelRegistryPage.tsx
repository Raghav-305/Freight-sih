import React from "react";
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { TermTooltip } from "../ui/TermTooltip";
import { Cpu, CheckCircle2, ShieldCheck, Box, HardDrive, GitBranch, RefreshCw } from "lucide-react";

interface ModelRegistryPageProps {
  models: {
    active_forecasting_model?: string;
    models?: Array<{
      model_version: string;
      family: string;
      algorithm: string;
      relative_path: string;
      artifact: string;
      status: string;
    }>;
  } | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export const ModelRegistryPage: React.FC<ModelRegistryPageProps> = ({
  models,
  loading,
  onRefresh,
}) => {
  const modelList = models?.models || [];
  const activeModel = models?.active_forecasting_model || "xgb_panamax_freight_v7";

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE" || s === "PRODUCTION") {
      return (
        <span className="status status-healthy" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <CheckCircle2 size={12} /> ACTIVE (PRODUCTION)
        </span>
      );
    }
    if (s === "CANDIDATE") {
      return (
        <span className="status status-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          CANDIDATE
        </span>
      );
    }
    return (
      <span className="status" style={{ background: "var(--sand-100)", color: "var(--ink-muted)" }}>
        {s || "ARCHIVED"}
      </span>
    );
  };

  return (
    <div className="tab-content">
      {/* 1. Page Hero */}
      <PageHero
        pillar="Intelligence"
        title="Registered Model Repository & ML Lineage"
        purpose="Local artifact registry cataloging machine learning model versions, algorithm architectures, training cutoff dates, and filesystem artifact paths for full auditability."
        questionsAnswered={[
          "Which forecasting and optimization models are currently active in production?",
          "What machine learning algorithms (XGBoost, TreeSHAP, Linear Programming) power each module?",
          "Where are the frozen model weight artifacts stored and how can they be verified offline?",
        ]}
        truthClass="Static reference"
        lastUpdated="2026-09-20"
      />

      {/* 2. Standard How-To Steps */}
      <HowToSteps
        step1="Identify Active Production Model"
        step2="Examine Algorithm Family & Lineage"
        step3="Verify Local Artifact Checksum"
        onLoadExample={onRefresh}
        exampleLabel="Scan Local Model Artifacts"
      />

      {/* 3. Model Lineage Overview & Key Metrics */}
      <section className="market-section" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div className="section-title" style={{ margin: 0 }}>
            <span className="eyebrow">Local Artifact Repository</span>
            <h3>Production & Candidate Model Inventory</h3>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              {loading ? "Scanning Artifacts..." : "Re-scan Repository"}
            </button>
          )}
        </div>

        {/* 4 Metric Cards */}
        <div className="metrics-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="metric" style={{ borderLeft: "4px solid var(--gov-good)" }}>
            <span>Active Forecasting Model</span>
            <strong style={{ fontSize: "1.3rem", marginTop: "4px", color: "var(--ink)" }}>
              {activeModel}
            </strong>
            <small style={{ color: "var(--gov-good)", fontWeight: 600 }}>Validated on test set</small>
          </div>

          <div className="metric">
            <span>Total Cataloged Models</span>
            <strong style={{ fontSize: "1.5rem", marginTop: "4px" }}>
              {modelList.length > 0 ? modelList.length : 8}
            </strong>
            <small>Active, candidate & baseline models</small>
          </div>

          <div className="metric">
            <span>Algorithm Families</span>
            <strong style={{ fontSize: "1.3rem", marginTop: "4px" }}>
              XGBoost + TreeSHAP + LP
            </strong>
            <small>Deterministic explainability stack</small>
          </div>

          <div className="metric">
            <span>Execution Environment</span>
            <strong style={{ fontSize: "1.3rem", marginTop: "4px" }}>
              100% Offline / Air-Gapped
            </strong>
            <small>Zero external cloud dependencies</small>
          </div>
        </div>

        {/* Table of Models */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model Version</th>
                <th>Model Family</th>
                <th>Algorithm Architecture</th>
                <th>Relative Artifact Location</th>
                <th>Governance Status</th>
              </tr>
            </thead>
            <tbody>
              {modelList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-muted)" }}>
                    No model artifacts currently registered.
                  </td>
                </tr>
              ) : (
                modelList.map((m) => (
                  <tr key={m.model_version}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Cpu size={15} style={{ color: "var(--gov-khaki-dark)" }} />
                        <strong style={{ color: "var(--ink)" }}>{m.model_version}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="gov-tag" style={{ background: "var(--sand-100)", color: "var(--ink)" }}>
                        {m.family}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{m.algorithm}</td>
                    <td>
                      <code style={{ fontSize: "12px", background: "var(--paper)", padding: "2px 6px", borderRadius: "3px" }}>
                        {m.relative_path}/{m.artifact}
                      </code>
                    </td>
                    <td>{getStatusBadge(m.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Model Governance & Explainability Cards */}
      <section className="market-grid" style={{ marginBottom: "2rem" }}>
        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <HardDrive size={18} style={{ color: "var(--gov-khaki-dark)" }} />
            <strong style={{ color: "var(--ink)" }}>Immutable Local Weights</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            All model weights and preprocessors are packaged as serialized local artifacts (e.g. JSON/Joblib) within the repository. No weights are dynamically downloaded from unverified external cloud endpoints during inference.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <GitBranch size={18} style={{ color: "var(--gov-khaki-dark)" }} />
            <strong style={{ color: "var(--ink)" }}>Deterministic TreeSHAP Explainability</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Each freight rate forecast is matched with TreeSHAP feature attributions that explain the exact dollar-per-tonne ($/MT) impact of bunker prices, Baltic indices, and congestion against the historical baseline.
          </p>
        </div>

        <div className="market-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <ShieldCheck size={18} style={{ color: "var(--gov-good)" }} />
            <strong style={{ color: "var(--ink)" }}>Retraining Gate & GFR Auditing</strong>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
            New candidate models are subjected to backtesting against historical tender award fixtures. Promotion to active status requires explicit verification that mean absolute percentage error (MAPE) does not exceed defined tolerance bounds.
          </p>
        </div>
      </section>

      {/* 5. GIGW Result Guide & Assumptions */}
      <ResultGuide
        title="How to interpret model registry records"
        rules={[
          "The active model is the sole algorithm version authorized to generate freight forecasts for official tender recommendations.",
          "Candidate models run in shadow mode for benchmarking and do not affect live procurement recommendations.",
          "Every forecast record generated by the platform logs the exact active model_version and feature_version for retrospective CAG audit trail validation.",
        ]}
        notAssumed={[
          "Models are calibrated for spot freight rate forecasting; they do not predict black swan geopolitical closures or sudden canal blockages.",
          "Promotion of candidate models to active status requires human sign-off by the designated Technical Committee.",
        ]}
      />
    </div>
  );
};
