---
"@oc-mui/ui": patch
---

`DefaultLandingPage`: point the documentation links at the rebuilt docs site. The
"get started", installation, configuration and plugin-authoring links pointed at
site routes that no longer exist (`/getting-started/*`, `/plugins/*`) and now
resolve to `/what-is-management-ui`, `/operate/install`, `/operate/configure`
and `/extend/first-plugin`.
