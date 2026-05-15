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

## Conventions

- **GraphQL operations and fragments**: prefix every `query`/`mutation`/`subscription`/`fragment` you declare with your plugin's namespace, in PascalCase (e.g. `__PLUGIN_PASCAL_NAME__GetSomething`, `__PLUGIN_PASCAL_NAME__ThingFields`). This avoids name collisions with other plugins at the GraphQL Codegen step. Full rules: [`docs/architecture/CONTRACTS.md` § 6](../../docs/architecture/CONTRACTS.md#6-graphql-operation-naming).
- **Plugin manifest's `workspaceDependencies`**: declare every shared dep you import from the host. The host refuses plugins whose required major doesn't match. Full rules: [`docs/architecture/CONTRACTS.md` § 5](../../docs/architecture/CONTRACTS.md#5-shared-runtime-dependencies).
