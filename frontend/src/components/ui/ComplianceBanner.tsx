import React from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { Scale } from "lucide-react";

export const ComplianceBanner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div
      role="note"
      aria-label="CVC and GFR 2017 Compliance Rule"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "10px 16px",
        marginBottom: "20px",
        backgroundColor: "var(--amber-bg)",
        border: "1px solid var(--amber-border)",
        borderLeft: "4px solid var(--amber)",
        borderRadius: "var(--radius)",
        color: "var(--ink)",
        fontSize: "12px",
        lineHeight: 1.45,
      }}
    >
      <div style={{ color: "var(--amber)", marginTop: "1px", flexShrink: 0 }}>
        <Scale size={18} />
      </div>
      <div>
        <strong style={{ color: "var(--ink)", marginRight: "6px" }}>
          {t("chrome.cvcBannerTitle")}
        </strong>
        <span style={{ color: "var(--charcoal)" }}>
          {t("chrome.cvcBannerText")}
        </span>
      </div>
    </div>
  );
};
