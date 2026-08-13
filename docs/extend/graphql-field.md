# Add a GraphQL field

For developers who need data the API does not expose yet. Afterwards you'll have a new field available end to end, from the Java type through the generated client to the mocked test tier.

The chain has eight steps, and skipping any of the last three breaks something quietly. You need a local Opencast with the backend bundles deployed — [Full local setup](../getting-started/local-backend.md).

## 1. Extend the type in Java

Fields live in `backend/management-graphql/src/main/java/org/opencastproject/management/graphql/`. Opencast's own types are extended, never edited: a class annotated `@GraphQLTypeExtension(GqlEvent.class)` grafts new fields onto the existing `Event` type. `MuiEventExtension` does exactly that, and its single field returns `MuiEventInfo` — the container every event-side addition goes into. So add a `@GraphQLField` method to **`MuiEventInfo`**, not to the extension:

```java
// MuiEventInfo.java
@GraphQLField
public String myNewField() {
  return event.getEvent().…;
}
```

The series side mirrors it (`MuiSeriesExtension` → `MuiSeriesInfo`), and mutations hang off `MuiMutationExtension`, which adds a `mui` field to the root `Mutation` type — which is why every mutation the UI sends is nested inside `mui { … }`.

## 2. Add a config key, if the field needs one

Values an operator must be able to change belong in `MuiConfig.java`, an OSGi metatype `@interface` on the PID `org.opencastproject.mui`. Method names map to dotted property names: `thumbnail_channel_id()` is the key `thumbnail.channel.id`. Give it a `default` there, and add the shipped value to `src/main/resources/OSGI-INF/configurator/mui.json` so a fresh install starts configured.

Read it through the **static** accessor `GraphQLProvider.getConfig()` — the provider component holds the activated config in a static field, which is how the plain (non-component) `MuiEventInfo` reaches it. The operator-facing view of these keys is [Backend configuration](../operate/backend-config.md).

## 3. Build and deploy the bundle

From the repo root, with `$OPENCAST_DIST` pointing at your Opencast install:

```bash
mvn install -DskipTests -DdeployTo="$OPENCAST_DIST"
```

Karaf hot-loads JARs dropped into `deploy/` — no restart needed.

## 4. Prove the schema actually changed

```bash
curl -s -u admin:opencast -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __type(name: \"MuiEventInfo\") { fields { name } } }"}'
```

::: warning A body of exactly `null` is not an empty result
HTTP 200 with a bare `null` body means Opencast built **no schema at all** for the organization — usually because your new Java type failed to map. The endpoint swallows the message; the real cause is only in the log (`grep -i "GraphQL schema" data/log/opencast.log`). Do not proceed to codegen until this query returns your field.
:::

## 5. Declare the operation

Shared operations live in [`packages/query/src/queries.graphql`](../../packages/query/src/queries.graphql); a plugin declares its own in its `.graphql` files. Either way the operation and fragment names carry a prefix: `Mui` for the shared package, your namespace in PascalCase for a plugin. An ESLint rule fails the build otherwise — the rule and its casing table are in [`CONTRACTS.md` § GraphQL Operation Naming](../architecture/CONTRACTS.md#6-graphql-operation-naming).

## 6. Run codegen against a live backend

```bash
pnpm --filter @oc-mui/query codegen
```

Codegen **introspects a running Opencast** — there is no schema file in the repo. It reads `GRAPHQL_ENDPOINT` (and optional `GRAPHQL_HEADERS`) from the repo-root `.env`; see [`.env.example`](../../.env.example). Without a reachable backend it fails, and it fails on the *whole* schema, not just your field.

Two files are rewritten, and both are **committed**: `src/gql-generated.ts` (types plus React Query hooks) and `src/schema-input-fields.generated.ts` (runtime arrays of orderable/filterable field names). Commit the diff. If the second file changed, `src/sortableFields.test.ts` may need its pinned expectations updated — that failure is the intended signal that the sortable set moved.

## 7. Changeset, and `api-check` if the surface moved

Both generated files sit inside `@oc-mui/query`, so this is a change to a versioned package: it needs a committed changeset, and a new export needs `pnpm api-check` plus the regenerated `etc/query.api.md`. Both rules are stated once in [`AGENTS.md`](../../AGENTS.md#versioning--changesets-every-versioned-package-and-public-api-changes).

## 8. Teach the mock backend the operation

**Do not skip this.** The E2E tier runs against a mocked backend, [`tests/e2e/_fixtures/mock-backend.ts`](../../tests/e2e/_fixtures/mock-backend.ts), which dispatches on `operationName` in a `switch`. Its `default` branch answers `null` — so an operation you forgot to add does not error. It resolves to nothing, and the failure surfaces far away as an empty table or a blank panel.

Add a `case` for your operation next to its siblings, and extend the `eventNode` / `seriesNode` shapes if your field rides along on an existing query:

```ts
case "MuiGetMyThings": {
  return respond({ … });
}
```

Then `pnpm verify`.
