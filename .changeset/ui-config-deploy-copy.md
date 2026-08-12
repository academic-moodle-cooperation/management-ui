---
"@oc-mui/ui-config": patch
---

Fix the `-DdeployTo` config copy: `packages/ui-config/pom.xml` copied a
`src/config.json` that does not exist, with `failonerror="false"` — so
deployments silently ended up without the default
`etc/ui-config/mh_default_org/management-ui/config.json`. The copy now sources
the canonical shell default (`apps/shell/public/ui/config/management-ui/config.json`)
and fails the build loudly if that file is ever missing.
