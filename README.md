# Bonus Ecosystem App

A front-end analytics MVP for Navy Reserve-style bonus incentive analysis covering execution history, transformation to payout schedules, POM projections, and budget reconciliation.

## Tech Stack
- Browser-first SPA using modular JavaScript (ESM), HTML, CSS
- Node.js scripts for local dev server, build copy, lint, and tests
- No backend required; persistence via `localStorage`

> Note: This environment blocked package registry access, so this MVP is implemented without external npm dependencies while preserving the requested domain architecture.

## What the app does
- Historical execution dashboard with summary cards, charts, and detailed table
- Transformation engine from execution records to payout schedule with traceability
- POM input management and crosswalk mapping visibility
- Two-pass taker distribution projection model
- Budget control reconciliation with over/under flags
- Payout waterfall grouped view
- Admin QA checks and rules reference page

## Install
```bash
# no dependency install required
node -v
```

## Run locally
```bash
npm run dev
# open http://localhost:4173
```

## Build
```bash
npm run build
```

## Test
```bash
npm test
npm run lint
```

## Sample data walkthrough
1. Start in **POM Inputs**.
2. Upload sample CSV files from `sample-data/`.
3. Move to **Execution Dashboard** for historical analysis.
4. Open **Data Transformation** to inspect payout schedule traces.
5. Open **POM Projections** to inspect two-pass distribution and budget variances.
6. Open **Payout Waterfall** for grouped payout stream views.

## Deployment notes
- Static-host friendly output in `dist/` from `npm run build`.
- For GitHub Pages, publish `dist/` contents. Hash routing is used so deep links are static-host safe.
