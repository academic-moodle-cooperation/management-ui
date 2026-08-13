# Testing a plugin

For plugin developers. Afterwards you'll have the required contract test and your own unit tests running for your plugin.

This is the plugin author's slice. The full strategy — pyramid, unit/contract/E2E split, CI gates — lives in [Testing](../contribute/testing.md).

## The required test

Every plugin ships **one contract test** at `src/plugin.contract.test.ts`. It is mechanical — `pnpm create-plugin` writes it for you, and the only things that change between plugins are the import line and the `describe` label.

```bash
pnpm --filter @oc-mui/plugin-my-plugin test:contract
```

The harness boots a minimal `PluginManager`, runs your plugin's `initialize()` and `activate()`, and checks that:

- Activation completes without throwing.
- Every extension point declared in `plugin.json`'s `extensionPoints` array is actually populated.
- Activation produces no `console.error` or `console.warn`.
- All declared i18n locales have matching key sets.

The scaffolded test adds a fifth assertion of its own (not a harness check): the plugin must be the module's **default export**, because the remote loader registers via `module.default`.

Drift between `plugin.json` and `initialize()` is caught here — the most common failure mode.

Full assertion API: [`@oc-mui/plugin-testing`](../../packages/plugin-testing/README.md).

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
pnpm --filter @oc-mui/plugin-my-plugin test
```

The test environment is whatever your plugin's `vitest.config.ts` sets — the scaffold defaults to `node`; switch to `jsdom` (and add it as a dev dependency) for DOM-rendering component tests. Mock external services; don't hit a real backend from a unit test.

## What to test in a plugin

- **Extension-point registrations** — at least one assertion per non-trivial registration (the contract test covers existence; cover content if it's nontrivial).
- **Pure utility functions** — formatters, parsers, validators.
- **Components** — render and assert on output. Reach for [Testing Library](https://testing-library.com/docs/) idioms.
- **Configuration schema** — round-trip valid + invalid configs through your Zod schema.

You don't need to test:

- Code from `@oc-mui/*` packages — they have their own tests.
- The shell's routing, config-merge, or manifest validation — covered by core unit + contract tests.

## End-to-end

E2E specs live in `tests/e2e/` and run against the shell with a mocked backend. They're owned by the core repo, not by individual plugins. If your plugin needs E2E coverage of a real user flow, propose it in your PR — we'll wire up a spec.

## CI

Locally, `pnpm verify` runs the canonical pre-push gate — the pipeline is documented once in [`AGENTS.md` → Pre-push gate](../../AGENTS.md#pre-push-gate--pnpm-verify). Run it before pushing.

## See also

- [Testing](../contribute/testing.md) — the canonical test strategy.
- [`packages/plugin-testing/README.md`](../../packages/plugin-testing/README.md) — full harness API reference.
- [`AGENTS.md` → Contract test](../../AGENTS.md#contract-test--required-mechanical) — the canonical template.
