# Bonus Ecosystem App

A static-hostable single-page application for bonus execution analysis, transformation to payout schedules, POM planning projections, budget reconciliation, and QA administration.

## Purpose
The app lets planners load execution + planning datasets, normalize/map records through a crosswalk, project future payouts with a two-pass taker distribution model, compare to budget controls, and export all major outputs.

## Tech stack
- Vanilla JavaScript (ES modules)
- HTML/CSS SPA with hash routing
- Node.js scripts for dev/build/test
- Browser `localStorage` for persistence

## Local run
```bash
npm run dev
# open http://localhost:4173
```

## Test and build
```bash
npm test
npm run lint
npm run build
```

## Sample-data walkthrough
1. Go to **POM Inputs** and use the built-in loaded sample state (or re-upload files from `sample-data/`).
2. Review/edit crosswalk + bonus info inline in **POM Inputs**.
3. Open **Execution Dashboard** for historical filters, cards, charts, and detailed exportable table.
4. Open **Data Transformation** to inspect normalized payout schedule + validation/errors.
5. Open **POM Projections** for two-pass distribution, explainability, payout stream, and variance.
6. Open **Payout Waterfall** for grouped due-date/payout FY table and exports.
7. Open **Admin / QA** for dataset status, run metadata, reset/demo tools.

## Deployment notes (static hosting)
- Run `npm run build` and deploy the generated `dist/` directory.
- Hash routing is used, so no server-side route rewrite is required.
- All data is local/browser-side; no backend dependency.
