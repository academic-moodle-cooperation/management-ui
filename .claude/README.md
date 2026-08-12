# Claude Code configuration

This directory makes [Claude Code](https://claude.com/claude-code) a first-class
contributor to this repo. It is **public and committed** (`.claude/` is not gitignored),
so treat it like any other source: no secrets, and keep it in sync with the project rules.

It deliberately does **not** restate the project conventions. The single source of truth
for how to work in this repo is [`AGENTS.md`](../AGENTS.md) (agents) and
[`CONTRIBUTING.md`](../CONTRIBUTING.md) (humans). Everything here either points at those or
automates a step they describe. [`../CLAUDE.md`](../CLAUDE.md) is intentionally thin — its
first line imports `AGENTS.md`.

## Layout

```
.claude/
├── settings.json                  Permissions + hook registrations (committed, shared)
├── hooks/
│   ├── session-start.sh           Install deps if missing; load a command cheat-sheet
│   ├── protect-generated.sh       Block hand-edits to generated files (PreToolUse)
│   └── post-edit-lint.sh          eslint --fix the edited .ts/.tsx (PostToolUse)
├── commands/
│   ├── verify.md                  /verify  → pnpm verify (the pre-push gate)
│   └── new-plugin.md              /new-plugin <name> → pnpm create-plugin + AGENTS.md wiring
├── skills/
│   └── pre-flight-check/SKILL.md  Model-invoked AGENTS.md pre-flight checklist ("before done")
├── agents/
│   └── plugin-boundary-reviewer.md  Read-only boundary/contract/changeset reviewer
└── README.md                      This file
```

## Hooks

All three are registered in `settings.json` and invoked via `$CLAUDE_PROJECT_DIR`, so they
work regardless of the current directory.

| Hook | Event | What it does | Blocking? |
|---|---|---|---|
| `session-start.sh` | `SessionStart` | Runs `pnpm install --frozen-lockfile` **only if** `node_modules/` is missing, then emits a command cheat-sheet as `additionalContext`. | No |
| `protect-generated.sh` | `PreToolUse` (Edit/Write/MultiEdit/NotebookEdit) | Denies edits to `dist/`, `dist-types/`, `target/`, `*.tsbuildinfo`, `pnpm-lock.yaml`, `packages/*/etc/*.api.md`, and GraphQL codegen output, pointing at the regen command (exit 2). | Yes |
| `post-edit-lint.sh` | `PostToolUse` (Edit/Write/MultiEdit) | `eslint --fix` on the edited `.ts`/`.tsx`. Exit 1 (findings) → surfaced; exit 2 (eslint crash) → silent. | No |

ESLint isn't a root dependency (it runs per-package via turbo), so `post-edit-lint.sh`
invokes the binary shipped with `@oc-mui/eslint-config` and runs it from the repo root,
where the flat config (`eslint.config.mjs`) and its plugins resolve. Because the config
uses `eslint-plugin-only-warn`, rule violations are warnings (exit 0), so in practice the
hook is a **silent auto-fixer** — the blocking lint gate stays `pnpm lint` / `pnpm verify`,
which this hook deliberately does not duplicate.

## Commands vs. skills vs. subagent

- **Commands** (`commands/*.md`) are **developer-typed**: `/verify`, `/new-plugin`.
- **Skills** (`skills/*/SKILL.md`) are **model-invoked** — Claude runs `pre-flight-check`
  on its own when it's about to declare a plugin/package change done.
- **Subagent** (`agents/*.md`) — `plugin-boundary-reviewer` is read-only (`Read`, `Grep`,
  `Glob`) and runs proactively after plugin work or on request ("review plugin boundaries").

## What is intentionally NOT here

- **No `.mcp.json`** — no hosted/OAuth MCP server is in use by this project; headless CI
  sessions can't complete interactive logins, so none is committed.
- **No changeset** for this config — the changeset rule ([`AGENTS.md`](../AGENTS.md)) covers
  versioned packages under `packages/*` and `plugins/*`; `.claude/` and the root
  `CLAUDE.md` are not packages, so changes here need none.
- **No new CI job** — the gates already run in GitHub Actions (`.github/workflows/`).
  The JAR/Maven path is driven by `pom.xml` + `mvnw` and verified locally via
  `scripts/verify-jar-deploy.sh`; GitHub CI does not build JARs. This layer mirrors
  `pnpm verify` locally rather than adding a job that would double-run.

## Extending this

- Add a developer shortcut → a new `commands/<name>.md`.
- Add an automatic "Claude should always do X" behavior → a new `skills/<name>/SKILL.md`
  (model-invoked) or a hook in `settings.json` (deterministic).
- Keep `CLAUDE.md` thin: link into `AGENTS.md`/`docs/`, don't copy them.
- Verify any hook change by piping a sample tool payload into the script (see the header
  comment in each hook for its exit-code contract).
