import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, BookOpen } from "lucide-react";

export interface GuideItem {
  term: string;
  explanation: string;
}

export interface ResultGuideProps {
  title?: string;
  items?: GuideItem[];
  rules?: (string | GuideItem)[];
  cautions?: string[];
  notAssumed?: string[];
}

export const ResultGuide: React.FC<ResultGuideProps> = ({
  title,
  items,
  rules,
  cautions,
  notAssumed,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Normalize items from either items or rules
  const normalizedItems: GuideItem[] = [];
  if (items && Array.isArray(items)) {
    normalizedItems.push(...items);
  }
  if (rules && Array.isArray(rules)) {
    rules.forEach((r, idx) => {
      if (typeof r === "string") {
        const colonIdx = r.indexOf(":");
        if (colonIdx > 0 && colonIdx < 35) {
          normalizedItems.push({
            term: r.slice(0, colonIdx).trim(),
            explanation: r.slice(colonIdx + 1).trim(),
          });
        } else {
          normalizedItems.push({
            term: `Guidance Note #${idx + 1}`,
            explanation: r,
          });
        }
      } else if (r && typeof r === "object") {
        normalizedItems.push(r);
      }
    });
  }

  // Normalize cautions from cautions or notAssumed
  const normalizedCautions: string[] = [];
  if (cautions && Array.isArray(cautions)) {
    normalizedCautions.push(...cautions);
  }
  if (notAssumed && Array.isArray(notAssumed)) {
    normalizedCautions.push(...notAssumed);
  }

  return (
    <div
      style={{
        marginTop: "32px",
        backgroundColor: "var(--white)",
        border: "1px solid var(--khaki-300)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-subtle)",
        overflow: "hidden",
      }}
    >
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "14px 20px",
          backgroundColor: "var(--paper)",
          border: "none",
          borderBottom: isOpen ? "1px solid var(--khaki-300)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
        }}
        aria-expanded={isOpen}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BookOpen size={16} style={{ color: "var(--khaki-700)" }} />
          <div>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
              {title || "Read the result correctly"}
            </h4>
            <span style={{ fontSize: "11px", color: "var(--charcoal)", opacity: 0.8 }}>
              Official interpretative guidance & what not to assume under GFR 2017
            </span>
          </div>
        </div>
        <div style={{ color: "var(--khaki-700)" }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Guide Content */}
      {isOpen && (
        <div style={{ padding: "20px" }}>
          {/* Guide items table/grid */}
          {normalizedItems.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "12px 20px",
                marginBottom: normalizedCautions.length > 0 ? "20px" : "0",
              }}
            >
              {normalizedItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    borderLeft: "2px solid var(--khaki-500)",
                    paddingLeft: "10px",
                    fontSize: "12px",
                  }}
                >
                  <strong style={{ color: "var(--ink)", display: "block", marginBottom: "2px" }}>
                    {item.term}
                  </strong>
                  <span style={{ color: "var(--charcoal)", lineHeight: 1.4 }}>
                    {item.explanation}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* What Not to Assume Callout */}
          {normalizedCautions.length > 0 && (
            <div
              style={{
                backgroundColor: "var(--brick-bg)",
                border: "1px solid var(--brick-border)",
                borderLeft: "4px solid var(--brick)",
                borderRadius: "var(--radius)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--brick)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <AlertCircle size={15} />
                <span>What not to assume (Critical Cautions & Legal Boundaries)</span>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "18px",
                  fontSize: "11.5px",
                  color: "var(--charcoal)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "6px 16px",
                }}
              >
                {normalizedCautions.map((caution, idx) => (
                  <li key={idx} style={{ lineHeight: 1.4 }}>
                    {caution}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
