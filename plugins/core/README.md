# @oc-mui/plugin-core

Core plugin. Declares the extension points other plugins build on and ships default implementations of the header, footer, and home navigation entry. Every plugin may import from `@oc-mui/plugin-core` — it's the one cross-plugin exception in the boundaries rule.

## What it provides

### Extension-point declarations

The plugins under [`extension-points/`](./extension-points/) register documentation entries on `extension-points:documentation` so the marketplace and contract harness know they exist. They don't render anything themselves — they're the "schema" for what other plugins can populate.

| Extension point | Declared in | Purpose |
|------|------|------|
| `app:header-logo` | `appLayoutExtensionPoints` | Logo in the header. **Declared only — no default renderer consumes it in the current shell**, so registering one has no visible effect yet. (It's the scaffold's contract-test placeholder.) |
| `app:header-actions` | `appLayoutExtensionPoints` | Action buttons in the header. |
| `app:footer` | `appLayoutExtensionPoints` | Footer content. |
| `app:branding` | `appLayoutExtensionPoints` | Theme + branding settings. |
| `app:config` | `appLayoutExtensionPoints` | App-wide config overlay (the `enabledPlugins` source). |
| `sidebar:nav-items` | `sidebarExtensionPoints` | Main navigation items. |
| `sidebar:user-items` | `sidebarExtensionPoints` | User actions and settings. |
| `sidebar:admin-items` | `sidebarExtensionPoints` | Admin functions. |
| `sidebar:help-items` | `sidebarExtensionPoints` | Help / support / docs. |
| `table-sidebar:tabs` | `tableSidebarExtensionPoints` | Detail panels for table rows (generic). |
| `table-sidebar:episodes:tabs` | `tableSidebarExtensionPoints` | Detail-panel tabs on the episodes table. |
| `table-sidebar:series:tabs` | `tableSidebarExtensionPoints` | Detail-panel tabs on the series table. |
| `series:table:toolbar-end-actions` | `seriesExtensionPoints` | Buttons in the series-table toolbar. `core-series` puts Create Series here when `createSeries.placement` is `"toolbar"`. |
| `series:create-series:variants` | `seriesExtensionPoints` | Ways to create a series, offered as cards by the create-series dialog (see below). |
| `series:create-series:acl-editor` | `seriesExtensionPoints` | Optional ACL editor in the default create-series variant. |
| `episodes:table:actions` | `episodesExtensionPoints` | Replacement for the per-row actions cell of the episodes table (`registerComponent`, lowest `order` wins). |
| `episodes:table:status-indicators` | `episodesExtensionPoints` | Extra states for the episodes status column and the gallery thumbnail overlay (see below). |
| `upload:acl-editor` | `uploadExtensionPoints` | ACL editor in the upload flow. |
| `upload:metadata-editor` | `uploadExtensionPoints` | Metadata editor in the upload flow. |
| `upload:workflow-selector` | `uploadExtensionPoints` | Workflow picker in the upload flow. |
| `upload:pre-upload-validation` | `uploadExtensionPoints` | Validation hook that runs before the upload starts. |

#### Labelling a sidebar tab

The three `table-sidebar:*` points render a tab strip, and the caption of each tab is the host's business. Pass a `label` — a translation key — so it can be localized:

```ts
manager.registerComponent("table-sidebar:episodes:tabs", ExamRecordingsTab, {
  key: "exam-recordings",
  order: 20,
  label: "acme:tabs.examRecordings",
});
```

The host resolves the key at render time, so the caption follows a language switch, and it loads the key's namespace itself — the tab's own component may not have mounted yet. A `label` without a `:` is taken as a literal. Omit it and the caption is derived from `key` (`exam-recordings` → "Exam Recordings"), which is what every tab showed before the option existed.

#### Adding a state to the episodes status column

`eventStatus` says whether Opencast finished processing an event; it says nothing about states a deployment's workflow introduces on top — a finished event that still waits for someone to publish it, say. `episodes:table:status-indicators` lets a plugin name such a state. Register an `EpisodeStatusIndicator` (the type is exported from this package):

```ts
import { CircleAlert } from "lucide-react";
import type { EpisodeStatusIndicator } from "@oc-mui/plugin-core";

manager.registerObject("episodes:table:status-indicators", "publication-pending", {
  id: "publication-pending",
  order: 100,
  matches: (event) =>
    event.eventStatus.endsWith("PROCESSED") && !event.muiEventInfo?.publishUrl,
  icon: CircleAlert,
  tone: "warning",
  label: "acme:status.publicationPending",
  // Optional: where the user resolves the state. The list icon becomes a link
  // and the gallery thumbnail points here instead of the player.
  href: (event) => `/editor-ui/index.html?mediaPackageId=${event.id}`,
  target: "_blank", // the default
} satisfies EpisodeStatusIndicator);
```

For every row, `core-episodes` asks each registered indicator (lowest `order` first) whether it `matches` the event. The first one that does replaces the default status icon in the list view's status column, in the indicator's `tone` (`ok`, `info`, `warning`, `error` — the theme's status colours), and covers the gallery thumbnail with the same icon, the way the built-in non-processed states do. `label` follows the tab-label convention above: a translation key the host resolves, or a literal without a colon. A `matches` (or `href`) that throws is logged and skipped, so a faulty plugin cannot blank the table. When no indicator matches, the row shows exactly what it showed before.

#### Adding a way to create a series

The create-series dialog in `core-series` is a shell over `series:create-series:variants`. The plain metadata form is the variant `default`; a plugin adds another kind of series — one bound to a course in the campus system, say, with fixed title and term and a step for subtitles — by registering a `CreateSeriesVariant` (type exported from this package):

```ts
import { GraduationCap } from "lucide-react";
import type { CreateSeriesVariant, CreateSeriesVariantProps } from "@oc-mui/plugin-core";

const CourseSeriesVariant = ({ onCreated, onCancel }: CreateSeriesVariantProps) => {
  // Render the dialog body and footer; call onCreated(seriesId) when done.
  return null;
};

manager.registerObject("series:create-series:variants", "acme-course", {
  id: "acme-course",
  order: 10,
  label: "acme:createSeries.course.label",
  description: "acme:createSeries.course.description",
  icon: GraduationCap,
  requiredRoles: ["ROLE_LECTURER"], // optional
  component: CourseSeriesVariant,
} satisfies CreateSeriesVariant);
```

The dialog lists every registered variant the deployment has not disabled (`plugins.series.seriesTable.createSeries.variants.<id>.enabled: false`, which also works for `default`) and whose `requiredRoles`, when set, the user meets. One variant opens directly; several open a chooser of cards first, and the picked variant gets a Back control. The variant owns the dialog body and footer, so a multi-step flow needs no support from the shell; it reports the new series through `onCreated(seriesId)`, after which the shell closes the dialog and refreshes the series list. `label` and `description` follow the tab-label convention above: a translation key the host resolves, or a literal without a colon. The config key for a variant is its `id`, so prefix it with your plugin name.

### Centrally consumed extension points

Three further points are not declared here but are consumed by the platform itself — plugins register on them all the same:

| Extension point | Consumed by | Purpose |
|------|------|------|
| `apps:definitions` | app registry builtin (`@oc-mui/plugin-system`) + the shell's router | A route + component pair mounted under `/<routePath>`. |
| `app:config:defaults` | config merge (`@oc-mui/query` / shell boot) | A `Partial<AppConfig>` slice merged below `config.json`. |
| `appshell:header` | `AppShell` (`@oc-mui/ui`) | The complete header component (see below). |

### Default implementations

Exported from [`modules/`](./modules/index.ts):

| Plugin | What it renders |
|------|------|
| `coreHeaderImplementation` | Registers `DefaultHeader` on `appshell:header` with `key: "default-header"`, `order: 100`. Renders `ThemeModeToggle`, `LangSwitcher`, `LoginButton`. |
| `coreFooterImplementation` | Default footer. Locales in `modules/footer/locales/core-footer/`. |
| `coreDefaultImplementations` | The Home sidebar entry (`sidebar:nav-items`, order 10). |

`LangSwitcher` and `LoginButton` are also exported directly so org plugins can reuse them in a custom header.

### Overriding a default — lowest `order` wins

When several components are registered on the same point and one must be resolved, the renderer picks the **lowest `order` number** (ascending sort, `Math.min`; unset `order` counts as 100). So an org plugin overrides the default header by registering with a *lower* order:

```ts
// Core registers the default header at order 100…
manager.registerComponent("appshell:header", DefaultHeader, {
  key: "default-header",
  order: 100,
});

// …an org plugin overrides it by registering with a lower order.
manager.registerComponent("appshell:header", OrgHeader, {
  key: "org-header",
  order: 50,
});
```

Two registrations with the same winning order log a warning and the first registered is used.

## Why every plugin may import this

The boundaries rule blocks cross-plugin imports — but `@oc-mui/plugin-core` is the exception, because plugins need its extension-point declarations to wire themselves up correctly. See [`@oc-mui/eslint-config`](../../packages/eslint-config/base.js) for the exception.

## Layer

In-tree plugin. Depends on `@oc-mui/i18n`, `@oc-mui/plugin-system`, `@oc-mui/query`, `@oc-mui/router`, `@oc-mui/ui`.

## See also

- [`docs/extend/plugin-guide.md`](../../docs/extend/plugin-guide.md) — how to register on these extension points.
- [`docs/reference/contracts.md`](../../docs/reference/contracts.md) — Manifest and Runtime API contract.
- [`AGENTS.md`](../../AGENTS.md) — operational rules.
