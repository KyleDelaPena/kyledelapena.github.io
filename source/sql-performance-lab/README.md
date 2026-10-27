# SQL Performance Lab

A real SQLite workbench for Kyle Dela Pena’s portfolio. It runs entirely in the browser and can be served by GitHub Pages. No database installation, account, backend, external API, or package installation is needed.

## Try it

Open the app over HTTP or HTTPS, allow the generated database to finish, choose an experiment, and select **Run comparison**. Edit both queries and the proposed indexes to explore alternatives. Schema explorer shows the source schema. Run history keeps up to eight reports in this browser; HTML, JSON, and CSV preview exports download locally.

The three starting experiments cover composite indexes and sorting, a searchable date-range rewrite, and indexed join access paths. The same seed generates 2,000 fictional customers, 120 products, and a choice of 10,000, 50,000, or 150,000 orders. Each order has two valid line items and a matching total in integer cents. Dates cover 2025–2026; email addresses use `example.invalid`.

## Run or rebuild

Use Node 24 or newer and Python 3. The official SQLite runtime is vendored and verified by SHA-256 during each build; no npm installation is necessary.

```sh
npm test
npm run build
npm run preview
```

Open <http://127.0.0.1:8087>. Direct `file://` access cannot load the database worker correctly. Stop the server with Control-C. The standalone local preview’s portfolio link assumes this folder is hosted at `/apps/sql-performance-lab/`; it resolves correctly in the full portfolio export.

From the portfolio source root:

```sh
npm run build:apps -- sql-performance-lab
node scripts/build.mjs --out github-pages --site-url https://kyledelapena.github.io/
```

The checked-in static app is copied to `/apps/sql-performance-lab/`. Its relative ES module and WebAssembly URLs support nested hosting without cross-origin isolation headers. `.nojekyll` remains at the portfolio publishing root. The official in-memory API runs in a module Web Worker; OPFS, SharedArrayBuffer, and the deprecated Worker1 proxy API are not used.

## Measurement method

- Seven recorded samples per variant, with alternating baseline/candidate order. Each sample has one unrecorded warm-up after setting the schema. Baseline samples have no added indexes; candidate samples use only the proposed indexes. Primary keys remain on both sides.
- Timings cover statement preparation, execution, and materialization of every result row. Index creation, ANALYZE, result comparison, hashing, UI rendering, and worker messages are excluded. Index creation plus ANALYZE is reported separately as a median across the seven candidate setups.
- All returned columns and typed rows are compared as a multiset: duplicates matter and row order is ignored. A query must return at most 10,000 rows, 100 columns, and 12,000 characters per text value. The first 100 are stored as a preview and available as CSV; full results participate in equality checks and SHA-256 fingerprints. Equivalence is evidence for this dataset, not a proof for all data.
- Every repetition is checked against the variant’s first result. Unstable results are rejected. Read-only status is checked on SQLite’s compiled statement before stepping. User indexes are restricted to up to four simple CREATE INDEX statements on known tables and columns.
- Plans are actual `EXPLAIN QUERY PLAN` output. They describe access strategy, not measured rows scanned. Raw plan output is retained because its format is engine-version dependent.
- Timings are from a warmed in-memory browser connection. They do not measure production MySQL, disk I/O, writes, concurrency, or network latency. If either median is below 0.10 ms, the UI withholds a speedup ratio. Zero samples can occur due to browser timer resolution and are retained in reports.
- Occupied page space is `(page_count - freelist_count) × page_size`. It is not isolated index size or physical file size. Index tradeoffs and changes to SQL are described with each experiment.

## State and recovery

The database is in memory and is regenerated on reload. Only comparison reports use local storage, under `kyle-portfolio:sql-performance-lab:history:v1`. This key is separate from the PC and Fishing apps. Clear history requires confirmation and removes only this key. Storage errors are surfaced while the in-memory app and downloads remain usable. Persisted history is bounded and validated before rendering.

Queries run off the UI thread. Cancel terminates the database worker, regenerates the selected dataset, and preserves completed report history. Query operations have a 15-second limit; initial generation has a 45-second limit. After a worker failure or timeout, **Rebuild data** restarts it. There are no uploads, account connections, or employer records.

## Source map and runtime provenance

- `src/model.mjs`: experiments, schema, deterministic random source, SQL validation, comparison rules, CSV escaping, history validation.
- `src/engine.mjs`: real SQLite generation, execution, repeated measurements, exact result checks, raw plans, and cleanup.
- `src/worker.mjs`: module worker protocol. `src/app.mjs`: UI and browser state.
- `src/report.mjs`: self-contained printable HTML reports. `src/styles.css`: responsive interface.
- `tests/`: automated model and real SQLite WebAssembly tests, using the official Node wrapper to exercise the same SQLite engine.
- `vendor/provenance.json`: official `@sqlite.org/sqlite-wasm` package version, tarball integrity, upstream source, and file hashes. Upstream license notices are retained in the JavaScript. Browser exports omit the Node wrapper.

Primary references: [SQLite query plans](https://sqlite.org/eqp.html), [query planning](https://sqlite.org/queryplanner.html), [WebAssembly documentation](https://sqlite.org/wasm/doc/trunk/index.md), and the [official ES module wrapper](https://github.com/sqlite/sqlite-wasm).

## Browser verification

The optional Playwright harness is `tests/browser-check.py`. Start the preview first, install Playwright/Chromium in your preferred Python environment, then run it. Set `SQL_LAB_URL` to test another HTTP origin or the nested portfolio app URL. Artifacts go in the portfolio’s ignored `validation/` directory. The harness covers actual queries, exports, validation failures, history recovery, worker cancellation, blocked storage, and responsive layouts.
