import React from "react";
import { Sparkles, BarChart2, Compass, Layers } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  onLoadExample?: () => void;
  exampleButtonLabel?: string;
  showIllustrativePreview?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  onLoadExample,
  exampleButtonLabel = "Load example",
  showIllustrativePreview = true,
}) => {
  return (
    <div
      style={{
        marginTop: "24px",
        backgroundColor: "var(--white)",
        border: "1px dashed var(--khaki-500)",
        borderRadius: "var(--radius)",
        padding: "36px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--paper)",
          border: "1px solid var(--khaki-300)",
          color: "var(--khaki-700)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px auto",
        }}
      >
        <Compass size={24} />
      </div>

      <h3
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 8px 0",
          fontFamily: "var(--font-serif)",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          maxWidth: "520px",
          margin: "0 auto 20px auto",
          fontSize: "0.875rem",
          color: "var(--charcoal)",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {onLoadExample && (
        <button
          type="button"
          onClick={onLoadExample}
          className="btn-primary"
          style={{ marginBottom: "28px" }}
        >
          <Sparkles size={14} />
          <span>{exampleButtonLabel}</span>
        </button>
      )}

      {/* Illustrative Preview Mockup with Watermark */}
      {showIllustrativePreview && (
        <div style={{ maxWidth: "700px", margin: "0 auto", position: "relative" }}>
          {/* Watermark badge */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-5deg)",
              backgroundColor: "rgba(20, 18, 14, 0.85)",
              color: "var(--sand-100)",
              border: "1px solid var(--khaki-500)",
              padding: "8px 20px",
              borderRadius: "var(--radius)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              boxShadow: "var(--shadow-modal)",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            Sample Output Preview · ILLUSTRATIVE ONLY
          </div>

          {/* Faded Mock Grid */}
          <div
            style={{
              opacity: 0.35,
              pointerEvents: "none",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              backgroundColor: "var(--paper)",
              padding: "16px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--sand-100)",
            }}
          >
            <div style={{ padding: "12px", background: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "var(--khaki-700)" }}>REGIME</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>BULLISH</div>
              <div style={{ fontSize: "10px", color: "var(--charcoal)" }}>Rising rate pressure</div>
            </div>
            <div style={{ padding: "12px", background: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "var(--khaki-700)" }}>SIGNAL</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>FIX FORWARD</div>
              <div style={{ fontSize: "10px", color: "var(--charcoal)" }}>FOS: 74/100</div>
            </div>
            <div style={{ padding: "12px", background: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "var(--khaki-700)" }}>PROBABILITY</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>68% BULLISH</div>
              <div style={{ fontSize: "10px", color: "var(--charcoal)" }}>High confidence</div>
            </div>
            <div style={{ padding: "12px", background: "var(--white)", border: "1px solid var(--khaki-300)", borderRadius: "var(--radius)", textAlign: "left" }}>
              <div style={{ fontSize: "10px", color: "var(--khaki-700)" }}>BUNKER</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>$620 / MT</div>
              <div style={{ fontSize: "10px", color: "var(--charcoal)" }}>VLSFO Singapore</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
