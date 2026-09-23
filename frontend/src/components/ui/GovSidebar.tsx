import React, { useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Ship,
  AlertTriangle,
  Compass,
  DollarSign,
  Anchor,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Check,
  FileText,
} from "lucide-react";

export type PageTab =
  | "overview"
  | "forecast"
  | "charter"
  | "vessels"
  | "risk"
  | "opportunity"
  | "scenarios"
  | "ports"
  | "map"
  | "quality"
  | "governance"
  | "models"
  | "counterfactual"
  | "collusion"
  | "contract";


interface PillarGroup {
  id: string;
  name: string;
  badge: string;
  items: {
    id: PageTab;
    label: string;
    icon: React.ReactNode;
  }[];
}

interface GovSidebarProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  visitedTabs: Set<string>;
  apiMode?: string;
}

export const GovSidebar: React.FC<GovSidebarProps> = ({
  activeTab,
  onSelectTab,
  visitedTabs,
  apiMode = "mock",
}) => {
  const { t } = useTranslation();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    command: false,
    economics: false,
    gis: false,
    ports: false,
    governance: false,
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const pillars: PillarGroup[] = [
    {
      id: "command",
      name: "Command Center",
      badge: "Pillar 5",
      items: [
        { id: "overview", label: "Executive Overview", icon: <LayoutDashboard size={15} /> },
      ],
    },
    {
      id: "economics",
      name: "Economics & Forecasting",
      badge: "Pillar 1",
      items: [
        { id: "forecast", label: "Forecast & SHAP", icon: <TrendingUp size={15} /> },
        { id: "opportunity", label: "Freight Opportunity", icon: <Compass size={15} /> },
        { id: "charter", label: "Portfolio Optimizer", icon: <Briefcase size={15} /> },
        { id: "scenarios", label: "Policy & Economics", icon: <DollarSign size={15} /> },
      ],
    },
    {
      id: "gis",
      name: "Maritime GIS & Risk",
      badge: "Pillar 2",
      items: [
        { id: "map", label: "Maritime GIS", icon: <MapPin size={15} /> },
        { id: "risk", label: "Risk Intelligence", icon: <AlertTriangle size={15} /> },
      ],
    },
    {
      id: "ports",
      name: "Port & Vessel Operations",
      badge: "Pillar 4",
      items: [
        { id: "ports", label: "Port Operations", icon: <Anchor size={15} /> },
        { id: "vessels", label: "Vessel Intelligence", icon: <Ship size={15} /> },
      ],
    },
    {
      id: "governance",
      name: "Governance & Assurance",
      badge: "Pillar 3",
      items: [
        { id: "governance", label: "CVC Governance", icon: <ShieldCheck size={15} /> },
        { id: "quality", label: "Data Quality (ISO 8000)", icon: <CheckCircle2 size={15} /> },
        { id: "models", label: "Model Registry", icon: <Cpu size={15} /> },
        { id: "counterfactual", label: "Counterfactuals (L6)", icon: <GitBranch size={15} /> },
        { id: "collusion", label: "Bid Anomaly & Collusion", icon: <ShieldAlert size={15} /> },
        { id: "contract", label: "Charterparty Studio", icon: <FileText size={15} /> },
      ],
    },
  ];

  return (
    <aside className="portal-sidebar" aria-label="Portal Navigation">
      {/* Session Progress Counter */}
      <div
        style={{
          padding: "10px 12px",
          marginBottom: "12px",
          backgroundColor: "var(--paper)",
          border: "1px solid var(--sand-100)",
          borderRadius: "var(--radius)",
          fontSize: "11px",
          color: "var(--charcoal)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontWeight: 600 }}>Workflow Review</span>
          <span style={{ fontWeight: 700, color: "var(--khaki-700)" }}>
            {visitedTabs.size} / 12 Pages
          </span>
        </div>
        <div
          style={{
            height: "4px",
            width: "100%",
            backgroundColor: "var(--sand-100)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, (visitedTabs.size / 12) * 100)}%`,
              backgroundColor: "var(--olive)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Navigation Pillar Groups */}
      <nav style={{ flex: 1, overflowY: "auto" }}>
        {pillars.map((pillar) => {
          const isCollapsed = collapsedGroups[pillar.id];
          return (
            <div key={pillar.id} style={{ marginBottom: "14px" }}>
              {/* Pillar Header */}
              <button
                type="button"
                onClick={() => toggleGroup(pillar.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "none",
                  border: "none",
                  padding: "4px 8px",
                  color: "var(--charcoal)",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
                aria-expanded={!isCollapsed}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{pillar.name}</span>
                </div>
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>

              {/* Pillar Items */}
              {!isCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                  {pillar.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const isVisited = visitedTabs.has(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectTab(item.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "var(--radius)",
                          fontSize: "12px",
                          fontWeight: isActive ? 700 : 500,
                          textAlign: "left",
                          background: isActive ? "var(--charcoal)" : "transparent",
                          color: isActive ? "var(--white)" : "var(--ink)",
                          border: "1px solid",
                          borderColor: isActive ? "var(--charcoal)" : "transparent",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: isActive ? "var(--sand-100)" : "var(--khaki-700)" }}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>

                        {/* Visited Progress Indicator */}
                        {isVisited && (
                          <span
                            title="Reviewed in this session"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              backgroundColor: isActive ? "var(--khaki-500)" : "var(--olive-bg)",
                              color: isActive ? "var(--white)" : "var(--olive)",
                              border: `1px solid ${isActive ? "transparent" : "var(--olive-border)"}`,
                              fontSize: "9px",
                            }}
                          >
                            <Check size={9} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Human Review Required Note (DoFP) */}
      <div
        style={{
          marginTop: "16px",
          padding: "10px 12px",
          backgroundColor: "var(--paper)",
          border: "1px solid var(--khaki-300)",
          borderRadius: "var(--radius)",
          fontSize: "11px",
          lineHeight: 1.4,
          color: "var(--charcoal)",
        }}
      >
        <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "3px" }}>
          {t("chrome.sidebarReviewNoteTitle")}
        </div>
        <div style={{ fontSize: "10.5px" }}>
          {t("chrome.sidebarReviewNoteText")}
        </div>
      </div>

      {/* Operating Mode Indicator */}
      <div
        style={{
          marginTop: "10px",
          paddingTop: "8px",
          borderTop: "1px solid var(--sand-100)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "10.5px",
          color: "var(--khaki-700)",
        }}
      >
        <span>Mode: <strong style={{ textTransform: "uppercase", color: "var(--ink)" }}>{apiMode}</strong></span>
        <span>Local / Air-gapped</span>
      </div>
    </aside>
  );
};
