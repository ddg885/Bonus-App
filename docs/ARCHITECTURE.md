# Technical Architecture

## Layered Modules
- `src/pages`: route-level views for each required page.
- `src/components`: reusable UI components (cards, table, chart, upload zone, layout).
- `src/core`: business engines (crosswalk, transformation, projection, reconciliation, formatters).
- `src/utils`: normalization, fiscal year utilities, csv parsing, validation.
- `src/state`: global store + local persistence.
- `sample-data`: demo fixtures for immediate usability.

## Routing
- Hash-based routing for static hosting compatibility.

## Persistence
- Entire app state persisted in browser `localStorage`.

## Explainability and Traceability
- Transformation assumptions exposed in UI and docs.
- Payout rows include `trace.sourceRowId` and `trace.ruleId`.
