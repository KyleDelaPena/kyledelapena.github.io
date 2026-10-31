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

## Detailed hourly grid — October 28, 2026

Fishing Forecaster now includes a 14-row weather/marine forecast grid with one/two-day comparisons, 1-hour/3-hour sampling, knots, fixed row labels, night shading, wind/temperature color bands, direction arrows, keyboard navigation, and selected-hour summaries. New Open-Meteo fields provide clouds, precipitation and wave direction. Rain amounts remain preceding-hour totals in either view. Sea level is modeled global MSL, without invented tide-station high/low times. Legacy version-2 caches remain readable; missing added fields show unavailable.

77 forecast tests, 92 portfolio tests, 20 hourly browser checks, and six final integration checks passed. TypeScript and web/iOS/Android exports passed for the local app. Signed native builds and physical-device tests were not performed.

Hourly time labels now use 12-hour AM/PM formatting, including selected-hour summaries, native display labels, tooltips and guide examples. Midnight displays as 12:00 AM and noon as 12:00 PM. Forecast sampling and timezones are preserved.

## Weather artwork — October 28, 2026

The large coastal illustration now follows the selected forecast condition and location-based day/night. Clouds, rain, snow, storms, fog, and nighttime moon scenes replace the fixed sun, while unavailable conditions use neutral scenery. Date selection changes the artwork and condition label together. Existing AM/PM times and provider requests are retained.

83 forecast tests, TypeScript checks, six portfolio integration tests, and 14 Chromium checks passed, including weather variants, date switching, phone/desktop layouts, and live-provider rendering. The personal app also exports web/iOS/Android successfully; no signed build or physical-device test was performed.

## Paddle Finder demo — October 28, 2026

`/apps/paddle-finder/` is a static portfolio app with combined category/numeric/date filters, spin-durability selection, multiple ordered sort levels, comparison of up to four paddles with a full-catalog name search, and filtered CSV export. It exposes 37 numeric fields and 14 categorical/date fields across 493 source entries from 85 brands. KewCOR delta is the decimal range of actual centerline measurements at 3, 4, 5 and 6 inches below the tip; 222 entries have complete exact-variant matches, and missing or ambiguous matches stay empty.

Serve the portfolio root with a static HTTP server to review the nested app. GitHub Pages uses the app’s `index.html`, `app.js`, `styles.css`, and bundled `data/paddles.json`; no Python runtime or API service is required. Filters, sorting and comparison run in page memory, without accounts or data uploads. Google Fonts supplies the typefaces. The app links back to `projects.html#paddle-finder`, includes its canonical URL, and follows the existing demos’ `noindex,follow` setting.

The footer labels the experience “Demo data” and credits John Kew Pickleball. The bundled measurements retain actual source values rather than synthetic fixtures, with no live-update claim or source affiliation. Base measurements were downloaded at 2026-10-28T16:22:11Z; the public Comparison Lab curve supplement was downloaded separately at 19:18:35Z. Source metadata retains both hashes/timestamps, field mappings, curve-join coverage, and the unchanged source-permission status. The portfolio owner explicitly requested publication after reviewing the source-policy notice; no source license is asserted.

`apps/paddle-finder/portfolio-build.json` records the reviewed runtime and packaged-file hashes, package counts, field counts, curve coverage, and photo coverage. Only static runtime files, the package README, and that manifest are included. Raw CSVs, Python/import scripts, local test artifacts, credentials, and personal filesystem paths are excluded. Package counts, original-record equivalence, metadata sanitization, and JavaScript syntax were verified before portfolio browser QA.

## Paddle product photos — October 29, 2026

Paddle Finder now shows matched product photos for 482 of 493 rows, with 11 explicitly unavailable variants. All five requested screenshot models have exact catalog photos. Table and comparison thumbnails open an accessible product-photo dialog with original listing credits. The 465 unique photos are optimized, locally bundled WebP assets; no retailer hotlinks or generated substitutes are used. Per-row provenance and hashes are retained in the separate image catalog, while the measurements remain unchanged.

Validation includes all bundled photo decodes, exact model/row identity, desktop/mobile zoom, keyboard focus, comparison photos, missing-catalog and failed-image recovery, and the existing filter/sort/API/export checks. The canonical source packager verifies and copies every manifest-listed asset.

Release checks passed: 20 data/API unit tests, 26 filter/sort/comparison/export browser checks, 12 photo browser checks (including every unique image decode), 13 portfolio integration checks, and 94 canonical portfolio tests. The staged package contains 472 reviewed files and retains every original measurement row.

## One-month fishing planner — October 30, 2026

Fishing Forecaster now includes a month calendar, bounded week navigation and a Today shortcut. Planning spans today through the same date next month, clamping shorter months. SunCalc sun/moon events and estimated bite windows cover the full range. Open-Meteo requests up to 16 weather days and 8 marine days; actual returned rows determine coverage. Later dates clearly show sun and moon planning only, with no fabricated weather, waves or weather-based activity rating. Calendar, clock and hourly selection stay synchronized, and older saved forecasts gain calculated dates while retaining their exact original readings.

89 forecast tests, 94 portfolio tests and 17 Chromium checks pass, including month boundaries, leap years, DST, units, five responsive widths, cached/offline behavior and live provider requests. The local personal app preserves its storage keys and passes TypeScript plus web/iOS/Android exports. No signed build or physical-device test was performed.
