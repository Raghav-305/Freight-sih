import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { PageTab } from "./GovSidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: PageTab) => void;
}

interface CommandItem {
  id: PageTab;
  title: string;
  pillar: string;
  description: string;
  shortcut?: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: "overview", title: "Executive Overview", pillar: "Command Center", description: "Macro market regime, BDI/BPI benchmarks, and multi-pillar status" },
  { id: "forecast", title: "Forecast & SHAP", pillar: "Economics", description: "Rate ranges (P10/P50/P90) and explainable feature attributions" },
  { id: "opportunity", title: "Freight Opportunity Score (FOS)", pillar: "Economics", description: "Fixing window screening and timing indicators" },
  { id: "charter", title: "Portfolio Optimizer", pillar: "Economics", description: "Contract allocation across spot, COA, and period time-charter" },
  { id: "scenarios", title: "Policy & Economics", pillar: "Economics", description: "Landed cost and energy cost comparison across import vs coastal coal" },
  { id: "map", title: "Maritime GIS", pillar: "Maritime GIS", description: "Geospatial view of ports, shipping corridors, and chokepoints" },
  { id: "risk", title: "Risk Intelligence", pillar: "Maritime GIS", description: "Composite route, weather, and geopolitical risk assessments" },
  { id: "ports", title: "Port Operations", pillar: "Port Operations", description: "Physical berth constraints, draft limits, and delay exposure" },
  { id: "vessels", title: "Vessel Intelligence", pillar: "Port Operations", description: "Vessel physical compatibility and specification screening" },
  { id: "governance", title: "CVC Governance", pillar: "Governance", description: "Immutable audit trail, DoFP decisions, and vigilance logging" },
  { id: "quality", title: "Data Quality (ISO 8000)", pillar: "Governance", description: "Pipeline lineage, completeness, and data freshness metrics" },
  { id: "models", title: "Model Registry", pillar: "Governance", description: "Registered ML model versions, training dates, and artifacts" },
  { id: "counterfactual", title: "Counterfactuals (Layer 6)", pillar: "Governance", description: "Sensitivity search and parameter perturbation analysis" },
  { id: "collusion", title: "Bid Anomaly & Collusion Detection", pillar: "Governance", description: "Anti-rigging screening, broker collusion risk, and SHAP explainability" },
  { id: "contract", title: "Charterparty Studio (BIMCO Legal Engine)", pillar: "Governance", description: "BIMCO GENCON 1994 & NYPE 2015 automated contract drafting and CVC protective riders" },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filtered = COMMAND_ITEMS.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.pillar.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelectTab(filtered[selectedIndex].id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(20, 18, 14, 0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="command-palette-modal"
        style={{
          width: "100%",
          maxWidth: "580px",
          backgroundColor: "var(--white)",
          border: "1px solid var(--khaki-500)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-modal)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid var(--sand-100)",
            backgroundColor: "var(--paper)",
          }}
        >
          <Search size={18} style={{ color: "var(--khaki-700)", marginRight: "10px" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a module name or keyword (e.g. forecast, vessel, risk)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontSize: "14px",
              color: "var(--ink)",
              padding: 0,
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: "2px",
              color: "var(--charcoal)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", fontSize: "12px", color: "var(--charcoal)" }}>
              No matching modules found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius)",
                    backgroundColor: isSelected ? "var(--charcoal)" : "transparent",
                    color: isSelected ? "var(--white)" : "var(--ink)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.1s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>{item.title}</span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 6px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: isSelected ? "var(--khaki-700)" : "var(--paper)",
                          color: isSelected ? "var(--white)" : "var(--khaki-700)",
                          border: `1px solid ${isSelected ? "transparent" : "var(--sand-100)"}`,
                          fontWeight: 600,
                        }}
                      >
                        {item.pillar}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.8, lineHeight: 1.3 }}>
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ opacity: isSelected ? 1 : 0.4 }} />
                </div>
              );
            })
          )}
        </div>

        {/* Bottom helper */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--paper)",
            borderTop: "1px solid var(--sand-100)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--khaki-700)",
          }}
        >
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate, <strong>Enter</strong> to select</span>
          <span><strong>Esc</strong> to close</span>
        </div>
      </div>
    </div>
  );
};
