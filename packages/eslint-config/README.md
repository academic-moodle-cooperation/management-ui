# @oc-mui/eslint-config

Shared ESLint configurations for the workspace. Every package extends one of these so the rule set stays consistent.

## Configurations

| Subpath | Extends | Use it for |
|---------|---------|------------|
| `@oc-mui/eslint-config/base` | ESLint recommended + `@typescript-eslint` recommended + Prettier + Turbo + `only-warn` | Any non-React package. |
| `@oc-mui/eslint-config/react-internal` | The base config + React + React Hooks + browser globals + auto React-version detection. | React apps and component libraries. |
| `@oc-mui/eslint-config/type-aware` | Optional type-aware rules (`no-floating-promises`, `no-misused-promises`). Requires TS type info; slower. | Packages where strict Promise handling matters. |

## Usage

```js
// eslint.config.js (non-React package)
import { config } from "@oc-mui/eslint-config/base";

export default config;
```

```js
// eslint.config.js (React app or component library)
import { config as base } from "@oc-mui/eslint-config/base";
import { config as react } from "@oc-mui/eslint-config/react-internal";

export default [
  ...base,
  ...react,
  // package-specific overrides
];
```

## What the base config enforces

- The **wrapper rule**: `no-restricted-imports` blocks direct imports of `@tanstack/react-router`, `@tanstack/react-query`, `i18next`, `react-i18next`, `jotai` — those must go through `@oc-mui/router`, `@oc-mui/query`, `@oc-mui/i18n`, `@oc-mui/store`. Each wrapper package has an explicit exception for itself.
- **Architectural boundaries** via `eslint-plugin-boundaries`: apps can import from packages and plugins; plugins from packages (and `@oc-mui/plugin-core`); packages from packages. Cross-plugin imports are caught. See the comment block in [`base.js`](./base.js) under "Known limitations" for the exact element/rule matrix.
- **GraphQL operation naming** via the custom `local/graphql-operation-naming` rule (in [`rules/`](./rules/)): every `query`/`mutation`/`subscription`/`fragment` declared in a `gql\`\`` template literal or `.graphql` file must be prefixed with the owning plugin's namespace in PascalCase (or `Mui` for shared-core code in `packages/query/`). Implements [CONTRACTS.md §6](../../docs/architecture/CONTRACTS.md#6-graphql-operation-naming).
- **No hardcoded colours** in plugin CSS — planned for Phase 4 (see [`docs/operations/open-followups.md`](../../docs/operations/open-followups.md)).

## Custom rules

Live under [`rules/`](./rules/) and are exported as a tiny local plugin. The plugin is wired in `base.js` under the name `local`, so configurations refer to rules as `local/<rule-name>`. Today only `local/graphql-operation-naming` lives here.

Run the rule tests:

```bash
pnpm --filter @oc-mui/eslint-config test
```

## Layer

Core infrastructure. Depends on nothing in the workspace.

## See also

- [`base.js`](./base.js) — the source of truth, with inline rationale comments for non-obvious rules.
- [`docs/operations/open-followups.md`](../../docs/operations/open-followups.md) §3 — known boundaries-plugin limitations and the planned v6 migration.
