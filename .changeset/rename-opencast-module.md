---
---

Rename the internal Opencast Maven module identity from `management-tool` to `management-ui`: the reactor-root artifactId (and its sub-aggregator `<parent>` references) plus the human display names (`<name>`/`<description>`, the Karaf feature description/`<details>`, and the plugin endpoint's `service.description`). Build-metadata only — the deployed OSGi bundles were already `management-ui-*`, the Karaf feature is already `opencast-management-ui`, and the HTTP serving path (`/management-tool/ui/config`) is intentionally left unchanged — so there is no runtime or API change and no release is required.
