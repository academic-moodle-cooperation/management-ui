# Configuration

Quick reference for what the shell reads, where each piece comes from, and how plugins consume their slice. The full layer model with merge rules and edge cases lives in [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — this page is the practical version.

## The shape

```jsonc
{
  "app": {
    "theme": "default",
    "locale": "en",
    "enabledPlugins": ["core", "episodes", "series", "upload", "admin", "config"]
  },
  "auth": {
    "loginUrl": "/Shibboleth.sso/Login?target=/management-ui/",
    "logoutUrl": "/Shibboleth.sso/Logout?return=/management-ui/",
    "loginUrlDev": "/j_spring_security_login",
    "logoutUrlDev": "/j_spring_security_logout"
  },
  "plugins": {
    "episodes": { "protection": { "public": false } },
    "series":   { "seriesTable": { "createSeries": { "enabled": false } } },
    "upload":   { "workflowId": "schedule-and-upload", "whitelist": ["mp4", "mov", "mkv"] }
  }
}
```

- **`app.*`** — top-level shell settings. Stable keys: `theme`, `locale`, `enabledPlugins`, plus the branding keys `HtmlDocumentTitle`, `logoUrl`, `orgLogoUrl`, `faviconUrl` (see [Branding](#branding-favicon-and-title)).
- **`app.enabledPlugins`** — the **ship filter**. Only namespaces listed here load at all. To prevent a plugin from running, remove its namespace. Keep `config` in the list — that is the namespace under which `.local-plugins/config/` loads the org config overlay described [below](#where-the-host-config-file-comes-from).
- **`auth.*`** — where the shell sends users to log in / out. See [Authentication](#authentication).
- **`plugins[id]`** — per-plugin slice. Each plugin owns the sub-shape; the shell just persists it. The three slices above are real examples — the full schemas live in [`plugins/core-episodes/src/config.ts`](../../plugins/core-episodes/src/config.ts), [`core-series/src/config.ts`](../../plugins/core-series/src/config.ts), and [`core-upload/src/config.ts`](../../plugins/core-upload/src/config.ts).
- **`plugins[id].enabled: false`** — the **runtime switch**. The plugin loads but skips activation. Use this when you want a plugin available but currently off.

A few more top-level keys exist beyond `app`, `auth`, and `plugins` — the authoritative shape is [`packages/ui-config/src/types.ts`](../../packages/ui-config/src/types.ts):

| Key | What it does |
| --- | --- |
| `productionConfigUrl` | Where the shell fetches `config.json` from (read from the baked-in defaults, see [below](#where-the-host-config-file-comes-from)). |
| `productionAppPluginUrl` | Where the shell fetches the deployed-plugin manifest (`plugins.json`). |
| `downloadBaseUrl` | Optional base URL for media downloads. |
| `matomo` | Matomo analytics settings (`enabled: false` by default). |
| `api` | API endpoints: `baseUrl`, `graphqlEndpoint`. |

## Authentication

The shell does **not** implement an identity provider. It only needs to know **where to send users** to authenticate; the backend (Opencast) does the actual enforcement and IdP wiring. So auth is configured in two places:

| Layer | Responsibility | Where |
| --- | --- | --- |
| **Backend** | *Which* method is enforced + the IdP integration (Shibboleth, OpenID Connect, CAS, JWT, LDAP, AAI, LTI — each a `security-*` Opencast module) | `etc/security/mh_default_org.xml` — see the [Opencast security docs](https://docs.opencast.org/). Not part of this repo. |
| **Frontend (here)** | *Where* to send users to start login / logout | `auth.*` in `config.json` |

### The `auth` fields

| Field | Meaning |
| --- | --- |
| `loginUrl` | Where to send users to log in (production). |
| `logoutUrl` | Where to send users to log out (production). |
| `loginUrlDev` | Optional dev override, used when running `pnpm dev`. Falls back to `loginUrl` if unset. |
| `logoutUrlDev` | Optional dev override for logout. |

### How the shell picks a login UX

The `/login` route inspects the effective login URL and chooses automatically:

- **Password backends (Spring form login).** If the URL targets `j_spring_security_*` (e.g. `loginUrlDev: "/j_spring_security_login"`), the shell renders its **own themed login form** and POSTs the credentials to `/j_spring_security_check`, then returns the user to wherever they were headed. This avoids Opencast's `/login.html` (whose post-login redirect lands on the role-based welcome page — the Opencast admin — rather than back in the management UI).
- **External IdP (SSO).** Any other URL (e.g. `loginUrl: "/Shibboleth.sso/Login?target=/management-ui/"`) is treated as an external IdP: the shell does a full-page redirect to it **verbatim**. Encode the post-login return target **inside** the URL using whatever param your IdP expects — Shibboleth's `target=`, OIDC's `redirect_uri`, CAS's `service=`, and so on. The shell does not append its own return param.

> **Note:** After an SSO login the user returns to the static `target` you configured (typically the app root), not the exact deep route they first requested. Deep-link return after SSO would require per-IdP return-param support and is a tracked follow-up. Password-form login *does* return to the exact route.

### Choosing your org's method

1. Configure the auth method in the **backend** (`mh_default_org.xml` + the relevant `security-*` module). This is an Opencast deployment decision.
2. Set `auth.loginUrl` / `logoutUrl` in your `config.json` to match — point them at your IdP's entry/exit endpoints (with the return target encoded in), or at the Spring endpoints for password login.

Orgs typically ship these overrides in a tiny `.local-plugins/<org>-config/` plugin that registers an `app:config` overlay (see [below](#where-the-host-config-file-comes-from)), so they don't have to edit the bundled `config.json`.

## Where values come from (merge order)

```
app:config:defaults     ← plugin defaults (via app:config:defaults extension point)
       ⊕
base config             ← defaultConfig (baked into @oc-mui/ui-config)
                           ⊕ the fetched config.json (see below)
       ⊕
app:config              ← config plugin's overlay (via app:config extension point)
```

Higher in the list = lower precedence. The `app:config` overlay wins, so an org config plugin can override anything in `config.json`, and `config.json` can override plugin defaults.

Plugin defaults are contributed through `definePluginConfig({ id, schema, defaults })` from `@oc-mui/query` — see [`packages/query/`](../../packages/query/).

## Reading config

### In a plugin component

```ts
import { episodesConfig } from "./config";

const cfg = episodesConfig.use();   // reactive, validated slice
cfg.protection?.public;
```

### In non-React code

```ts
const cfg = episodesConfig.read(config);  // validate a given AppConfig snapshot
```

`read` takes the merged `AppConfig` (or `undefined`, in which case it returns the plugin's defaults) — use it in route loaders or bootstrap code that already holds a config object.

### Reading the merged app config

```ts
import { useAppConfig } from "@oc-mui/query";

const { config } = useAppConfig();
const theme = config.app.theme;
```

Do **not** read another plugin's slice (`config.plugins["other-plugin"]`) — direct cross-slice reads bypass validation and break slice ownership. A lint rule for this is planned but not yet in place; until it lands, treat direct reads as a review-time red flag (see [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md)).

## Writing your own plugin config

```ts
import { z } from "zod";
import { definePluginConfig } from "@oc-mui/query";

const schema = z.object({
  apiEndpoint: z.url(),
  pageSize: z.number().int().positive(),
});

export const myPluginConfig = definePluginConfig({
  id: "my-plugin",
  schema,
  defaults: { apiEndpoint: "https://example.org/api", pageSize: 20 },
});
```

Then register the defaults so they flow into the merge — in your plugin's `initialize()`, like the core plugins do (e.g. [`plugins/core-episodes/src/index.ts`](../../plugins/core-episodes/src/index.ts)):

```ts
myPluginConfig.register(manager);
```

The Zod schema validates the slice at read time. The deployment's slice is deep-merged **on top of your defaults** first (objects merge per key; arrays replace wholesale), then parsed. **On validation failure the shell does not error out**: it logs a console warning — `plugin:<id> config validation failed; falling back to defaults` — and silently uses the plugin's defaults. After changing a deployment's `config.json`, open the browser console and check for these warnings; a typo'd slice otherwise just looks like your change "didn't take".

## Metadata fields: which ones show, which ones save

Two independent layers decide what happens to a metadata field (event or series), and they answer **different questions**:

| Layer | Question it answers | Where it is configured |
| --- | --- | --- |
| **UI config** (`plugins.episodes.episodeInfo.metadata`, `plugins.series.seriesInfo.metadata`) | *Should this deployment display/edit the field in the UI?* | `config.json` — a display preference per field |
| **Opencast catalog policy** (`etc/org.opencastproject.ui.metadata.CatalogUIAdapterFactory-*.cfg`, per organization) | *Does the backend accept this field as input at all?* | The Opencast host — **not** part of this repo |

### The UI-config layer

Each entry pairs a field id with `show` and `readonly`:

```jsonc
"plugins": {
  "episodes": {
    "episodeInfo": {
      "metadata": [
        { "title":    { "show": true,  "readonly": false } },
        { "location": { "show": true,  "readonly": true  } },  // display, never edit
        { "source":   { "show": false, "readonly": false } }   // hide entirely
      ]
    }
  }
}
```

- **`show: false`** removes the field from the info panel.
- **`readonly: true`** displays the field but disables editing.
- **Both keys are required** on every entry — `{ "show": false }` alone fails
  validation, and a failed validation silently reverts the whole slice to the
  plugin's defaults (watch the browser console, see
  [above](#writing-your-own-plugin-config)).
- **The `metadata` array replaces the default list wholesale.** Omitting keys
  and falling back to defaults only works for *object* config (merged per
  key); inside arrays there is no per-item merging. If you set `metadata` at
  all, list every field you want shown, in the order you want. The full
  default field lists live in
  [`plugins/core-episodes/src/config.ts`](../../plugins/core-episodes/src/config.ts) /
  [`core-series/src/config.ts`](../../plugins/core-series/src/config.ts).

### The catalog-policy layer

Opencast derives its GraphQL metadata **input types per organization** from the
catalog UI adapter config: a property with `property.<x>.readOnly=true` there is
**excluded from the input type** (`CommonEventMetadataInput` /
`CommonSeriesMetadataInput`), and GraphQL rejects unknown input fields hard. This is
the *enforcing* layer — typical use: an org pins `creator` (legal requirement) or
`location` (set automatically by the capture pipeline).

**The UI adapts to this automatically.** The edit forms read each field's per-org
`readOnly` flag from the backend and additionally introspect the input type once per
session, so fields the org has made read-only are displayed but never submitted, and
the create-series dialog hides fields the org does not accept. You do **not** have to
mirror the catalog policy in the UI config — before this behaviour existed, a
mismatch between the two layers made every metadata save fail with a
`ValidationError` (#278/#280).

So in practice:

- To hide or lock a field **for one deployment's UI** → UI config.
- To make a field **non-writable, org-wide, enforced by the backend** → catalog
  config on the Opencast host. The UI follows along; adding the UI-config
  `readonly` on top is optional and purely cosmetic.
- On a multi-tenant server the catalog config is **per organization** — the same
  field can be writable for one org and locked for another, and the UI resolves
  this at runtime per session.

## Where the host config file comes from

The shell fetches it on boot from `productionConfigUrl` (default `/ui/config/management-ui/config.json`). That URL comes from the **baked-in** `defaultConfig` in `@oc-mui/ui-config` — not from the fetched file itself, so a deployment cannot relocate its own config path via `config.json`. What answers the request depends on where you're running:

| Context | What serves `config.json` |
| --- | --- |
| **Production** | Opencast's ui-config endpoint serves the file from the Opencast host at `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json` (URL: `/ui/config/management-ui/config.json`). Deployments edit or replace that file in place; no rebuild required. |
| **Dev, no backend** (`pnpm dev`) | The dev server serves the committed `apps/shell/public/ui/config/management-ui/config.json` at that exact path. **Edit it and reload to test config changes — no backend needed.** |
| **Dev, with backend** (`VITE_PROXY_TARGET=… pnpm dev`) | The request is proxied to that backend, so you exercise the backend's real `config.json`. The committed local file is not used. |
| **Dev, backend + local config override** (`VITE_PROXY_TARGET=… VITE_LOCAL_CONFIG=true pnpm dev`) | The committed local file is served for `config.json`, but **everything else** (GraphQL, auth, uploads, …) still hits the backend. Lets you tweak theme / `enabledPlugins` / plugin slices against real data before changing the backend's config. |

> `VITE_LOCAL_CONFIG` only affects the config path; all other endpoints follow `VITE_PROXY_TARGET`. Restart the dev server after changing either (env is read once at startup).

Anything the file omits falls back to `defaultConfig` in [`@oc-mui/ui-config`](../../packages/ui-config/), and plugins contribute their own slice defaults at runtime — so the file only needs to carry what a deployment actually overrides.

Orgs typically ship a tiny `.local-plugins/<org>-config/` plugin that registers an `app:config` overlay instead of editing a JSON file — this lets them override values across deployments and wins over `config.json` (see the merge order above).

## Branding: favicon and title

Two `app.*` keys control the browser tab:

- **`app.faviconUrl`** — default `"assets/favicon/favicon.svg"`. Note this is a
  **relative** URL, resolved against the app's base path. At runtime the shell
  removes any existing favicon links and injects two: the configured SVG plus
  an `.ico` link derived from the same URL (`.svg` → `.ico`) as a fallback for
  browsers without SVG-favicon support — so if you ship a custom favicon,
  place both files next to each other.
- **`app.HtmlDocumentTitle`** — the document title. Required in the config
  type, but the runtime falls back to `"Management UI"` if it's empty. In dev
  mode (`pnpm dev`) the title gets a `[DEV] ` prefix.

Both are applied dynamically once the config loads (see
[`apps/shell/src/main.tsx`](../../apps/shell/src/main.tsx)), so orgs can
rebrand without rebuilding — either in the host's `config.json` or via an
`app:config` overlay plugin.

## Theme & locale

- **`app.theme`** picks a theme by name. The shell resolves `<name>.css` from the shipped showcase themes (`apps/shell/public/plugins/themes/`), an org theme in `.local-plugins/<name>/themes/` (dev) or its JAR at `/static/plugins/<name>/` (prod), and applies it on top of the always-loaded `default` baseline. Themes override CSS-variable tokens only — see [`docs/plugins/styling.md`](../plugins/styling.md). This is the **org-branding** axis; light/dark is a *separate* appearance toggle in the header.
- **`app.locale`** picks the active i18next language. Plugins ship locale files under `<plugin>/locales/<namespace>/<lng>.json` and declare `i18nNamespaces` in `plugin.json`.

## See also

- [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — full layer model.
- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md) — what's frozen (see the Config Contract section).
- [`packages/query/`](../../packages/query/) — `definePluginConfig` reader API.
- [`plugins/creating-a-plugin.md`](../plugins/creating-a-plugin.md#configuration) — plugin author entry point.
