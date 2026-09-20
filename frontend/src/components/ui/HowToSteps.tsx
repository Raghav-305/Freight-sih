import React from "react";
import { PlayCircle, Database, CheckSquare, Sparkles } from "lucide-react";

interface Step {
  number: string;
  title: string;
  description: string;
}

interface HowToStepsProps {
  steps?: Step[];
  onLoadExample?: () => void;
  exampleLabel?: string;
}

export const HowToSteps: React.FC<HowToStepsProps> = ({
  steps = [
    {
      number: "1",
      title: "Enter",
      description: "Select origin, destination, vessel class and date, or press 'Load example'.",
    },
    {
      number: "2",
      title: "Run",
      description: "Press 'Generate market intelligence'. The platform assembles the market picture for that route.",
    },
    {
      number: "3",
      title: "Interpret",
      description: "Read the signal, then move to Forecast, Vessel and Port pages for detail. This page never approves anything.",
    },
  ],
  onLoadExample,
  exampleLabel = "Load example (Australia → Dhamra, Panamax, today)",
}) => {
  return (
    <div
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--sand-100)",
        borderRadius: "var(--radius)",
        padding: "14px 18px",
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--khaki-700)" }}>
          How to use this page
        </div>
        {onLoadExample && (
          <button
            type="button"
            onClick={onLoadExample}
            style={{
              fontSize: "11.5px",
              padding: "4px 10px",
              backgroundColor: "var(--paper)",
              border: "1px solid var(--khaki-500)",
              color: "var(--ink)",
              borderRadius: "var(--radius)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={12} style={{ color: "var(--khaki-700)" }} />
            <span>{exampleLabel}</span>
          </button>
        )}
      </div>

      {/* 3 Step Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {steps.map((step, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              padding: "8px 10px",
              backgroundColor: "var(--paper)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--sand-100)",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: "var(--ink)",
                color: "var(--white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              {step.number}
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{step.title}</div>
              <div style={{ fontSize: "11px", color: "var(--charcoal)", lineHeight: 1.35, marginTop: "2px" }}>
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
