# Quickstart

For anyone who wants to see Management UI before committing to it. Afterwards you'll have the UI open in your browser, showing the real content of an Opencast you already run.

You need Node.js ≥ 20, pnpm (`corepack enable` picks the pinned version), and the URL of a reachable Opencast. Nothing is installed on that server: the UI runs on your machine and talks to it.

::: warning You are pointing a dev server at a live system
Browsing is read-only, but every edit, upload, and delete you perform in the UI happens on that Opencast for real. Point it at staging, not at production.
:::

## Five commands

```bash
git clone https://github.com/academic-moodle-cooperation/management-ui.git
cd management-ui
pnpm install
pnpm build
VITE_PROXY_TARGET=https://opencast.example.org VITE_LOCAL_CONFIG=true pnpm dev
```

Open **<http://127.0.0.1:3000/management-ui/>**, click **Episodes** in the sidebar, and sign in with your Opencast credentials. The table fills with that Opencast's recordings.

Two things about that command line:

- **`pnpm build` is required, not a one-time nicety.** `@oc-mui/vite-config` is consumed from its `dist/` and nothing builds it during install, so a bare `pnpm dev` on a fresh clone stops at `ERR_MODULE_NOT_FOUND`.
- **`VITE_LOCAL_CONFIG=true` belongs in the command.** Without it the target's own `config.json` wins, and its `app.enabledPlugins` and `api.*` values — not your checkout — decide what you get to see. Data and login still come from the live backend. This pairing is what the repo's own real-backend test harness runs ([`playwright.integration.config.ts`](../playwright.integration.config.ts)), so it is the tested configuration rather than an improvisation.

A target wired to Shibboleth does not spoil this: the shell's dev login form survives the shallow merge of the `auth` defaults, so you still get a form to type credentials into.

### Windows

PowerShell and `cmd` reject the `VAR=… command` prefix. In PowerShell, set the variables first:

```powershell
$env:VITE_PROXY_TARGET="https://opencast.example.org"; $env:VITE_LOCAL_CONFIG="true"; pnpm dev
```

## If it doesn't work

- **A bare 500 and a stack trace in the terminal, no friendly notice.** The proxy verifies TLS certificates; for a private CA, prefix the command with `NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.pem`.
- **You land on an identity provider instead of the sign-in form.** That Opencast has form login switched off — authenticate the way the IdP expects.
- **The sidebar renders but every table stays empty.** The Opencast GraphQL plugin is off; turn it on as described in the [install prerequisites](./operate/install.md).
- **Login looks successful but you stay signed out.** A reverse proxy in front of Opencast rescoped the session cookie to a path or domain the UI never sends it back on.
- **Which UI version pairs with which Opencast.** That mapping lives in [Upgrade](./operate/upgrade.md).

## Where to go next

- **[Use it](./use/index.md)** — what the interface can do, task by task.
- **[Run it](./operate/index.md)** — install it on your Opencast instead of proxying to it.
- **[Extend it](./extend/index.md)** — add your own screens as plugins.
- **[Contribute](./contribute/index.md)** — work on the shell, the packages, or the built-in plugins.
