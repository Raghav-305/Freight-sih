import React, { useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { RefreshCw, Server, Cpu, Clock, Shield, Info } from "lucide-react";

interface GovHeaderProps {
  apiMode?: string;
  serverHealth?: string;
  activeModel?: string;
  lastUpdated?: string;
  onRetryConnection?: () => void;
  isConnecting?: boolean;
}

export const GovHeader: React.FC<GovHeaderProps> = ({
  apiMode = "mock",
  serverHealth = "healthy",
  activeModel = "xgb_panamax_freight_v7",
  lastUpdated = "2026-09-20 18:00 UTC",
  onRetryConnection,
  isConnecting = false,
}) => {
  const { t } = useTranslation();
  const [showPopover, setShowPopover] = useState(false);

  // Status mapping
  const isLive = apiMode === "live" && serverHealth === "healthy";
  const isMock = apiMode === "mock";
  const isOffline = serverHealth === "offline" || serverHealth === "error";

  let statusColor = "var(--olive)";
  let statusBg = "var(--olive-bg)";
  let statusBorder = "var(--olive-border)";
  let statusText = `${t("chrome.statusLive")} · ${t("chrome.checkedAt")} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  if (isMock) {
    statusColor = "var(--amber)";
    statusBg = "var(--amber-bg)";
    statusBorder = "var(--amber-border)";
    statusText = t("chrome.statusMock");
  } else if (isOffline) {
    statusColor = "var(--brick)";
    statusBg = "var(--brick-bg)";
    statusBorder = "var(--brick-border)";
    statusText = t("chrome.statusOffline");
  }

  return (
    <header
      style={{
        backgroundColor: "var(--white)",
        borderBottom: "2px solid var(--khaki-300)",
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
      }}
    >
      {/* Ministry & Emblem Brand Block */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Reserved Slot for State Emblem */}
        <div
          aria-label={t("chrome.emblemAlt")}
          title={t("chrome.emblemAlt")}
          style={{
            width: "56px",
            height: "64px",
            border: "1px dashed var(--khaki-500)",
            borderRadius: "var(--radius)",
            backgroundColor: "var(--paper)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: "16px", lineHeight: 1 }}>🏛️</div>
          <span style={{ fontSize: "8px", fontWeight: 700, color: "var(--khaki-700)", marginTop: "3px", textTransform: "uppercase" }}>
            सत्यमेव जयते
          </span>
          <span style={{ fontSize: "7px", color: "var(--charcoal)", opacity: 0.7 }}>
            EMBLEM SLOT
          </span>
        </div>

        {/* Platform Title & Ministry Details */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--khaki-700)",
              marginBottom: "2px",
            }}
          >
            भारत सरकार · Government of India
          </div>
          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
              fontFamily: "var(--font-serif)",
            }}
          >
            {t("chrome.platformTitle")}
          </h1>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--charcoal)",
              margin: "2px 0 0 0",
              fontWeight: 500,
            }}
          >
            {t("chrome.platformSubtitle")}
          </p>
        </div>
      </div>

      {/* Header Status & Deployment Pill with Popover */}
      <div style={{ position: "relative" }}>
        <div
          onClick={() => setShowPopover(!showPopover)}
          onMouseEnter={() => setShowPopover(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            backgroundColor: statusBg,
            border: `1px solid ${statusBorder}`,
            borderRadius: "var(--radius)",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--ink)",
            boxShadow: "var(--shadow-subtle)",
          }}
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={showPopover}
        >
          {/* Status Dot */}
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: statusColor,
              display: "inline-block",
            }}
          />
          <span>{statusText}</span>
          {isOffline && onRetryConnection && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetryConnection();
              }}
              style={{
                marginLeft: "4px",
                padding: "2px 6px",
                fontSize: "10px",
                background: "var(--brick)",
                color: "var(--white)",
                border: "none",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <RefreshCw size={10} className={isConnecting ? "animate-spin" : ""} />
              {t("chrome.retry")}
            </button>
          )}
          <Info size={13} style={{ color: "var(--khaki-700)", marginLeft: "4px" }} />
        </div>

        {/* Status & Diagnostic Popover */}
        {showPopover && (
          <div
            onMouseLeave={() => setShowPopover(false)}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              width: "300px",
              backgroundColor: "var(--white)",
              border: "1px solid var(--khaki-500)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-modal)",
              padding: "16px",
              zIndex: 100,
              fontSize: "12px",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "13px", borderBottom: "1px solid var(--sand-100)", paddingBottom: "8px", marginBottom: "10px", color: "var(--ink)" }}>
              System Health & Architecture
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--charcoal)" }}>
                  <Server size={13} /> {t("chrome.serverHealth")}:
                </span>
                <strong style={{ color: statusColor, textTransform: "capitalize" }}>{serverHealth}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--charcoal)" }}>
                  <Cpu size={13} /> {t("chrome.activeModel")}:
                </span>
                <strong style={{ fontFamily: "monospace", fontSize: "11px" }}>{activeModel}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--charcoal)" }}>
                  <Clock size={13} /> {t("chrome.dataFreshness")}:
                </span>
                <span style={{ fontSize: "11px", color: "var(--charcoal)" }}>{lastUpdated}</span>
              </div>

              <div style={{ borderTop: "1px solid var(--sand-100)", paddingTop: "8px", marginTop: "2px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--khaki-700)", fontWeight: 600 }}>
                  <Shield size={13} /> Deployment: Local, air-gapped
                </span>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--charcoal)" }}>
                  Self-hosted artifacts, zero external network dependency. Fully complies with sovereign data guidelines.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
