# Configure

For Opencast admins. Afterwards you'll have `config.json` set up for the cases most deployments need: branding, locale, enabled plugins, authentication.

## The file

One file on the Opencast host configures the whole UI: `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json`. Opencast serves it at `/ui/config/management-ui/config.json` and the shell fetches it once at boot, so a change takes effect when you **edit the file in place and reload the browser** — no rebuild, no Opencast restart.

Omit what you don't override. Anything the file leaves out falls back to the built-in defaults plus the defaults each plugin contributes at runtime, so the file only has to carry your deployment's deviations.

## A worked example

Switch the deployment to the shipped `forest-sage` theme and drop the upload feature:

```json
{
  "app": {
    "theme": "forest-sage",
    "enabledPlugins": ["core", "episodes", "series", "admin", "config"]
  }
}
```

Save, reload: the colours change and **Upload** disappears from the sidebar. Why it looks like this:

- **`app.theme`** names a theme; the shell loads `<name>.css` on top of the always-present `default` baseline. Shipped: `aurora`, `forest-sage`, `heritage-burgundy`, `modern-slate`, `oxford-navy`, `press`. Light/dark is a separate toggle in the header, not a theme; an organization's own theme comes from a theme plugin.
- **`app.enabledPlugins` replaces the default list wholesale** — arrays never merge item by item, so disabling one plugin means listing all the others. The default is `["core", "episodes", "series", "upload", "admin", "config"]`; this drops `upload`. Always keep `core` and `config`.
- Everything unnamed — locale, auth, branding, plugin slices — is omitted and stays at its default. Keep whatever your file already carries; this shows a deployment whose *only* customizations are these two.

## When a change does not take

**This is the trap that costs operators the most time.** A plugin's slice under `plugins[<id>]` is validated against that plugin's schema. On failure the shell does not error out: it logs `plugin:<id> config validation failed` to the browser console and silently uses the plugin's defaults — the *entire* slice, not just the offending key. One typo'd key or wrong type therefore makes a whole slice look ignored.

So after every change to `config.json`: reload with the browser console open and look for that warning.

## Login

`auth.loginUrl` and `auth.logoutUrl` only say **where** to send users. *Which* method is enforced, and the identity-provider wiring behind it, lives in Opencast's `etc/security/mh_default_org.xml` plus the matching `security-*` module (Shibboleth, OpenID Connect, CAS, JWT, LDAP, LTI) — see the [Opencast documentation](https://docs.opencast.org/), not this project. The `/login` route picks its UX from the URL you configure:

- A `j_spring_security_*` URL — the right choice for a stock Opencast without an IdP — makes the shell render its own themed form, post the credentials, and return the user to the route they were headed for.
- Any other URL is treated as an external IdP and redirected to **verbatim**. Encode the post-login return target inside the URL with the parameter your IdP expects (Shibboleth's `target=`, OIDC's `redirect_uri`, CAS's `service=`) — the shell appends nothing of its own, and after SSO the user lands on that target rather than the deep route they first asked for.

Wiring this on a stock Opencast, including the redirect its security config performs first: [Install → Point login at your backend](./install.md#point-login-at-your-backend).

## Branding

All under `app.*` and applied at runtime once the config loads, so a deployment rebrands without a rebuild:

- **`HtmlDocumentTitle`** — the document title. An empty value falls back to `Management UI`; a dev server prefixes `[DEV] `.
- **`logoUrl` / `orgLogoUrl`** — the app logo and an optional organization logo (empty by default).
- **`faviconUrl`** — default `assets/favicon/favicon.svg`, a *relative* URL resolved against the app's base path. The shell drops any existing favicon links and injects the configured SVG plus an `.ico` link derived from it (`.svg` → `.ico`) for browsers without SVG-favicon support, so ship both files side by side.
- **`locale`** — the active language. Plugins ship their own translations.

## Look it up

- [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — the full key reference, the three-layer merge order, `enabledPlugins` vs. the per-plugin `enabled` switch, and what serves the file in each dev mode.
- [Troubleshooting](./troubleshooting.md) — a change that still does not take, and which metadata fields the backend accepts at all.
- [Backend configuration](./backend-config.md) — the settings that live on the server rather than in this file.
