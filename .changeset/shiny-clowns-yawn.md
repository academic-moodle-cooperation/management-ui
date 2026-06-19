---
---

Two follow-ups surfaced by Section 1 of the test protocol on a fresh
clone.

**1) `pnpm verify` blew up before doing anything when `.local-plugins/`
didn't exist.** The script's `--filter='!./.local-plugins/*'` requires
turbo to resolve the path on disk even though we're excluding it.
Fresh clones don't have the directory because it's gitignored. Fix:
prepend `mkdir -p .local-plugins` so the script self-heals.

**2) `pnpm build` emitted three "no output files found" warnings** for
`@oc-mui/plugin-core-{episodes,series,upload}#build`. The three core
feature plugins are library-shaped — they re-export source from
`index.ts` and their build script is just an `echo`. The default
`build` task in `turbo.json` declares `outputs: ["dist/**"]`, which
turbo then can't satisfy. Same pattern `@oc-mui/plugin-admin-marketplace`
already uses: add per-package overrides declaring `outputs: []`. Three
new entries in `turbo.json`'s tasks block.

No package code touched; both fixes are infrastructure. Empty
changeset records the build-tooling nature of the change.

The third bit of noise from `pnpm verify` — repeated
`[boundaries][warning]: [boundaries/dependencies] Detected legacy
selector/template syntax …` lines — is not fixable on our side. It's
already documented in `docs/operations/open-followups.md` §3.2 (the v5
→ v6 selector migration is blocked on the upstream
`eslint-plugin-boundaries` schema accepting the new shape) and §7.2
(the warnings are plugin stderr lines, not ESLint warnings — they do
not trip `--max-warnings 0` and CI stays green). Until upstream lands
the schema fix there's nothing to suppress without bypassing the rule.
