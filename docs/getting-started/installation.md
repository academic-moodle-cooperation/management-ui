# Installation

Getting Management UI running locally.

## Prerequisites

- **Node.js** ≥ 20 (LTS recommended).
- **pnpm** ≥ 10.4.1. Install with `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate`.
- A reachable **Opencast** instance (real or stubbed) if you want full functionality. For initial poking-around the shell boots fine with mocked endpoints.

## Clone & install

```bash
git clone https://github.com/academic-moodle-cooperation/management-tool.git
cd management-tool
pnpm install
pnpm build         # one-time — builds dist-types/ for upstream workspace packages
```

The first build populates the `dist-types/` directories that downstream packages need for type-checking. After that, you can iterate without re-running `pnpm build`.

## Run the shell

```bash
pnpm dev
```

Opens the shell at **http://127.0.0.1:3000/management-ui/**. The Vite dev server hot-reloads everything; the plugin loader picks up changes in `plugins/<name>/dist/` and `.local-plugins/<name>/dist/`.

## Configure the backend

The shell reads `apps/shell/public/config.json` at boot. The shipped default expects backend endpoints to be proxied to a local Opencast instance. For a real backend, point `vite.config.ts`'s proxy targets at your Opencast host — the helper lives in [`@oc-mui/vite-config/proxy`](../../packages/vite-config/src/proxy.ts).

For development without a backend, the Playwright smoke test in `tests/e2e/smoke.spec.ts` shows the minimal set of endpoints to stub (`config.json`, `plugins.json`, `/info/me.json`, `/graphql`).

Configuration model details: [`configuration.md`](./configuration.md).

## Verify the install

```bash
pnpm verify
```

Runs the full local gate (lint → check-types → build → unit → contract → api-check → Playwright smoke). About 90 turbo tasks. If this passes you have a working tree.

## Common commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run the shell at :3000 (and the playground at :3001 if configured). |
| `pnpm verify` | Full local pre-push gate. |
| `pnpm test` | Unit tests across all packages. |
| `pnpm test:contract` | Plugin contract tests. |
| `pnpm test:e2e` | Playwright smoke against the shell. |
| `pnpm api-check` | Regenerate `etc/*.api.md` snapshots. |
| `pnpm create-plugin <name>` | Scaffold an org/community plugin under `.local-plugins/<name>/`. |
| `pnpm create-plugin <name> --in-tree` | Scaffold a built-in plugin under `plugins/<name>/`. |
| `pnpm changeset` | Add a release-note entry for your change. |

## What's at `.local-plugins/`?

Empty by default. Each `.local-plugins/<org>/` is its own git repository — orgs clone theirs in to develop alongside the shell. The directory is gitignored from this repo.

To mount one: `git clone <your-org-plugin> .local-plugins/<org-name>`, then `pnpm install` from the workspace root. The shell's local-plugins manifest will pick it up at next boot.

## Trouble?

- **`pnpm install` fails complaining about workspace deps.** You're likely on an old pnpm. `corepack prepare pnpm@latest --activate` and retry.
- **Vite can't find `@oc-mui/...`.** Ensure `pnpm build` ran at least once.
- **CI passes but local fails.** Run `pnpm verify` from a clean tree (`git clean -fdx node_modules dist dist-types .turbo`) then `pnpm install` then `pnpm verify` again.

## See also

- [`configuration.md`](./configuration.md) — the config model.
- [`upgrading.md`](./upgrading.md) — moving between versions.
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — dev workflow.
- [`docs/operations/ci.md`](../operations/ci.md) — what `pnpm verify` mirrors.
