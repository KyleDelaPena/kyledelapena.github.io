# Portfolio deployment

The root HTML and assets are the generated GitHub Pages portfolio. Publish the `main` branch at the root. Keep `.nojekyll` so Expo’s `_expo` assets are served.

## Working apps

- `/apps/pc-service-desk/index.html`: fictional repair and custom-build workspace, isolated browser storage, quotes, diagnostics, and service reports.
- `/apps/fishing-forecaster/index.html`: real Open-Meteo forecasts, saved spots, and a selectable 24-hour fishing clock with estimated lunar windows, sun/moon events, daylight shading, and symbolic moon phase.
- `/apps/sql-performance-lab/index.html`: real SQLite WebAssembly queries, actual query plans, repeated timing samples, result equivalence checks, and printable optimization reports on generated data.

The SQL lab’s editable source, method documentation, official runtime provenance, and automated tests are in [source/sql-performance-lab](source/sql-performance-lab/README.md). It has no npm dependencies. Use Node 24+ to run `npm test` and `npm run build` in that directory. Its generated database is in memory; only the last eight reports are stored in the visitor’s browser. It makes no MySQL or production performance claims.

The canonical portfolio generator and the two Expo source snapshots are maintained in the separate portfolio source project; use its `kyle-portfolio-source.zip` for a complete rebuild. The original Flask `app.py` and templates remain as legacy reference. Editing those files does not regenerate the published static pages.

## Validation for the SQL lab update

21 real SQLite/model tests and 92 portfolio tests passed. Browser verification passed 24 SQL app checks and 13 portfolio integration checks, including report downloads, cancellation, history recovery, mobile layouts, nested app paths, both existing apps, and a real query-timeout recovery.

## Fishing clock update — October 28, 2026

The clock follows the selected location and forecast date, with noon at the top and midnight below. Teal major periods and gold minor periods can be highlighted from the accessible period list. The current-time hand appears only on the selected spot’s current day. The clock uses the existing SunCalc calculations and clearly labeled estimates; third-party clock values are not scraped. It follows the portfolio’s light surfaces, serif headings, navy text, and teal accents.

63 forecast tests, 92 portfolio tests, 18 clock browser checks, and seven final integration checks passed. TypeScript checks and web/iOS/Android exports passed for the local app. No physical-device tests or signed native builds were performed.
