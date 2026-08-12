# Creating a plugin

For plugin authors who have done [Your first plugin](./first-plugin.md) and want to build something real. Afterwards your plugin reads its own validated config slice, ships a translated string, and you know which reference to open for everything else.

The canonical authoring rules — manifest fields, registration rule, boundaries, pre-flight checklist — live in [`AGENTS.md`](../../AGENTS.md); stability guarantees in [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md). This page is the guided tour through them.

## Where plugins live, and the scaffold

| Location | When |
|----------|------|
| `.local-plugins/<name>/` | An org or community plugin. Its own git repo, mounted into this workspace at dev time. Gitignored. **Default.** |
| `plugins/<name>/` | A built-in plugin shipped with this repo (`--in-tree`). |

```bash
pnpm create-plugin <name> [--template <minimal|app>] [--in-tree] [--no-pom] [--no-install]
```

- `--template app` — a visible screen + sidebar entry (what [first-plugin](./first-plugin.md) uses); `minimal` (default) — an invisible `app:header-logo` placeholder that only exists so the contract test passes.
- `--no-pom` — skip the `backend/` Maven layout (for CDN-only plugins; `--in-tree` never gets one).
- `--no-install` — skip the automatic `pnpm install`.

The scaffolded layout ([`scripts/create-plugin.mjs`](../../scripts/create-plugin.mjs)):

```
my-plugin/
├── plugin.json          # Manifest 1.1 — id, namespace, extensionPoints, … (AGENTS.md has the field list)
├── package.json
├── tsconfig.json, vite.config.ts, vitest.config.ts, vitest.setup.ts, eslint.config.js, README.md
├── backend/             # Maven/JAR layout (see distribution.md)
└── src/
    ├── index.ts                  # createPlugin({ ... }) + default export
    ├── plugin.contract.test.ts   # the required contract test (scaffolded — don't hand-write it)
    └── ...
```

## The entry point — three rules

```ts
import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

export const myPlugin = createPlugin({
  namespace: "my-plugin", // kebab-case, matches plugin.json's `namespace` + `id`
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "my-app", { /* route + component */ });
  },

  activate() { /* one-time side effects only */ },
  deactivate() { /* clean them up */ },
});

export default myPlugin;
```

1. **All `registerObject` calls go in `initialize()`**, never `activate()` — the test harness re-registers between tests; registration in `activate()` makes the second test see nothing.
2. **`export default` is mandatory.** The remote loader (`.local-plugins/` and JAR plugins) registers via `module.default`. A named-only export builds fine but is silently never loaded at runtime — the scaffolded contract test's default-export assertion is what catches it.
3. **Every point you register on is declared in `plugin.json`'s `extensionPoints`.** The contract test fails on declared-but-unpopulated entries.

## Extension points

The four you'll touch most:

| Point | What you register | Example |
|-------|-------------------|---------|
| `apps:definitions` | A route + component the shell mounts under `/<routePath>` | `plugins/core-upload/src/index.ts` |
| `sidebar:nav-items` | Left-nav entry linking to it | same file |
| `app:config:defaults` | Your config slice's defaults (registered via `definePluginConfig` — next section) | `plugins/core-*/src/config.ts` |
| `app:header-logo` | `{ src, alt, href, width, height }` — the minimal scaffold's placeholder; **not rendered by the default shell**, so swap it for `apps:definitions` for anything visible | `plugins/example/` |

Worth knowing about `apps:definitions` (`AppDefinition` in [`appTypes.ts`](../../packages/plugin-system/src/appTypes.ts)): besides the required `{ id, name, routePath, component }` it takes `requiredRoles?: string[]` — when set, the shell mounts the app only for users holding at least one listed role, everyone else gets an access-denied screen. Nested routes like `/reports/:id` work automatically (the shell adds a `$routeSubPath` child route); read the param with `useParams({ strict: false })`.

The full list — header actions, footer slots, table-row detail panels, the ACL/metadata editors — is in [`plugins/core/README.md`](../../plugins/core/README.md).

<a id="configuration"></a>

## A config slice your deployment can override

Continuing the `hello` plugin from [first-plugin](./first-plugin.md). A plugin owns one slice of the app config at `config.plugins.<id>`, declared once with a Zod schema. Never read another plugin's slice, or your own via raw `config.plugins[...]` — always go through the reader.

The scaffold doesn't include the config dependencies; add them first:

```bash
pnpm --filter @oc-mui/plugin-hello add zod "@oc-mui/query@workspace:*"
```

Declare the slice:

```ts
// src/config.ts
import { z } from "zod";
import { definePluginConfig } from "@oc-mui/query";

const schema = z.object({
  greeting: z.string().optional(),
});

export const helloConfig = definePluginConfig({
  id: "hello", // matches plugin.json `id`
  schema,
  defaults: { greeting: "Hello from the defaults" },
});
```

Register its defaults in `initialize()` and declare the point in `plugin.json`:

```ts
// src/index.ts, inside initialize(manager):
helloConfig.register(manager); // populates app:config:defaults
```

```jsonc
// plugin.json
"extensionPoints": ["apps:definitions", "sidebar:nav-items", "app:config:defaults"]
```

Read it in the component — `use()` in React, `read(config)` outside:

```tsx
// src/HelloPage.tsx
import { helloConfig } from "./config";

export function HelloPage() {
  const cfg = helloConfig.use();
  return <h1 className="text-2xl font-semibold text-foreground">{cfg.greeting}</h1>;
}
```

Rebuild (`pnpm --filter @oc-mui/plugin-hello build`), reload: the page shows *"Hello from the defaults"*. Now put a deployment override in the served `config.json` (same file where you enabled the plugin):

```jsonc
// apps/shell/public/ui/config/management-ui/config.json (top-level "plugins" key)
"plugins": { "hello": { "greeting": "Hello from config.json" } }
```

Reload — the heading changes. That's the whole model: defaults from the plugin, overrides from the deployment, validated by your schema (invalid values log a warning and fall back to defaults). Full layer model: [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md).

## A translated string

Locale files live per namespace; the namespace is declared in the manifest and referenced through `usePluginTranslation`:

```bash
pnpm --filter @oc-mui/plugin-hello add "@oc-mui/i18n@workspace:*"
mkdir -p .local-plugins/hello/locales/hello
```

```jsonc
// locales/hello/en.json
{ "subtitle": "This line is translated." }
```

```jsonc
// locales/hello/de.json
{ "subtitle": "Diese Zeile ist übersetzt." }
```

```jsonc
// plugin.json
"i18nNamespaces": ["hello"],
```

```tsx
// in HelloPage.tsx
import { usePluginTranslation } from "@oc-mui/i18n";
const { t } = usePluginTranslation(["hello"]); // auto-loads the namespace
// …
<p className="text-muted-foreground">{t("hello:subtitle")}</p>
```

Run the contract test — the key-parity check now covers your locales (delete the key from `de.json` and it fails, naming the namespace and the missing key).

One dev-loop note, covered in depth in [i18n](./i18n.md): i18next loads namespaces once, so **restart `pnpm dev` after adding or renaming keys**.

## Styling, testing, GraphQL — the reference pages

- **Styling**: semantic tokens and shared `@oc-mui/ui` components only — no hardcoded colors (lint-enforced), no `!important`, dark mode comes free if you comply. Rules + full token table: [styling.md](./styling.md).
- **Testing**: the contract test is required and mechanical; unit tests go next to the code. What to cover and how to run it: [testing.md](./testing.md).
- **GraphQL**: every operation and fragment is prefixed with your namespace in PascalCase (`MyPluginGetThings`) — enforced by the `local/graphql-operation-naming` lint rule. Rules + examples: [`CONTRACTS.md` § 6](../architecture/CONTRACTS.md#6-graphql-operation-naming).

## The dev loop, compressed

```bash
pnpm --filter @oc-mui/plugin-hello dev    # rebuild the bundle on change (watch mode)
pnpm dev                                  # the shell — serves + loads .local-plugins/*/dist/
```

In-tree plugins skip the plugin build — the shell's Vite build compiles them directly.

## Shipping

Before a PR (in-tree) or a release (org/community): work through the pre-flight checklist in [`AGENTS.md`](../../AGENTS.md#tldr--pre-flight-checklist) and run `pnpm verify`. Note that `verify` excludes `.local-plugins/` — run your org plugin's own `test` / `test:contract` scripts separately.

Then pick a delivery path — dev mount, in-tree, JAR next to Opencast, or CDN: [Distribution](./distribution.md).
