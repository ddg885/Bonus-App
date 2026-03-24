# Planning Mode Output

## 1) Technical Architecture
- Front-end-only SPA with hash routing and local storage persistence.
- Modular domain engines for normalization, mapping, transformation, projections, and reconciliation.
- UI pages mapped to required nav sections with shared cards/table/chart components.
- Static-host-ready build artifact in `dist/`.

## 2) File/Folder Structure
- `src/components` UI primitives.
- `src/pages` route views.
- `src/core` business logic modules.
- `src/utils` normalization/date/validation helpers.
- `src/state` global state and persistence.
- `sample-data` demo inputs.
- `tests` unit/smoke tests.
- `docs` architecture notes.

## 3) Phased Implementation Plan
1. Foundation scaffolding + navigation shell.
2. Domain models, utilities, ingestion/validation layer.
3. Transformation + projection + reconciliation engines.
4. Page UIs (dashboard, inputs, projections, waterfall, admin).
5. Tests, sample fixtures, docs, deployment scripts.

## 4) Assumptions
- Federal FY starts October 1 by default.
- Users can convert XLSX to CSV when runtime parser package is unavailable.
- Core planning years for seeded demo are FY2026–FY2028.
- Browser localStorage is available.

## 5) Risks and Mitigations
- **Risk**: Registry access blocked for npm packages.  
  **Mitigation**: Build package-free modular JS MVP with same business architecture.
- **Risk**: Spreadsheet variability.  
  **Mitigation**: Header normalization + required-column validation.
- **Risk**: Business rule drift.  
  **Mitigation**: Rules documented in UI and `BUSINESS_RULES.md`.

## 6) Workstream Task Breakdown
- **A Architecture/Routing**: sidebar shell + hash routes.
- **B Data Model/Transformation**: typed domain docs + transform engine + traceability.
- **C Execution Dashboard UI**: KPI cards + charts + detailed table.
- **D POM Projections**: two-pass logic, outputs, variance display.
- **E Ingestion/Validation**: upload zones, parser, required-column checks.
- **F Charts/Tables/Filters UX**: reusable components, sticky headers, grouped views.
- **G Testing/QA**: unit tests for FY, normalization, crosswalk, projection, reconciliation, smoke.
- **H Docs/Runbook/Deployment**: README, quickstart, dictionary, rules, workflow, architecture.
