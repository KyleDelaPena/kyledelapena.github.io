# Portfolio deployment

The root HTML and assets are the generated GitHub Pages portfolio. Publish the `main` branch at the root. Keep `.nojekyll` so Expo’s `_expo` assets are served.

## Working apps

- `/apps/pc-service-desk/index.html`: fictional repair and custom-build workspace, isolated browser storage, quotes, diagnostics, and service reports.
- `/apps/fishing-forecaster/index.html`: real Open-Meteo forecasts, saved spots, and estimated lunar windows.
- `/apps/sql-performance-lab/index.html`: real SQLite WebAssembly queries, actual query plans, repeated timing samples, result equivalence checks, and printable optimization reports on generated data.

The SQL lab’s editable source, method documentation, official runtime provenance, and automated tests are in [source/sql-performance-lab](source/sql-performance-lab/README.md). It has no npm dependencies. Use Node 24+ to run `npm test` and `npm run build` in that directory. Its generated database is in memory; only the last eight reports are stored in the visitor’s browser. It makes no MySQL or production performance claims.

The canonical portfolio generator and the two Expo source snapshots are maintained in the separate portfolio source project; use its `kyle-portfolio-source.zip` for a complete rebuild. The original Flask `app.py` and templates remain as legacy reference. Editing those files does not regenerate the published static pages.

## Validation for the SQL lab update

21 real SQLite/model tests and 92 portfolio tests passed. Browser verification passed 24 SQL app checks and 13 portfolio integration checks, including report downloads, cancellation, history recovery, mobile layouts, nested app paths, both existing apps, and a real query-timeout recovery.
