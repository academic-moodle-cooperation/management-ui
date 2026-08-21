# Playground

Isolated plugin development sandbox. Runs a single plugin against a minimal
standalone shell, with no other plugins loaded.

## Status

Skeleton only. The harness currently renders a placeholder; the mechanism to
pick a plugin and run contract/smoke tests against it in CI will land in a
later phase (see [ADR-003](../../docs/reference/decisions/003-shell-plus-core-plugins.md)).

## Non-goals

- Not a production app. Not shipped to Opencast. No JAR is produced.
- Not the feature surface for users - that is `apps/shell`.
- Not a plugin template — see [`plugins/example/`](../../plugins/example/) or scaffold a new one with `pnpm create-plugin <name>`.

## Usage

```bash
pnpm --filter=playground dev
```

## See also

- [`apps/shell/`](../shell/) — the production app.
- [`packages/app-runtime/`](../../packages/app-runtime/) — the standalone/integrated dual-mode runtime the playground builds on.
- [`docs/reference/open-followups.md`](../../docs/reference/open-followups.md) §6.4 — the planned "playground as plugin runner" enhancement.
