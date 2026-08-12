# Configuration

For Opencast admins configuring a Management UI deployment — plus the key-by-key reference. Afterwards you'll know where `config.json` lives, how to change theme, plugins, auth, and branding, and how to spot a change that "didn't take". The underlying layer model (merge semantics, edge cases) is [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md); plugin authors declare their own config slice per [Creating a plugin → Configuration](../plugins/creating-a-plugin.md#configuration).

## The file

One file on the Opencast host configures the whole UI:

```
$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json
```

Opencast serves it at `/ui/config/management-ui/config.json`; the shell fetches it once at boot. To apply a change: edit the file in place, reload the browser. No rebuild, no Opencast restart.

Two rules save the most debugging time:

1. **Omit what you don't override.** Anything the file leaves out falls back to the built-in defaults (`defaultConfig` in [`@oc-mui/ui-config`](../../packages/ui-config/)) plus the defaults each plugin contributes at runtime — the file only needs to carry your deployment's deviations.
2. **A bad value never errors — it silently falls back.** A plugin slice that fails validation is replaced *wholesale* by that plugin's defaults, with nothing but a browser-console warning. If a change looks ignored, check the console first — see [When a change does not take](#when-a-change-does-not-take).

Running from source instead? The [dev-time table](#config-in-development) at the bottom shows which file is served in each dev mode.

## A worked example

Goal: switch the deployment to the shipped `forest-sage` theme and disable the upload plugin. The complete `config.json` for that deployment:

```json
{
  "app": {
    "theme": "forest-sage",
    "enabledPlugins": ["core", "episodes", "series", "admin", "config"]
  }
}
```

Save, reload the browser: the color scheme changes and Upload disappears from the sidebar. (This shows a file whose *only* customizations are these two — in a real deployment, keep whatever your file already carries, e.g. the `auth` overrides from [Deployment → Configure](./deployment.md#configure).)

Why it looks like this:

- **`app.theme`** picks a theme by name; the shell resolves `<name>.css` and applies it on top of the always-loaded `default` baseline. The shipped showcase themes (in [`apps/shell/public/plugins/themes/`](../../apps/shell/public/plugins/themes/)) are `aurora`, `forest-sage`, `heritage-burgundy`, `modern-slate`, `oxford-navy`, and `press`. An org theme comes from a theme plugin instead — `.local-plugins/<name>/themes/` in dev, the plugin's JAR (`/static/plugins/<name>/`) in production. Themes override CSS-variable tokens only ([`plugins/styling.md`](../plugins/styling.md)); light/dark is a separate appearance toggle in the header, not a theme.
- **`app.enabledPlugins` replaces the default list wholesale** — arrays are never merged per item. To disable one plugin, list all the others. The default list is `["core", "episodes", "series", "upload", "admin", "config"]`; the example removes `upload`. Always keep `core` (shared infrastructure) and `config` (the namespace under which an org's config-overlay plugin loads).
- Everything not named — locale, auth, branding, plugin slices — is omitted and stays at its default. Objects merge per key; only arrays replace.

## Key reference

The full shape, with the stable keys:

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

- **`app.*`** — top-level shell settings: `theme`, `locale` (the active i18next language), `enabledPlugins` (the **ship filter** — only namespaces listed here load at all), plus the branding keys `HtmlDocumentTitle`, `logoUrl`, `orgLogoUrl`, `faviconUrl` (see [Branding](#branding)).
- **`auth.*`** — where the shell sends users to log in / out. See [Authentication](#authentication).
- **`plugins[id]`** — per-plugin slice, owned by that plugin. See [Plugin slices](#plugin-slices).

A few more top-level keys exist — the authoritative shape is [`packages/ui-config/src/types.ts`](../../packages/ui-config/src/types.ts):

| Key | What it does |
| --- | --- |
| `productionConfigUrl` | Where the shell fetches `config.json` from (read from the baked-in defaults — see [below](#config-in-development)). |
| `productionAppPluginUrl` | Where the shell fetches the deployed-plugin manifest (`plugins.json`). |
| `downloadBaseUrl` | Optional base URL for media downloads. |
| `matomo` | Matomo analytics settings (`enabled: false` by default). |
| `api` | API endpoints: `baseUrl`, `graphqlEndpoint`. |

### Where values come from

Three layers merge, lowest precedence first: plugin defaults (contributed on the `app:config:defaults` extension point) ⊕ the baked-in `defaultConfig` plus the fetched `config.json` ⊕ an org config plugin's `app:config` overlay. The overlay wins over `config.json`, which wins over defaults — so an org config plugin can override anything, and `config.json` can override any plugin default. Full model with edge cases: [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md).

## Authentication

The shell does **not** implement an identity provider. It only needs to know **where to send users** to authenticate; the backend (Opencast) does the actual enforcement and IdP wiring. So auth is configured in two places:

| Layer | Responsibility | Where |
| --- | --- | --- |
| **Backend** | *Which* method is enforced + the IdP integration (Shibboleth, OpenID Connect, CAS, JWT, LDAP, AAI, LTI — each a `security-*` Opencast module) | `etc/security/mh_default_org.xml` — see the [Opencast security docs](https://docs.opencast.org/). Not part of this repo. |
| **Frontend (here)** | *Where* to send users to start login / logout | `auth.*` in `config.json` |

| Field | Meaning |
| --- | --- |
| `loginUrl` | Where to send users to log in (production). |
| `logoutUrl` | Where to send users to log out (production). |
| `loginUrlDev` | Optional dev override, used when running `pnpm dev`. Falls back to `loginUrl` if unset. |
| `logoutUrlDev` | Optional dev override for logout. |

The `/login` route inspects the effective login URL and picks the UX automatically:

- **Password backends (Spring form login).** If the URL targets `j_spring_security_*` (e.g. `loginUrl: "/j_spring_security_login"` — the right choice for a stock Opencast without an IdP), the shell renders its **own themed login form** and POSTs the credentials to `/j_spring_security_check`, then returns the user to wherever they were headed. The themed form only appears if the SPA can load anonymously, though: on a stock Opencast, `etc/security/mh_default_org.xml` lists `/management-ui/**` in its `redirectingPathPatterns`, so anonymous requests are 302-redirected to Opencast's `/login.html` before the shell ever boots. That also works — Opencast returns the user to `/management-ui` after login — it's just Opencast's stock login page instead of the themed one. To get the themed form, allow anonymous access to `/management-ui/**` in that security file.
- **External IdP (SSO).** Any other URL (e.g. `loginUrl: "/Shibboleth.sso/Login?target=/management-ui/"`) is treated as an external IdP: the shell does a full-page redirect to it **verbatim**. Encode the post-login return target **inside** the URL using whatever param your IdP expects — Shibboleth's `target=`, OIDC's `redirect_uri`, CAS's `service=`, and so on. The shell does not append its own return param.

> **Note:** After an SSO login the user returns to the static `target` you configured (typically the app root), not the exact deep route they first requested. Deep-link return after SSO would require per-IdP return-param support and is a tracked follow-up. Password-form login *does* return to the exact route.

To set up your org's method: configure it in the backend first (`mh_default_org.xml` + the relevant `security-*` module — an Opencast deployment decision), then point `auth.loginUrl` / `logoutUrl` at the matching entry/exit endpoints. Orgs typically ship these overrides in a tiny `.local-plugins/<org>-config/` plugin that registers an `app:config` overlay (see the [merge order](#where-values-come-from)), so they don't have to edit the bundled `config.json`.

## Plugin slices

Each plugin owns a sub-object under `plugins[id]`; the shell just passes it through, and the plugin's Zod schema decides the shape. The three slices in the [key reference](#key-reference) above are real examples; the full set of keys each built-in plugin accepts lives in its `src/config.ts` — [`plugins/core-episodes/src/config.ts`](../../plugins/core-episodes/src/config.ts), [`core-series/src/config.ts`](../../plugins/core-series/src/config.ts), [`core-upload/src/config.ts`](../../plugins/core-upload/src/config.ts).

Two switches control whether a plugin runs at all:

| Switch | Effect |
| --- | --- |
| `app.enabledPlugins` (the **ship filter**) | A namespace not in the list never loads. |
| `plugins[id].enabled: false` (the **runtime switch**) | The plugin loads but skips activation — available but currently off. |

### When a change does not take

This is the #1 admin trap. A deployment's slice is deep-merged on top of the plugin's defaults (objects merge per key; **arrays replace wholesale**), then validated against the plugin's Zod schema. **On validation failure the shell does not error out**: it logs a console warning — `plugin:<id> config validation failed; falling back to defaults` — and silently uses the plugin's defaults. The *entire slice* reverts, not just the offending key, so one typo'd key or wrong type makes your whole slice look ignored.

After every change to a deployment's `config.json`: open the browser console and check for these warnings.

### Metadata fields: which ones show, which ones save

Two independent layers decide what happens to a metadata field (event or series), and they answer **different questions**:

| Layer | Question it answers | Where it is configured |
| --- | --- | --- |
| **UI config** (`plugins.episodes.episodeInfo.metadata`, `plugins.series.seriesInfo.metadata`) | *Should this deployment display/edit the field in the UI?* | `config.json` — a display preference per field |
| **Opencast catalog policy** (`etc/org.opencastproject.ui.metadata.CatalogUIAdapterFactory-*.cfg`, per organization) | *Does the backend accept this field as input at all?* | The Opencast host — **not** part of this repo |

**The UI-config layer** pairs each field id with `show` and `readonly`:

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

- **`show: false`** removes the field from the info panel; **`readonly: true`** displays it but disables editing.
- **Both keys are required** on every entry — `{ "show": false }` alone fails validation, and a failed validation silently reverts the whole slice ([above](#when-a-change-does-not-take)).
- **The `metadata` array replaces the default list wholesale** — if you set it at all, list every field you want shown, in the order you want. The default field lists live in the `config.ts` files linked above.

**The catalog-policy layer** is the enforcing one: Opencast derives its GraphQL metadata input types per organization from the catalog UI adapter config, so a property with `property.<x>.readOnly=true` there is excluded from the input type and GraphQL rejects it hard. Typical use: an org pins `creator` (legal requirement) or `location` (set by the capture pipeline). **The UI adapts automatically** — the edit forms read each field's per-org `readOnly` flag and introspect the input type once per session, so backend-locked fields are displayed but never submitted, and the create-series dialog hides fields the org does not accept. You do **not** have to mirror the catalog policy in the UI config (before this behaviour existed, a mismatch made every metadata save fail with a `ValidationError` — #278/#280).

In practice:

- Hide or lock a field **for one deployment's UI** → UI config.
- Make a field **non-writable org-wide, enforced by the backend** → catalog config on the Opencast host; the UI follows along, and adding `readonly` in the UI config on top is optional and purely cosmetic.
- On a multi-tenant server the catalog config is **per organization** — the same field can be writable for one org and locked for another; the UI resolves this at runtime per session.

### Writing a slice (plugin authors)

Declaring a schema with `definePluginConfig`, registering defaults, and reading the slice with `.use()` / `.read()` is plugin-author material — the how-to is [Creating a plugin → Configuration](../plugins/creating-a-plugin.md#configuration), the API and validation semantics are in [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md). One rule matters at review time: a plugin never reads another plugin's slice.

## Branding

All under `app.*`, applied at runtime once the config loads (see [`apps/shell/src/main.tsx`](../../apps/shell/src/main.tsx)) — so a deployment rebrands in `config.json` or via an `app:config` overlay plugin, never by rebuilding:

- **`app.faviconUrl`** — default `"assets/favicon/favicon.svg"`, a **relative** URL resolved against the app's base path. At runtime the shell removes any existing favicon links and injects two: the configured SVG plus an `.ico` link derived from the same URL (`.svg` → `.ico`) as a fallback for browsers without SVG-favicon support — so if you ship a custom favicon, place both files next to each other.
- **`app.HtmlDocumentTitle`** — the document title. Required in the config type, but the runtime falls back to `"Management UI"` if it's empty. In dev mode (`pnpm dev`) the title gets a `[DEV] ` prefix.
- **`app.logoUrl` / `app.orgLogoUrl`** — the app logo and an optional organization logo (empty by default).

Theme and locale are covered in the [worked example](#a-worked-example) and [key reference](#key-reference); plugins ship their translations themselves (locale files under `<plugin>/locales/<namespace>/<lng>.json`, declared via `i18nNamespaces` in `plugin.json`).

## Config in development

The shell always fetches config from `productionConfigUrl` (default `/ui/config/management-ui/config.json`). That URL comes from the **baked-in** `defaultConfig` — not from the fetched file itself, so a deployment cannot relocate its own config path via `config.json`. What answers the request depends on where you're running:

| Context | What serves `config.json` |
| --- | --- |
| **Production** | Opencast serves `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json` — see [The file](#the-file). |
| **Dev, no backend** (`pnpm dev`) | The dev server serves the committed `apps/shell/public/ui/config/management-ui/config.json` at that exact path. **Edit it and reload to test config changes — no backend needed.** |
| **Dev, with backend** (`VITE_PROXY_TARGET=… pnpm dev`) | The request is proxied to that backend, so you exercise the backend's real `config.json`. The committed local file is not used. |
| **Dev, backend + local config override** (`VITE_PROXY_TARGET=… VITE_LOCAL_CONFIG=true pnpm dev`) | The committed local file is served for `config.json`, but **everything else** (GraphQL, auth, uploads, …) still hits the backend. Lets you tweak theme / `enabledPlugins` / plugin slices against real data before changing the backend's config. |

> `VITE_LOCAL_CONFIG` only affects the config path; all other endpoints follow `VITE_PROXY_TARGET`. Restart the dev server after changing either (env is read once at startup).

## See also

- [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — full layer model.
- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md) — what's frozen (see the Config Contract section).
- [`packages/query/`](../../packages/query/) — `definePluginConfig` reader API.
- [Creating a plugin → Configuration](../plugins/creating-a-plugin.md#configuration) — plugin-author entry point.
