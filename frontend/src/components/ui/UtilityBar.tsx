import React, { useState, useEffect } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { Printer, Search, Eye, Type } from "lucide-react";

interface UtilityBarProps {
  onOpenCommandPalette?: () => void;
}

export const UtilityBar: React.FC<UtilityBarProps> = ({ onOpenCommandPalette }) => {
  const { language, setLanguage, t } = useTranslation();
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    document.body.classList.remove("font-scale-sm", "font-scale-md", "font-scale-lg");
    document.body.classList.add(`font-scale-${fontSize}`);
  }, [fontSize]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="portal-utility-bar"
      style={{
        backgroundColor: "var(--ink)",
        color: "var(--sand-100)",
        fontSize: "12px",
        padding: "6px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--charcoal)",
      }}
    >
      {/* Skip to Main Content */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <a
          href="#main-content"
          style={{
            color: "var(--white)",
            textDecoration: "none",
            padding: "2px 8px",
            backgroundColor: "var(--charcoal)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--khaki-700)",
          }}
        >
          {t("chrome.skipToMain")}
        </a>

        {/* Command Palette trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          style={{
            background: "transparent",
            border: "1px solid var(--charcoal)",
            color: "var(--sand-100)",
            padding: "2px 8px",
            fontSize: "11px",
            borderRadius: "var(--radius-sm)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Open module navigator (Ctrl + K)"
        >
          <Search size={12} />
          <span>{t("chrome.shortcutHint")}</span>
        </button>
      </div>

      {/* Accessibility & Language Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        {/* Text Size (A- A A+) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Type size={13} style={{ opacity: 0.7 }} />
          <span style={{ marginRight: "4px", opacity: 0.8 }}>{t("chrome.textSize")}:</span>
          <button
            type="button"
            onClick={() => setFontSize("sm")}
            style={{
              padding: "1px 6px",
              fontSize: "11px",
              background: fontSize === "sm" ? "var(--khaki-700)" : "transparent",
              color: "var(--white)",
              border: "1px solid var(--charcoal)",
              borderRadius: "var(--radius-sm)",
            }}
            aria-label="Decrease text size"
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => setFontSize("md")}
            style={{
              padding: "1px 6px",
              fontSize: "12px",
              background: fontSize === "md" ? "var(--khaki-700)" : "transparent",
              color: "var(--white)",
              border: "1px solid var(--charcoal)",
              borderRadius: "var(--radius-sm)",
            }}
            aria-label="Normal text size"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setFontSize("lg")}
            style={{
              padding: "1px 6px",
              fontSize: "13px",
              background: fontSize === "lg" ? "var(--khaki-700)" : "transparent",
              color: "var(--white)",
              border: "1px solid var(--charcoal)",
              borderRadius: "var(--radius-sm)",
            }}
            aria-label="Increase text size"
          >
            A+
          </button>
        </div>

        {/* High Contrast Toggle */}
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          style={{
            background: highContrast ? "var(--khaki-700)" : "transparent",
            color: "var(--white)",
            border: "1px solid var(--charcoal)",
            padding: "2px 8px",
            fontSize: "11px",
            borderRadius: "var(--radius-sm)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
          aria-pressed={highContrast}
        >
          <Eye size={12} />
          <span>{t("chrome.highContrast")}</span>
        </button>

        {/* Language Switcher */}
        <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--charcoal)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              background: language === "en" ? "var(--khaki-700)" : "transparent",
              color: "var(--white)",
              border: "none",
              borderRadius: 0,
            }}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              background: language === "hi" ? "var(--khaki-700)" : "transparent",
              color: "var(--white)",
              border: "none",
              borderRadius: 0,
            }}
          >
            हिन्दी
          </button>
        </div>

        {/* Print Button */}
        <button
          type="button"
          onClick={handlePrint}
          style={{
            background: "transparent",
            color: "var(--sand-100)",
            border: "1px solid var(--charcoal)",
            padding: "2px 8px",
            fontSize: "11px",
            borderRadius: "var(--radius-sm)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Print official report"
        >
          <Printer size={12} />
          <span>{t("chrome.printAnalysis")}</span>
        </button>
      </div>
    </div>
  );
};
