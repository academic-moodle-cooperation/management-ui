---
"@oc-mui/plugin-admin-marketplace-v2": patch
"@oc-mui/i18n": patch
---

A plugin trial whose app lands on a route another app already serves no longer leaves the shell on an endless loader: duplicate routes are deduplicated when the router is built (first registration wins, the collision is logged), a failed router build shows an error screen with a reload action, and the marketplace's trial banner names the route collision on the trial so "End trial" is the obvious way out.
