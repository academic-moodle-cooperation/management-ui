# Your first plugin

For plugin developers new to this project. Afterwards you'll have a plugin you can **actually see** — a page with a sidebar entry — loaded in the dev shell, with its contract test green. About five minutes.

**Prerequisite:** the shell runs from source on your machine (`pnpm install`, `pnpm build`, `pnpm dev` works) — that's [Run from source](../getting-started/installation.md), one page, do it first.

## 1. Scaffold with the `app` template

```bash
pnpm create-plugin hello --template app
```

This scaffolds under `.local-plugins/hello/` (gitignored — where org and community plugins live), runs `pnpm install` to link the package, and prints a "Next steps" checklist.

`--template app` gives you a **real screen plus a sidebar link**, visible in both dev and production. The default template (`--template minimal`) registers an `app:header-logo` placeholder that nothing in the core shell renders — the contract test passes, but there's nothing to see, which makes "did it load?" hard to answer.

## 2. What you got

```
.local-plugins/hello/
├── plugin.json              # type: "app", extensionPoints: apps:definitions + sidebar:nav-items
├── package.json
├── tsconfig.json, vite.config.ts, vitest.config.ts, vitest.setup.ts, eslint.config.js, README.md
├── backend/                 # Maven/JAR layout — ignore for now, used when you ship (step 5)
└── src/
    ├── index.ts             # the two registrations (see below)
    ├── HelloPage.tsx        # the page mounted at /hello — edit this
    └── plugin.contract.test.ts
```

`src/index.ts` registers exactly two things in `initialize()`:

```ts
// the screen — a route + component the shell mounts at /hello
manager.registerObject("apps:definitions", "hello", {
  id: "hello", name: "Hello", routePath: "/hello", component: HelloPage,
});
// the left-nav entry that links to it
manager.registerObject("sidebar:nav-items", "hello", {
  title: "Hello", path: "/hello", icon: Sparkles,
  order: 50, permissions: [], featureFlags: [], category: "content",
});
```

…and `export default helloPlugin` (the loader registers via `module.default` — keep it).

## 3. Run it and see it

```bash
pnpm --filter @oc-mui/plugin-hello build   # → dist/hello.mjs (the dev server serves this)
```

Enable it in the **served** config — add `"hello"` to `app.enabledPlugins` in
`apps/shell/public/ui/config/management-ui/config.json` — then start the shell so that file is the one served (no backend, or `VITE_LOCAL_CONFIG=true` — see [Configuration](../getting-started/configuration.md)):

```bash
pnpm dev      # http://127.0.0.1:3000/management-ui/
```

A **Hello** entry appears in the sidebar, and the browser console logs `[hello] activated`. The sidebar entry is your "it loaded" signal; clicking it navigates to `/hello`.

Two things worth knowing:

- **App routes are behind authentication.** Without a logged-in session, `/hello` shows the sign-in screen — even though the plugin loaded fine (the sidebar entry still shows). To see the page itself render, run against a backend and log in: `VITE_PROXY_TARGET=<backend-url> pnpm dev` (see [Run from source](../getting-started/installation.md) for the backend options, including a minimal stub).
- The `[hello] activated` console line is logged via `logger.info`, which is **dev-only** (suppressed in production builds). Don't rely on it at staging — the rendered nav entry is the durable signal.

## 4. Verify the contract

```bash
pnpm --filter @oc-mui/plugin-hello test:contract
```

Expected output ends with:

```
Test Files  1 passed (1)
     Tests  5 passed (5)
```

Green out of the box, checking: the plugin activates, every `extensionPoints` entry in `plugin.json` is populated, there's a `default` export (this assertion is written into the scaffolded test itself — the harness doesn't check it), no console errors, and i18n key parity (a no-op until you ship `locales/` and declare `i18nNamespaces`).

## 5. Where to go next

- **Make it real** — [Creating a plugin](./creating-a-plugin.md) continues with this same `hello` plugin: a config slice your deployment can override, a translated string, and the rest of the extension points.
- **Ship it** — [Distribution](./distribution.md): what you just used is the dev mount; the same code ships in-tree, as a JAR next to Opencast, or from a CDN.
