import React from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { ShieldCheck, Database, RefreshCw, FileText } from "lucide-react";

interface GovFooterProps {
  modelVersion?: string;
  datasetVersion?: string;
  lastUpdated?: string;
}

export const GovFooter: React.FC<GovFooterProps> = ({
  modelVersion = "xgb_panamax_freight_v7",
  datasetVersion = "dwt_fixtures_2026_q3",
  lastUpdated = "2026-09-20",
}) => {
  const { t } = useTranslation();

  return (
    <footer
      style={{
        marginTop: "48px",
        padding: "24px 32px",
        backgroundColor: "var(--white)",
        borderTop: "1px solid var(--khaki-300)",
        fontSize: "12px",
        color: "var(--charcoal)",
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "20px" }}>
        {/* Advisory Disclaimer */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
            <FileText size={14} style={{ color: "var(--khaki-700)" }} />
            <span>Advisory Notice & Disclaimer</span>
          </div>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--charcoal)" }}>
            {t("chrome.footerDisclaimer")}
          </p>
        </div>

        {/* Governance & Accessibility */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
            <ShieldCheck size={14} style={{ color: "var(--khaki-700)" }} />
            <span>GIGW & Sovereign Compliance</span>
          </div>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--charcoal)" }}>
            {t("chrome.footerAccessibility")}
          </p>
        </div>

        {/* Data Lineage & Freshness */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
            <Database size={14} style={{ color: "var(--khaki-700)" }} />
            <span>Model & Data Lineage</span>
          </div>
          <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <div>Active Model: <code style={{ backgroundColor: "var(--paper)", padding: "1px 4px", borderRadius: "2px" }}>{modelVersion}</code></div>
            <div>Dataset: <code style={{ backgroundColor: "var(--paper)", padding: "1px 4px", borderRadius: "2px" }}>{datasetVersion}</code></div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <RefreshCw size={10} /> {t("chrome.footerLastUpdated")}: <strong>{lastUpdated}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Ministry attribution */}
      <div
        style={{
          borderTop: "1px solid var(--sand-100)",
          paddingTop: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "11px",
          color: "var(--khaki-700)",
        }}
      >
        <div>
          © 2026 Ministry of Ports, Shipping & Waterways / Ministry of Coal · Government of India
        </div>
        <div>
          {t("chrome.footerDeployment")}
        </div>
      </div>
    </footer>
  );
};
