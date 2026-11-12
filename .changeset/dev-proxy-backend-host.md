---
"@oc-mui/vite-config": patch
---

Dev proxy: requests to `VITE_PROXY_TARGET` now carry the backend's own host name (`changeOrigin`) and redirects are rewritten back to the dev server (`autoRewrite`). A multi-tenant Opencast resolves the organisation strictly by the Host header and answered 404 for every proxied request before.
