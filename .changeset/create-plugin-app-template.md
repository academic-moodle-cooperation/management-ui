---
---

Add a `--template` option to `pnpm create-plugin` so you can scaffold a
**visible** starter instead of the inert default.

- `--template minimal` (default, unchanged): the `app:header-logo`
  placeholder — passes the contract test but the shell renders nothing,
  which made "is my plugin even loading?" needlessly confusing.
- `--template app`: a real screen + sidebar entry — registers
  `apps:definitions` (a route + page component mounted at `/<name>`) and
  `sidebar:nav-items` (the left-nav link). Renders in dev **and**
  production, so you see your plugin immediately.

Implemented as a small overlay (`scripts/templates/create-plugin-app/`)
copied on top of the shared base — only `package.json` (adds
`lucide-react`), `plugin.json` (`type: app` + the two extension points),
`src/index.ts`, and the page component differ; the generic contract test
is reused. The scaffolder also now substitutes placeholders in file
*names*, so the page lands as `src/<PascalName>Page.tsx`.

Verified: `create-plugin x --template app` → check-types, build, and
`test:contract` (5/5) all pass; the default `minimal` path is unchanged.

Scaffold tooling only — empty changeset.
