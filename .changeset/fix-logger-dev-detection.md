---
"@oc-mui/utils": patch
---

Fix the logger's dev-mode detection so `logger.info` / `logger.debug`
actually fire in the browser during development.

The constructor read Vite's env via an aliased `import.meta`:

```ts
const meta = import.meta as { env?: { DEV?: boolean } };
viteEnv = meta.env?.DEV === true;
```

Vite replaces the **literal token** `import.meta.env.DEV` at compile time
— it does not expose `env` on the native `import.meta` object. Aliasing
`import.meta` to `meta` first defeats that replacement, so `meta.env` was
always `undefined`, `isDevelopment` was always `false` in the browser,
and every `logger.info` / `logger.debug` call was a silent no-op in dev.
(`logger.warn` / `logger.error` were unaffected — they don't gate on the
flag.)

Read the literal `import.meta.env.DEV` directly (kept un-aliased, wrapped
in the existing try/catch for Node build contexts) so Vite's replacement
applies. Verified in a running dev shell: `isDevelopment` is now `true`
and `[INFO] …` / `[DEBUG] …` lines appear.
