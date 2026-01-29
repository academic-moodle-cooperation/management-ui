# Production readiness checklist (open source)

Use this before tagging a release or opening the project to public contributors.

## Already in place

- **LICENSE** — Root license file present.
- **SECURITY.md** — Security policy present.
- **CONTRIBUTING.md** — Contribution guidelines present.
- **README.md** — Project overview and usage.
- **.env.example** — Example env (present; verify no secrets).
- **.gitignore** — `.local-plugins/` and build artifacts ignored.
- **Code of conduct** — CODE_OF_CONDUCT.md present.
- **CI** — `.github/workflows/test.yml` for tests.

## Recommended checks before “production ready”

### 1. No secrets or internal URLs

- [ ] Grep for API keys, tokens, internal hostnames in code and docs.
- [ ] Ensure `.env.example` has placeholders only (no real credentials).
- [ ] Confirm registry/sample URLs in docs are clearly examples.

### 2. Documentation

- [ ] README explains how to run dev, build, and (if applicable) use .local-plugins.
- [ ] COMMUNITY_PLUGIN_DEVELOPMENT.md (or equivalent) is linked from README or docs index.
- [ ] CONTRIBUTING.md describes how to add plugins and run tests.
- [ ] Any “next steps” or “ideas” docs are clearly marked as non-binding.

### 3. Build and tests

- [ ] `pnpm install` succeeds from a clean clone.
- [ ] `pnpm run build` succeeds.
- [ ] `pnpm run test` (or equivalent) passes.
- [ ] Optional: `pnpm run clean` and `pnpm run clean:plugins` work as documented.

### 4. Plugin story

- [ ] Clear split: built-in plugins (e.g. core, example-university) vs community (.local-plugins, gitignored).
- [ ] Docs state that univie/tuwien (or similar) are sample configs; real instances use .local-plugins.
- [ ] Community plugin template is documented and usable.

### 5. Dependencies and security

- [ ] `pnpm audit` (or equivalent) reviewed; critical/high issues addressed or documented.
- [ ] No unnecessary or overly permissive file/network access in configs.

### 6. Release hygiene

- [ ] Version in root `package.json` (or primary app) reflects intended release.
- [ ] CHANGELOG or release notes updated (if you maintain them).
- [ ] Tag format decided (e.g. `v1.0.0`) and applied after merge.

## Optional for “production ready” open source

- **Adopters doc** — Short “Who uses this” or “Deployment options.”
- **Architecture overview** — Link from README to ADRs or architecture docs.
- **Plugin registry** — If you run a public registry, document URL and validation rules (e.g. REGISTRY_REPOSITORY_README.md).

## Summary

You already have the usual open source basics (license, security, contributing, README, CI). Before calling the project production-ready for open source:

1. Run the checks above (secrets, docs, build, tests, plugin story, dependencies).
2. Group and commit the community-plugin changes using the commit plan (e.g. `docs/COMMIT_PLAN_COMMUNITY_PLUGINS.md`).
3. Do a final pass on README and CONTRIBUTING so new contributors know about .local-plugins and the plugin system.

After that, you’re in good shape to tag a release and treat the repo as production-ready open source.
