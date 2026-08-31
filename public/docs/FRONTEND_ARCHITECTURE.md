# Frontend Architecture

The operational UI is organized around a persistent shell, page-level workflows, reusable display components, forms and a centralized API boundary. Mock responses mirror future backend contracts. Live integration should replace adapters rather than page business logic.

Key principles: no PostgreSQL access from browser, no ML imports into UI, no business calculations in React, explicit demonstration/live state, data freshness and model metadata, accessible semantic controls, keyboard navigation, visible focus and horizontal table scrolling on smaller screens.