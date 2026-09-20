import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

export const GLOSSARY: Record<string, { title: string; meaning: string }> = {
  "P10 / P50 / P90": {
    title: "P10 / P50 / P90 Planning Estimates",
    meaning: "Three planning estimates. P50 is the central case, P10 the lower case, P90 the adverse case. A wide gap between P10 and P90 means more uncertainty.",
  },
  "FOS": {
    title: "Freight Opportunity Score (FOS)",
    meaning: "A 0–100 screening score for whether conditions favour fixing freight now. It is a market screening signal, not an instruction to buy.",
  },
  "GCV": {
    title: "Gross Calorific Value (GCV)",
    meaning: "The energy in a tonne of coal. Two coals with the same price per tonne can differ a lot in cost per unit of energy.",
  },
  "DWT": {
    title: "Deadweight Tonnage (DWT)",
    meaning: "How much cargo, fuel and supplies a ship can carry safely without exceeding its load lines.",
  },
  "COA": {
    title: "Contract of Affreightment (COA)",
    meaning: "A longer-term agreement to move a set quantity of cargo over a designated period at agreed terms.",
  },
  "Laycan": {
    title: "Laycan (Laydays and Cancelling)",
    meaning: "The window of dates in which the ship must arrive and present itself ready to load cargo.",
  },
  "Demurrage": {
    title: "Contractual Demurrage",
    meaning: "A liquidated payment owed under a charter contract when loading or discharge takes longer than agreed laytime.",
  },
  "Modelled delay exposure": {
    title: "Modelled Delay Exposure",
    meaning: "The platform's planning estimate of what a delay might cost. It is not the same as contractual demurrage, which depends on actual charter terms.",
  },
  "SHAP": {
    title: "SHAP (SHapley Additive exPlanations)",
    meaning: "A game-theoretic method showing which market and operational factors pushed a forecast up or down, enabling auditability.",
  },
  "BDI / BPI": {
    title: "Baltic BDI / BPI Indices",
    meaning: "Baltic Dry Index (BDI) and Baltic Panamax Index (BPI). Standard global benchmarks for dry bulk shipping rates.",
  },
  "FFA": {
    title: "Forward Freight Agreement (FFA)",
    meaning: "A financial derivative reflecting future freight prices, representing forward market expectations.",
  },
  "VLSFO": {
    title: "Very Low Sulphur Fuel Oil (VLSFO)",
    meaning: "A standard marine fuel with sulphur content ≤0.50%, heavily impacting voyage fuel expenditure.",
  },
};

interface TermProps {
  term: keyof typeof GLOSSARY | string;
  children?: React.ReactNode;
}

export const TermTooltip: React.FC<TermProps> = ({ term, children }) => {
  const [show, setShow] = useState(false);
  const entry = GLOSSARY[term] || { title: term, meaning: term };

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <span
        tabIndex={0}
        role="button"
        aria-label={`${entry.title}: ${entry.meaning}`}
        style={{
          borderBottom: "1px dashed var(--khaki-700)",
          cursor: "help",
          fontWeight: 600,
          color: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
        }}
      >
        {children || term}
        <HelpCircle size={11} style={{ opacity: 0.6, verticalAlign: "middle" }} />
      </span>

      {show && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "240px",
            backgroundColor: "var(--ink)",
            color: "var(--sand-100)",
            padding: "8px 10px",
            borderRadius: "var(--radius)",
            fontSize: "11px",
            lineHeight: 1.35,
            boxShadow: "var(--shadow-modal)",
            zIndex: 1000,
            textAlign: "left",
            pointerEvents: "none",
          }}
        >
          <strong style={{ color: "var(--white)", display: "block", marginBottom: "3px" }}>
            {entry.title}
          </strong>
          <span>{entry.meaning}</span>
        </span>
      )}
    </span>
  );
};
