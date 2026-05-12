# @oc-mui/plugin-__PLUGIN_NAME__

TODO: One-paragraph description. What does this plugin do, what extension
points does it register on, what is the configuration story.

## Development

```bash
# from the workspace root
pnpm install

pnpm --filter @oc-mui/plugin-__PLUGIN_NAME__ check-types
pnpm --filter @oc-mui/plugin-__PLUGIN_NAME__ lint
pnpm --filter @oc-mui/plugin-__PLUGIN_NAME__ test:contract
```

## Next steps

1. Replace the `app:header-logo` placeholder registration in
   [src/index.ts](src/index.ts) with your real extension-point logic.
2. Update [plugin.json](plugin.json):
   - Fill in `description` and `author`.
   - Adjust `type` (e.g. `app`, `header`, `sidebar`, `theme`).
   - Update `extensionPoints` to match what `initialize()` actually registers.
3. Run `pnpm test:contract` from this directory after every change.
4. Read [AGENTS.md](../../AGENTS.md) (in the repo root) for the full plugin
   authoring rules.
