# Configuration

Quick reference for what the shell reads, where each piece comes from, and how plugins consume their slice. The full layer model with merge rules and edge cases lives in [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — this page is the practical version.

## The shape

```jsonc
{
  "app": {
    "theme": "default",
    "locale": "en",
    "enabledPlugins": ["core", "admin", "episodes", "series", "upload"]
  },
  "auth": {
    "loginUrl": "/Shibboleth.sso/Login?target=/management-ui",
    "logoutUrl": "/Shibboleth.sso/Logout?return=/management-ui",
    "loginUrlDev": "/j_spring_security_login",
    "logoutUrlDev": "/j_spring_security_logout"
  },
  "plugins": {
    "episodes": { "pageSize": 50 },
    "series":   { "pageSize": 25 },
    "upload":   { "workflows": ["schedule-and-upload-from-archive"] }
  }
}
```

- **`app.*`** — top-level shell settings. Stable keys: `theme`, `locale`, `enabledPlugins`.
- **`app.enabledPlugins`** — the **ship filter**. Only namespaces listed here load at all. To prevent a plugin from running, remove its namespace.
- **`auth.*`** — where the shell sends users to log in / out. See [Authentication](#authentication).
- **`plugins[id]`** — per-plugin slice. Each plugin owns the sub-shape; the shell just persists it.
- **`plugins[id].enabled: false`** — the **runtime switch**. The plugin loads but skips activation. Use this when you want a plugin available but currently off.

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
- **External IdP (SSO).** Any other URL (e.g. `loginUrl: "/Shibboleth.sso/Login?target=/management-ui"`) is treated as an external IdP: the shell does a full-page redirect to it **verbatim**. Encode the post-login return target **inside** the URL using whatever param your IdP expects — Shibboleth's `target=`, OIDC's `redirect_uri`, CAS's `service=`, and so on. The shell does not append its own return param.

> **Note:** After an SSO login the user returns to the static `target` you configured (typically the app root), not the exact deep route they first requested. Deep-link return after SSO would require per-IdP return-param support and is a tracked follow-up. Password-form login *does* return to the exact route.

### Choosing your org's method

1. Configure the auth method in the **backend** (`mh_default_org.xml` + the relevant `security-*` module). This is an Opencast deployment decision.
2. Set `auth.loginUrl` / `logoutUrl` in your `config.json` to match — point them at your IdP's entry/exit endpoints (with the return target encoded in), or at the Spring endpoints for password login.

Orgs typically ship these overrides in a tiny `.local-plugins/<org>-config/` plugin that registers an `app:config` overlay (see [below](#where-the-hosts-configjson-comes-from)), so they don't have to edit the bundled `config.json`.

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

const { pageSize } = episodesConfig.use();   // reactive
```

### In an event handler / non-React code

```ts
const { pageSize } = episodesConfig.read();  // sync snapshot
```

### Reading the merged app config

```ts
import { useAppConfig } from "@oc-mui/query";

const { config } = useAppConfig();
const theme = config.app.theme;
```

Reading **another plugin's slice** (`config.plugins["other-plugin"]`) is forbidden — `@oc-mui/eslint-config` catches it.

## Writing your own plugin config

```ts
import { z } from "zod";
import { definePluginConfig } from "@oc-mui/query";

const schema = z.object({
  apiEndpoint: z.string().url(),
  pageSize: z.number().int().positive().default(20),
});

export const myPluginConfig = definePluginConfig({
  id: "my-plugin",
  schema,
  defaults: { pageSize: 20 },
});
```

Then register the defaults so they flow into the merge:

```ts
manager.registerObject("app:config:defaults", "my-plugin", {
  plugins: { "my-plugin": { pageSize: 20 } },
});
```

The Zod schema is used at runtime to validate the merged slice. Invalid values are rejected with a clear error.

## Where the host's `config.json` comes from

The shell fetches it on boot from `productionConfigUrl` (default `/ui/config/management-ui/config.json`). What answers that request depends on where you're running:

| Context | What serves `config.json` |
| --- | --- |
| **Production** | The Opencast JAR ships a sensible default at that path (built from `apps/shell/public/ui/config/management-ui/config.json`). Deployments mount their own `config.json` over it at the same path; no rebuild required. |
| **Dev, no backend** (`pnpm dev`) | The dev server serves the committed `apps/shell/public/ui/config/management-ui/config.json` at that exact path. **Edit it and reload to test config changes — no backend needed.** |
| **Dev, with backend** (`VITE_PROXY_TARGET=… pnpm dev`) | The request is proxied to that backend, so you exercise the backend's real `config.json`. The committed local file is not used. |

Anything the file omits falls back to `defaultConfig` in [`@oc-mui/ui-config`](../../packages/ui-config/), and plugins contribute their own slice defaults at runtime — so the file only needs to carry what a deployment actually overrides.

Orgs typically ship a tiny `.local-plugins/<org>-config/` plugin that registers an `app:config` overlay instead of editing a JSON file — this lets them override values across deployments and wins over `config.json` (see the merge order above).

## Theme & locale

- **`app.theme`** picks a theme CSS file from the shell's theme directory (`apps/shell/src/themes/`) or from any plugin's theme registration. Plugins ship theme tokens as CSS variable overrides — see [`docs/plugins/styling.md`](../plugins/styling.md).
- **`app.locale`** picks the active i18next language. Plugins ship locale files under `<plugin>/locales/<namespace>/<lng>.json` and declare `i18nNamespaces` in `plugin.json`.

## See also

- [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — full layer model.
- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md#4-config-contract) — what's frozen.
- [`packages/query/`](../../packages/query/) — `definePluginConfig` reader API.
- [`plugins/creating-a-plugin.md`](../plugins/creating-a-plugin.md#configuration) — plugin author entry point.
