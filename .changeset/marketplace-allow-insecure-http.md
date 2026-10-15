---
"@oc-mui/plugin-admin-marketplace": minor
---

`remotePlugins.allowInsecureHttp` — deployment opt-out from the HTTPS requirement for remote plugin URLs.

Default stays false (HTTPS required in production builds). Meant for deployments that themselves run without TLS (test boxes, intranet installs), where the page is plain HTTP anyway and the requirement only blocks the feature without adding protection. The domain allowlist still applies.
