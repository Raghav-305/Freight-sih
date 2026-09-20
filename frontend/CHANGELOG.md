# Frontend UI Upgrade Changelog & Explainer Integration Guide

## 1. Summary of Changes (Phase 1: Shared Layout & Executive Overview)

### A. Visual Identity: Sovereign Government Design System (Khaki / Black / White)
- **Design Tokens (`src/theme/tokens.css`)**:
  - Replaced all blue tones with the authoritative Indian Government palette:
    - Primary text & header: `--ink: #14120E`
    - Dark panels & sidebar active state: `--charcoal: #2B2820`
    - Khaki accents, borders & dividers: `--khaki-700: #6B5E3C`, `--khaki-500: #8A7F5C`, `--khaki-300: #C3B091`
    - Backgrounds & surfaces: `--sand-100: #E8E0CC`, `--paper: #F7F4EC`, `--white: #FFFFFF`
    - Muted semantic status colors: olive green (`#4F6B2A`), amber (`#B7791F`), brick (`#9B2C2C`).
  - **Self-Hosted Typography**: Installed and bundled `@fontsource/merriweather` (serif for headings), `@fontsource/inter` (sans for UI), and `@fontsource/noto-sans-devanagari` (Hindi) locally with zero external CDN dependencies (100% air-gapped).
  - **Button & Container Styling**: Flat, formal, 4px border radius, subtle shadows, and zero gradients on buttons.
  - **Accessibility & GIGW**: Full WCAG 2.1 AA compliance, high-contrast mode toggle (`body.high-contrast`), font scaling (`A-`, `A`, `A+`), and dedicated print stylesheet (`@media print`).

### B. Sovereign Government-Portal Chrome
- **Top Utility Bar (`src/components/ui/UtilityBar.tsx`)**:
  - "Skip to main content" link for keyboard and screen reader accessibility.
  - Text-size controls (`A-`, `A`, `A+`).
  - High-contrast toggle (black/white mode).
  - Bilingual switcher: English | हिन्दी (`en` and `hi`).
  - "Print this analysis" action with formal print styles.
  - Command palette quick hint (`Ctrl + K`).
- **Official Header (`src/components/ui/GovHeader.tsx`)**:
  - Reserved authorized asset slot for the State Emblem of India (`🏛️ सत्यमेव जयते`).
  - Official platform title: "Maritime Chartering Platform".
  - Subtitle: "National Freight & Procurement Intelligence · Ministry of Ports, Shipping & Waterways / Ministry of Coal".
  - Live status indicator pill (Live / Mock / Offline) with an interactive diagnostics popover showing server health, active model version, data freshness, and local air-gapped deployment confirmation.
- **Mandatory Compliance Banner (`src/components/ui/ComplianceBanner.tsx`)**:
  - Prominently displays the CVC & GFR 2017 Compliance Rule on every page: advisory decision support requiring human review under the Delegation of Financial Powers (DoFP).
- **5-Pillar Sidebar Navigation (`src/components/ui/GovSidebar.tsx`)**:
  - Categorized into the 5 Sovereign Pillars: Command Center, Economics, Maritime GIS, Port Operations, and Governance.
  - Interactive review progress indicator tracking completed pages in the session (`X / 12 Pages`).
  - Collapsible groups, active state indicators, and DoFP human review warning.
- **Sovereign Footer (`src/components/ui/GovFooter.tsx`)**:
  - Advisory disclaimer, GIGW & WCAG 2.1 AA statement, model & dataset lineage, and last updated timestamp.
- **Interactive Modals**:
  - **Command Palette (`src/components/ui/CommandPalette.tsx`)**: Instant keyboard modal (`Ctrl + K`) to jump to any of the 13 modules.
  - **60-Second Tour (`src/components/ui/GuidedTour.tsx`)**: Interactive 4-step walkthrough for new users.

### C. Solved Deficiencies
1. **Current Spot Rate Card**: Fixed indefinite `"..."` display by incorporating loading skeletons, route freight fallbacks, and a clear `"Figure unavailable. The service did not respond. [Retry]"` state.
2. **Connecting State**: Replaced indefinite `"Connecting..."` with active telemetry, mock mode tags, and offline cache notices.
3. **Empty Date Input**: Set `as_of_date` to default to today's date (`YYYY-MM-DD` / `DD-MM-YYYY` display) across all parameter forms.
4. **Empty Space Under Forms**: Added structured `EmptyState` component with informative descriptions, "Load example" triggers, and watermarked "ILLUSTRATIVE ONLY" sample previews.

### D. Executive Overview Module Upgrades
- **Landing Hero**: "From market signal to governed decision", Start analysis button, 60-second tour button, and 3 trust badges.
- **Page Hero**: "About this module", purpose, questions answered, and Pillar badge.
- **How to Use**: 3 numbered steps (Enter -> Run -> Interpret) + "Load example" button.
- **Result Interpretation Guide**: Collapsible breakdown of 11 output metrics.
- **What Not To Assume**: Callout box with 6 critical cautions.
- **Five Pillars Capability Cards**: Interactive cards for all 5 pillars.
- **Recommended Review Workflow**: Interactive 12-step review stepper with session checkmarks.
- **Key Terms Glossary**: Tooltips and definitions for 12 essential maritime and governance terms.

---

## 2. How to Add Explainer Content for a New Page

When upgrading or adding any of the remaining 12 modules, follow this standardized three-part structure:

### Step 1: Add Translations in `src/i18n/en.json` and `src/i18n/hi.json`
Add the module's hero title, purpose, questions answered, and interpretation terms under a new key (e.g. `forecast`):
```json
"forecast": {
  "heroTitle": "Route Freight Rate Forecast & Explainability",
  "purpose": "Generate probabilistic freight rate predictions across 30, 60, and 90-day horizons with SHAP feature attributions.",
  "question1": "What is the expected rate range (P10/P50/P90) for this voyage?",
  "question2": "Which market features pushed the rate up or down?",
  "howToStep1": "Select origin, destination, laycan dates and cargo quantity.",
  "howToStep2": "Run the quantile forecasting model.",
  "howToStep3": "Examine the P10-P50-P90 spread and SHAP factor attribution."
}
```

### Step 2: Use Shared Components in the Page View
Import and mount the shared component library:
```tsx
import { PageHero } from "../ui/PageHero";
import { HowToSteps } from "../ui/HowToSteps";
import { ResultGuide } from "../ui/ResultGuide";
import { EmptyState } from "../ui/EmptyState";
import { TermTooltip } from "../ui/TermTooltip";

export const ForecastPage = ({ ... }) => {
  return (
    <div className="tab-content">
      {/* 1. Module Hero */}
      <PageHero
        pillar="Economics"
        title="Route Freight Rate Forecast & Explainability"
        purpose="Generate probabilistic freight rate predictions across 30, 60, and 90-day horizons with SHAP feature attributions."
        questions={[
          "What is the expected rate range (P10/P50/P90) for this voyage?",
          "Which market features pushed the rate up or down?",
          "How wide is the uncertainty spread between P10 and P90?",
        ]}
      />

      {/* 2. How to Use Strip */}
      <HowToSteps
        onLoadExample={handleLoadExample}
        exampleLabel="Load example (Australia → Dhamra, Panamax, 80,000 MT)"
        steps={[
          { number: "1", title: "Enter", description: "Select route, cargo quantity, and laycan window." },
          { number: "2", title: "Run", description: "Execute quantile forecast." },
          { number: "3", title: "Interpret", description: "Read P50 central case and verify SHAP drivers." },
        ]}
      />

      {/* 3. Parameter Form */}
      ...

      {/* 4. Results or Empty State */}
      {!result ? (
        <EmptyState
          title="Your rate forecast will appear here"
          description="Once you run the forecast, you will see multi-horizon rate ranges, P10/P50/P90 confidence bounds, and SHAP factor impacts."
          onLoadExample={handleLoadExample}
        />
      ) : (
        ...
      )}

      {/* 5. Result Interpretation Guide & What Not to Assume */}
      <ResultGuide
        items={[
          { term: "P10 / P50 / P90", explanation: "P50 is the central forecast, P10 lower bound, P90 adverse bound." },
          { term: "SHAP Values", explanation: "Shows how each factor shifted the forecast away from the historical baseline." },
        ]}
        cautions={[
          "A forecast is a planning range, not a guaranteed contractual rate.",
          "High confidence does not protect against unforeseen black swan events.",
        ]}
      />
    </div>
  );
};
```
