# Extend it

For developers adding features to Management UI without forking it. Afterwards you'll know which page covers the extension you have in mind.

Everything visible is a plugin, so "extending" means writing one — and occasionally teaching the backend a new field for it to query.

## Tasks

- [Your first plugin](./first-plugin.md) — scaffold to green contract test.
- [Building a plugin](./plugin-guide.md) — manifest, extension points, config slice, the boundaries.
- [Styling](./styling.md) — theme tokens instead of hardcoded colors and spacing.
- [Translations](./i18n.md) — namespaces, locale files, key parity.
- [Testing a plugin](./testing.md) — unit and contract tests for your plugin.
- [Add a GraphQL field](./graphql-field.md) — new backend data, end to end.

## Look it up

- [Backend bundles](./backend-bundles.md) — what the server-side bundles do and how plugin JARs are discovered.
- [Distribution](./distribution.md) — the delivery paths a plugin can take to a deployment.

Working on the shell or the shared packages rather than on a plugin? That's [Contribute](../contribute/index.md).
