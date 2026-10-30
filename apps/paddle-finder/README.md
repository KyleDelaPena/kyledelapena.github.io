# Paddle Finder portfolio demo

Static app at `/apps/paddle-finder/` for Kyle Dela Pena’s portfolio. It runs directly on GitHub Pages: `index.html`, `styles.css`, `app.js`, the bundled data/photo catalogs, and local product-photo assets. No Python server, install, runtime API, account, or data upload is required. Serve the portfolio root with any static HTTP server for local review; opening the HTML directly as a file does not provide JSON fetch support.

The app includes 493 source entries from 85 brands, 37 numeric fields and 14 categorical/date fields. Visitors can combine category/range filters, prioritize multiple sort fields, compare up to three paddles, and export the filtered rows as CSV. Filters and comparison are held in page memory. Google Fonts supplies the typefaces; measurements load from the bundled JSON snapshot.

Measurements and source classifications are credited to [John Kew Pickleball](https://www.johnkewpickleball.com/paddle-database). This is an independent portfolio interface without source affiliation or endorsement. The footer labels the experience “Demo data”; the bundled records retain actual source values and missing entries. They are not synthetic fixtures or a live feed.

Base data was downloaded on 2026-10-28 at 16:22:11 UTC. Supplemental centerline KewCOR data was downloaded at 19:18:35 UTC from the public feed used by the [Paddle Comparison Lab](https://www.johnkewpickleball.com/paddle-comparison-lab). All 493 original rows are retained; 222 have complete, exact-variant curve matches. Delta is the decimal range of the four source readings at 3, 4, 5 and 6 inches below the tip, with unknown or ambiguous matches left blank. Separate source hashes, timestamps, field maps, and matching outcomes remain in JSON metadata/provenance.

This package contains no raw input CSVs, local import scripts, Python server, browser test artifacts, credentials, or personal filesystem paths. `portfolio-build.json` records the reviewed source hashes, packaged file hashes, and data counts. Canonical URL: https://kyledelapena.github.io/apps/paddle-finder/. The app follows the existing demos’ `noindex,follow` setting and links back to `../../projects.html#paddle-finder`.

## Product photos

482 of 493 entries have individually matched product photos, including all five highlighted models (Ultré Power 2, Loco 2 Elongated, Jade Elongated 16, Loco 2 Hybrid, and J2CR Long Handle Blue Grit). The 11 entries without a verified identifying image show ‘Photo unavailable’. A manufacturer’s blank variant-selector silhouette is excluded.

Table thumbnails and comparison photos open a larger view with a link to the original photo listing. Photos come from the John Kew product-photo catalog and reviewed manufacturer/retailer listings; `data/paddle-images.json` retains per-row model identity, source URLs, original-byte hashes, and packaged image hashes. These are actual source product images, with no AI-generated paddle illustrations. Stock colors can vary.

Table and comparison thumbnails use validated content bounds from the photo catalog to remove empty source margins and show paddles at a consistent height, while preserving their proportions. Complex photos without reliable bounds use the full frame. The larger photo view retains the original framing.

The 465 unique images are bundled as WebP files under `assets/paddles/`, proportionally resized to at most 900 pixels. Browsing makes no image requests to retailers or manufacturers. Lazy loading limits photo requests to the visible table, and failed images retain an explicit unavailable label. Measurements and the 51 sortable/filterable fields are unchanged.
