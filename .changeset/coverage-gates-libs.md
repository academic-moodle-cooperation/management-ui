---
"@oc-mui/i18n": patch
"@oc-mui/query": patch
"@oc-mui/router": patch
"@oc-mui/ui": patch
---

Add no-regression coverage thresholds to `vitest.config.ts` (dev-only). Floors
sit a few points below current coverage so a real drop fails `pnpm test:coverage`
(and the CI unit job), extending the ratchet already on `utils`/`plugin-system`/
`store` toward the 80% lib target.
