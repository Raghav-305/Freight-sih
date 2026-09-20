import React, { useState } from "react";
import { X, ChevronRight, ChevronLeft, Check, ShieldCheck, Compass, Info } from "lucide-react";

interface TourStep {
  title: string;
  targetDescription: string;
  explanation: string;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "1. The 5 Pillars of Freight Intelligence",
    targetDescription: "Sidebar Navigation (Left Panel)",
    explanation:
      "All 13 modules are categorized into 5 sovereign decision pillars: Economics, Maritime GIS, Governance, Port Operations, and the Command Center. Track reviewed steps in your session with the progress indicator.",
  },
  {
    title: "2. Route & Voyage Parameters",
    targetDescription: "Market Intelligence Form",
    explanation:
      "Select your load country, discharge port, vessel class, and as-of date. Use 'Load example' anytime to populate verified operational test parameters.",
  },
  {
    title: "3. Strategic Key Performance Indicators",
    targetDescription: "KPI Summary Cards",
    explanation:
      "Review the current spot rate, overall market regime, Freight Opportunity Score (FOS), and Baltic benchmarks (BDI/BPI). Hover over any acronym for plain-language definitions.",
  },
  {
    title: "4. Sovereign Compliance & Audit Integrity",
    targetDescription: "Mandatory CVC & GFR 2017 Banner",
    explanation:
      "Every module operates strictly under advisory guidelines. Recommendations must be reviewed and formally approved by an authorized officer under the applicable Delegation of Financial Powers (DoFP).",
  },
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="tour-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(20, 18, 14, 0.6)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--white)",
          border: "2px solid var(--khaki-500)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-modal)",
          padding: "24px",
          position: "relative",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            padding: "4px",
            color: "var(--charcoal)",
            cursor: "pointer",
          }}
          aria-label="Close tour"
        >
          <X size={18} />
        </button>

        {/* Step Counter Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 8px",
              backgroundColor: "var(--paper)",
              border: "1px solid var(--khaki-300)",
              borderRadius: "var(--radius-pill)",
              color: "var(--khaki-700)",
              textTransform: "uppercase",
            }}
          >
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>
          <span style={{ fontSize: "12px", color: "var(--khaki-700)", fontWeight: 600 }}>
            60-Second Orientation
          </span>
        </div>

        {/* Title & Target Area */}
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--ink)",
            margin: "0 0 4px 0",
            fontFamily: "var(--font-serif)",
          }}
        >
          {step.title}
        </h3>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--khaki-700)",
            marginBottom: "16px",
          }}
        >
          Focus: {step.targetDescription}
        </div>

        {/* Explanation text */}
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--charcoal)",
            lineHeight: 1.5,
            marginBottom: "24px",
          }}
        >
          {step.explanation}
        </p>

        {/* Footer Navigation Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="btn-outline"
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              opacity: currentStep === 0 ? 0.4 : 1,
              cursor: currentStep === 0 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          <div style={{ display: "flex", gap: "6px" }}>
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: idx === currentStep ? "var(--ink)" : "var(--sand-100)",
                  display: "inline-block",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="btn-primary"
            style={{ padding: "6px 14px", fontSize: "12px" }}
          >
            <span>{isLast ? "Complete Tour" : "Next"}</span>
            {isLast ? <Check size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};
