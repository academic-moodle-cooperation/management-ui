# Playground

Isolated plugin development sandbox. Runs a single plugin against a minimal
standalone shell, with no other plugins loaded and with services mocked.

## Status

Skeleton only. The harness currently renders a placeholder; the mechanism to
pick a plugin and run contract/smoke tests against it in CI will land in a
later phase (see [ADR-003](../../docs/architecture/ADR-003-shell-plus-core-plugins.md)).

## Non-goals

- Not a production app. Not shipped to Opencast. No JAR is produced.
- Not the feature surface for users - that is `apps/shell`.
- Not a plugin template - see [`plugins/example/`](../../plugins/example/) and
  [`examples/community-plugin-template/`](../../examples/community-plugin-template/).

## Usage

```bash
pnpm --filter=playground dev
```
