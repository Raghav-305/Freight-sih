import React from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { ChevronRight } from "lucide-react";

interface BreadcrumbsProps {
  pillar: string;
  pageTitle: string;
  onNavigateHome?: () => void;
}

export const GovBreadcrumbs: React.FC<BreadcrumbsProps> = ({ pillar, pageTitle, onNavigateHome }) => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        color: "var(--khaki-700)",
        marginBottom: "16px",
      }}
    >
      <button
        type="button"
        onClick={onNavigateHome}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: "var(--khaki-700)",
          textDecoration: "underline",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        {t("chrome.breadcrumbsHome")}
      </button>
      <ChevronRight size={12} style={{ color: "var(--khaki-500)" }} />
      <span style={{ color: "var(--charcoal)", fontWeight: 500 }}>{pillar}</span>
      <ChevronRight size={12} style={{ color: "var(--khaki-500)" }} />
      <span style={{ color: "var(--ink)", fontWeight: 700 }} aria-current="page">
        {pageTitle}
      </span>
    </nav>
  );
};
