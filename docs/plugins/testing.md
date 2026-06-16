# Testing a plugin

The full testing strategy — pyramid, unit/contract/E2E split, CI gates — lives in [`operations/testing.md`](../operations/testing.md). This page is the plugin-author's version: what *you* need to write for your plugin, and how to run it.

## The required test

Every plugin ships **one contract test** at `src/plugin.contract.test.ts`. It is mechanical — `pnpm create-plugin` writes it for you, and the only line that changes between plugins is the import.

```bash
pnpm --filter @opencast-mui/plugin-my-plugin test:contract
```

The harness boots a minimal `PluginManager`, runs your plugin's `initialize()` and `activate()`, and checks that:

- Activation completes without throwing.
- Every extension point declared in `plugin.json`'s `extensionPoints` array is actually populated.
- Activation produces no `console.error` or `console.warn`.
- All declared i18n locales have matching key sets.

Drift between `plugin.json` and `initialize()` is caught here — the most common failure mode.

Full assertion API: [`@opencast-mui/plugin-testing`](../../packages/plugin-testing/README.md).

## Unit tests

Anything that is not a contract or an end-to-end flow goes in a unit test next to the code:

```
src/
├── views/
│   ├── Dashboard.tsx
│   └── Dashboard.test.tsx   ← here
└── lib/
    ├── format.ts
    └── format.test.ts
```

Run them with:

```bash
pnpm --filter @opencast-mui/plugin-my-plugin test
```

The default environment is jsdom. Mock external services; don't hit a real backend from a unit test.

## What to test in a plugin

- **Extension-point registrations** — at least one assertion per non-trivial registration (the contract test covers existence; cover content if it's nontrivial).
- **Pure utility functions** — formatters, parsers, validators.
- **Components** — render and assert on output. Reach for [Testing Library](https://testing-library.com/docs/) idioms.
- **Configuration schema** — round-trip valid + invalid configs through your Zod schema.

You don't need to test:

- Code from `@opencast-mui/*` packages — they have their own tests.
- The shell's routing, config-merge, or manifest validation — covered by core unit + contract tests.

## End-to-end

E2E specs live in `tests/e2e/` and run against the shell with a mocked backend. They're owned by the core repo, not by individual plugins. If your plugin needs E2E coverage of a real user flow, propose it in your PR — we'll wire up a spec.

## CI

Locally, `pnpm verify` runs the full suite (unit, contract, API check, Playwright smoke) — same as CI. Run it before pushing.

## See also

- [`operations/testing.md`](../operations/testing.md) — the canonical test strategy.
- [`packages/plugin-testing/README.md`](../../packages/plugin-testing/README.md) — full harness API reference.
- [`AGENTS.md` → Contract test](../../AGENTS.md#contract-test--required-mechanical) — the canonical template.
