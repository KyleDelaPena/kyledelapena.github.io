# Portfolio deployment

This repository serves the generated portfolio and both complete web demos:

- `/apps/fishing-forecaster/` — live forecast dashboard.
- `/apps/pc-service-desk/` — fictional repair/build workspace.

The `.nojekyll` file preserves Expo’s `_expo` JavaScript paths. GitHub Pages should publish from the `main` branch and repository root. No application server or database is required.

PC demo records and fishing preferences remain in visitors’ browsers under separate portfolio-only storage namespaces. The installed personal apps and customer records are not included in this deployment.

The modern editable source is delivered separately as `kyle-portfolio-source.zip`; its main generator is `scripts/build.mjs`, and web-demo source snapshots are in `integrations/`. Existing Flask source/templates are retained here as reference. Rebuild using the modern source, then copy the generated `github-pages` contents to this publishing root to update the site.
