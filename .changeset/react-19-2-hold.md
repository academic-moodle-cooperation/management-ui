---
"@oc-mui/app-runtime": patch
"@oc-mui/i18n": patch
"@oc-mui/plugin-admin-marketplace": patch
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-upload": patch
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-testing": patch
"@oc-mui/router": patch
"@oc-mui/ui": patch
---

Hold React at `~19.2.0` (down from `^19.3.0`). React 19.3 makes the production
build roughly four times slower on WebKit (Safari, iPad) — the browser matrix
went from all-green in 2.4 min to 11 failed / 28 flaky in 10 min, bisected to
the 19.3 bump alone. `react` and `react-dom` are pinned in every package and in
the root `pnpm.overrides` so the workspace keeps resolving to a single copy;
Dependabot ignores React minors until the hold is lifted (see
`docs/reference/open-followups.md` §11). Peer ranges and public APIs are
unchanged.
