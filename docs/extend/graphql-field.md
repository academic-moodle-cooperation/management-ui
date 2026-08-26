# Add a GraphQL field

For developers who need data the API does not expose yet. Afterwards you'll have a new field available end to end, from the Java type through the generated client to the mocked test tier.

The chain has eight steps, and skipping any of the last three breaks something quietly. You need a local Opencast with the backend bundles deployed — [Full local setup](../contribute/local-backend.md).

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

::: warning Mutation arguments are read by name, not through the parameter
A `@GraphQLName`-annotated parameter on a `MuiMutation` method **declares** the argument in the schema; it does not necessarily carry the value into the command. The commands pull arguments straight out of the `DataFetchingEnvironment` by string key: `MuiUpdateEventCommand` and `MuiUpdateEventAclCommand` read `environment.getArgument("publishChanges")`, and the upstream `UpdateEventCommand` / `UpdateEventAclCommand` they extend read `"metadata"` and `"acl"` the same way.

So a Java parameter that is never referenced in the method body is still load-bearing. In `MuiMutation` that is every `acl` parameter — on `updateEvent`, `updateEventAcl`, and `updateSeries` alike — plus `publishChanges` on the first two. Deleting the parameter removes the argument from the schema and the lookup then yields `null`; renaming its `@GraphQLName` breaks the lookup at runtime with **no compiler error**. Change the annotation and the `getArgument` key together, and grep the command classes for the key before touching either.
:::

## 2. Add a config key, if the field needs one

Values an operator must be able to change belong in `MuiConfig.java`, an OSGi metatype `@interface` on the PID `org.opencastproject.mui`. Method names map to dotted property names: `thumbnail_channel_id()` is the key `thumbnail.channel.id`. Give it a `default` there, and add the shipped value to `src/main/resources/OSGI-INF/configurator/mui.json` so a fresh install starts configured.

Read it through the **static** accessor `GraphQLProvider.getConfig()` — the provider component holds the activated config in a static field, which is how the plain (non-component) `MuiEventInfo` reaches it. The operator-facing view of these keys is [Backend configuration](../operate/backend-config.md).

## 3. Build and deploy the bundle

From the repo root, with `$OPENCAST_DIST` pointing at your Opencast install:

```bash
mvn install -DskipTests -DdeployTo="$OPENCAST_DIST"
```

Near the end you will see, immediately before `BUILD SUCCESS`:

```
[ERROR] [copy] Warning: Could not find file …management-ui-feature-1.0-SNAPSHOT.jar to copy
```

**That is harmless.** The feature module is packaged as `feature`, not `jar`, so there is nothing for the deploy step to copy; the antrun task is `failonerror="false"` but Ant still logs the notice at `[ERROR]`. `BUILD SUCCESS` is the signal, not the absence of `[ERROR]` lines.

Karaf hot-loads JARs dropped into `deploy/` — no restart needed. It is not instant, though: rebuilding the schema after the new bundle resolves took **12–24 seconds** in testing. Wait that long before the next step, or you will query the *old* schema, see your field missing, and go troubleshooting a problem you don't have.

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

Shared operations live in [`packages/query/src/queries.graphql`](../../packages/query/src/queries.graphql); a plugin declares its own in its `.graphql` files. Either way the operation and fragment names carry a prefix: `Mui` for the shared package, your namespace in PascalCase for a plugin. An ESLint rule fails the build otherwise — the rule and its casing table are in [Contracts § GraphQL Operation Naming](../reference/contracts.md#6-graphql-operation-naming).

## 6. Refresh the committed schema, then run codegen

Codegen reads the **committed schema** — [`packages/query/src/schema.graphql`](../../packages/query/src/schema.graphql) — so regenerating types needs **no running backend**:

```bash
pnpm --filter @oc-mui/query codegen
```

What needs the backend is the step before: your new backend field only reaches the generated types once the committed schema knows it. Refreshing the schema is a deliberate, reviewed step — it reads `GRAPHQL_ENDPOINT` (and optional `GRAPHQL_HEADERS`) from the repo-root `.env`:

```bash
cp .env.example .env      # then set GRAPHQL_ENDPOINT to your backend
pnpm --filter @oc-mui/query schema:refresh
```

Review the `schema.graphql` diff before regenerating: it should contain exactly the backend change you expect. The file's header records which Opencast version it was taken from. Two things to know when the diff surprises you: type *order* follows the source instance's introspection order, and Opencast's `*MetadataInput` types are **per-organisation** — a catalog field configured `readOnly` on the source instance is absent from them, so refresh from an instance whose catalog configuration matches what the UI should support.

CI regenerates from the committed schema and fails on any diff (`pnpm codegen:check`, also part of `pnpm verify`), so committed inputs and outputs can no longer drift apart ([#355](https://github.com/academic-moodle-cooperation/management-ui/issues/355) was exactly that class of bug).

Two files are rewritten, and both are **committed**: `src/gql-generated.ts` (types plus React Query hooks) and `src/schema-input-fields.generated.ts` (runtime arrays of orderable/filterable field names). Once you have confirmed the baseline was clean, commit the diff — it is now yours alone. If the second file changed, `src/sortableFields.test.ts` may need its pinned expectations updated — that failure is the intended signal that the sortable set moved.

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
