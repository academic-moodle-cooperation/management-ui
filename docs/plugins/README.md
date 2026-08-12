# Plugins

Everything a plugin author needs. Start at **Your first plugin** if you're new; the others are reference reading you'll come back to.

| Doc | What it covers |
|-----|---------------|
| [Your first plugin](./first-plugin.md) | **Start here.** Scaffold a visible plugin, run it, ship it — about 5 minutes. |
| [Creating a plugin](./creating-a-plugin.md) | The walkthrough: scaffold, anatomy, extension points, dev loop. |
| [Distribution](./distribution.md) | In-tree, `.local-plugins/`, JAR, and CDN — the four ways plugins reach a shell. |
| [Styling](./styling.md) | Theme Contract 2.0 — semantic tokens, layers, override rules. |
| [i18n](./i18n.md) | Namespaces, locale layout, key parity. |
| [Testing](./testing.md) | The required contract test plus what else to cover. |

## Canonical references

- **[AGENTS.md](../../AGENTS.md)** — the authoring rules in long form. The plugin-author equivalent of `CONTRIBUTING.md`.
- **[architecture/CONTRACTS.md](../architecture/CONTRACTS.md)** — manifest, runtime API, theme, and config contracts with stability guarantees.
- **[architecture/CONFIGURATION.md](../architecture/CONFIGURATION.md)** — the full configuration layer model.
- **[packages/plugin-system/README.md](../../packages/plugin-system/README.md)** — the runtime your plugin runs on.
- **[packages/plugin-testing/README.md](../../packages/plugin-testing/README.md)** — full test-harness API.
