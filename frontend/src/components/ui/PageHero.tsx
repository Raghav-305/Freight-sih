import React from "react";
import { HelpCircle, CheckCircle } from "lucide-react";

export type PillarType = "Command Center" | "Economics" | "Maritime GIS" | "Port Operations" | "Governance";

interface PageHeroProps {
  pillar: PillarType;
  title: string;
  purpose?: string;
  questions?: string[];
  questionsAnswered?: string[];
  truthClass?: "Static reference" | "Demo simulation" | "Modelled exposure";
  lastUpdated?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({
  pillar,
  title,
  purpose,
  questions,
  questionsAnswered,
  truthClass,
  lastUpdated,
}) => {
  const questionsList = questions || questionsAnswered || [];
  const getPillarBadgeStyle = (p: PillarType) => {
    switch (p) {
      case "Economics":
        return { bg: "#EEF4F8", color: "#1D4ED8", border: "#BFDBFE" };
      case "Maritime GIS":
        return { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" };
      case "Port Operations":
        return { bg: "#FFF7ED", color: "#C2410C", border: "#FFEDD5" };
      case "Governance":
        return { bg: "#FAF5FF", color: "#7E22CE", border: "#E9D5FF" };
      case "Command Center":
      default:
        return { bg: "var(--paper)", color: "var(--khaki-700)", border: "var(--khaki-300)" };
    }
  };

  const badgeStyle = getPillarBadgeStyle(pillar);

  return (
    <div
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--khaki-300)",
        borderRadius: "var(--radius)",
        padding: "20px 24px",
        marginBottom: "24px",
        boxShadow: "var(--shadow-subtle)",
      }}
    >
      {/* Header Row: Pillar Pill & Module Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              fontSize: "11px",
              fontWeight: 700,
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.color,
              border: `1px solid ${badgeStyle.border}`,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {pillar}
          </span>
          {truthClass && (
            <span
              className="gov-tag"
              style={{
                fontSize: "11px",
                background: "var(--sand-100)",
                color: "var(--charcoal)",
                border: "1px solid var(--khaki-300)",
                padding: "2px 6px",
                borderRadius: "3px",
              }}
            >
              {truthClass}
            </span>
          )}
          <span style={{ fontSize: "12px", color: "var(--khaki-500)", fontWeight: 500 }}>
            Decision Support Module {lastUpdated ? `· As of ${lastUpdated}` : ""}
          </span>
        </div>
      </div>

      {/* Main Title & Purpose Sentence */}
      <h2
        style={{
          fontSize: "1.375rem",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 8px 0",
          fontFamily: "var(--font-serif)",
        }}
      >
        {title}
      </h2>
      {purpose && (
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--charcoal)",
            margin: "0 0 16px 0",
            lineHeight: 1.5,
          }}
        >
          {purpose}
        </p>
      )}

      {/* Questions This Page Answers */}
      {questionsList.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--paper)",
            border: "1px solid var(--sand-100)",
            borderRadius: "var(--radius)",
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--khaki-700)",
              marginBottom: "8px",
            }}
          >
            <HelpCircle size={13} />
            <span>Questions this page answers</span>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "6px 16px",
              fontSize: "12px",
              color: "var(--charcoal)",
            }}
          >
            {questionsList.map((q, idx) => (
              <li key={idx} style={{ lineHeight: 1.4 }}>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
