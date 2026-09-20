import React from "react";
import { HelpCircle, RefreshCw, AlertCircle, Info } from "lucide-react";

interface KpiCardProps {
  label: string;
  value?: string | number | null;
  unit?: string;
  helperText?: string;
  tooltipText?: string;
  status?: "good" | "caution" | "risk" | "neutral";
  referenceTag?: string;
  isLoading?: boolean;
  isUnavailable?: boolean;
  isMock?: boolean;
  onRetry?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  helperText,
  tooltipText,
  status = "neutral",
  referenceTag,
  isLoading = false,
  isUnavailable = false,
  isMock = false,
  onRetry,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Status styling
  let statusColor = "var(--ink)";
  let statusBg = "transparent";

  if (status === "good") {
    statusColor = "var(--olive)";
  } else if (status === "caution") {
    statusColor = "var(--amber)";
  } else if (status === "risk") {
    statusColor = "var(--brick)";
  }

  return (
    <div
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--khaki-300)",
        borderRadius: "var(--radius)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "125px",
        boxShadow: "var(--shadow-subtle)",
        position: "relative",
      }}
    >
      {/* Top Row: Label & Tags/Tooltips */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--khaki-700)",
            }}
          >
            {label}
          </span>
          {tooltipText && (
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <HelpCircle size={12} style={{ color: "var(--khaki-500)", cursor: "help" }} />
              {showTooltip && (
                <div
                  role="tooltip"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: "0",
                    width: "220px",
                    backgroundColor: "var(--ink)",
                    color: "var(--sand-100)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius)",
                    fontSize: "11px",
                    lineHeight: 1.35,
                    boxShadow: "var(--shadow-modal)",
                    zIndex: 50,
                    pointerEvents: "none",
                  }}
                >
                  {tooltipText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reference / Mock Tag */}
        {referenceTag && (
          <span
            style={{
              fontSize: "9.5px",
              fontWeight: 600,
              padding: "2px 6px",
              backgroundColor: "var(--paper)",
              border: "1px solid var(--khaki-300)",
              borderRadius: "var(--radius-sm)",
              color: "var(--charcoal)",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {referenceTag}
          </span>
        )}
      </div>

      {/* Center Value or State */}
      <div style={{ margin: "4px 0" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--khaki-700)", fontSize: "12px" }}>
            <RefreshCw size={14} className="animate-spin" />
            <span>Fetching latest figures…</span>
          </div>
        ) : isUnavailable ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--brick)", fontSize: "11.5px" }}>
              <AlertCircle size={13} />
              <span>Figure unavailable</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  fontSize: "10.5px",
                  padding: "2px 6px",
                  backgroundColor: "var(--paper)",
                  border: "1px solid var(--khaki-500)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--ink)",
                  width: "fit-content",
                }}
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span
              style={{
                fontSize: "1.625rem",
                fontWeight: 700,
                color: statusColor,
                fontFamily: "var(--font-serif)",
                lineHeight: 1.1,
              }}
            >
              {value ?? "—"}
            </span>
            {unit && (
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--charcoal)", opacity: 0.8 }}>
                {unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Helper Text / Mode Notice */}
      <div style={{ fontSize: "11px", color: "var(--charcoal)", lineHeight: 1.35 }}>
        {isMock ? (
          <span style={{ color: "var(--amber)", fontWeight: 500 }}>
            Sample data. Not live market information.
          </span>
        ) : (
          helperText
        )}
      </div>
    </div>
  );
};
