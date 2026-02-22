# AI Development Guide - Management UI

**Version:** 1.0.0  
**Last Updated:** 2025-11-12

## Purpose

This guide serves as the **primary entry point for AI models** working with the Management UI codebase. It explains how the documentation system is organized, where to find relevant information, and the requirements for maintaining documentation when making changes.

## Documentation Philosophy

Every component in this system is **documented for independent evolution**. The documentation enables:

- **Easy package updates** - Clear dependencies and boundaries
- **Technology swapping** - Well-defined interfaces and abstractions
- **New app/plugin creation** - Templates and examples
- **AI-assisted development** - Structured, navigable documentation

## Documentation Structure

```
Management UI/
├── docs/AI_DEVELOPMENT_GUIDE.md       ← YOU ARE HERE (start here)
├── README.md                      ← Project overview
│
├── /docs/                         ← Development guides & decisions
│   ├── /templates/                ← Documentation templates
│   │   ├── PACKAGE_README_TEMPLATE.md
│   │   ├── APP_README_TEMPLATE.md
│   │   ├── PLUGIN_README_TEMPLATE.md
│   │   └── IMPLEMENTATION_README_TEMPLATE.md
│   ├── /architecture/             ← Architecture decision records
│   │   ├── ADR-001-plugin-system.md
│   │   └── ADR-002-monorepo-structure.md
│   ├── /workflows/                ← How-to guides
│   │   ├── ADDING_PACKAGES.md
│   │   ├── ADDING_APPS.md
│   │   ├── ADDING_PLUGINS.md
│   │   ├── UPDATING_DEPENDENCIES.md
│   │   └── SWAPPING_TECHNOLOGIES.md
│   ├── internal/
│   │   ├── COUPLING_ANALYSIS.md       ← Package dependency analysis
│   ├── CONFIG_GENERATION.md       ← Config merging in dev vs prod
│   ├── CONFIG_ORDER.md            ← Plugin config precedence
│   └── internal/
│       └── FAVICON_CONFIGURATION.md   ← Favicon/asset customization
│
├── /packages/                     ← Shared infrastructure
│   ├── README.md                  ← Package ecosystem overview
│   └── [package-name]/
│       └── README.md              ← Individual package docs
│
├── /apps/                         ← Applications
│   ├── README.md                  ← App architecture overview
│   └── [app-name]/
│       └── README.md              ← Individual app docs
│
└── /plugins/                      ← Extension system
    ├── README.md                  ← Plugin system overview
    ├── /core/                     ← Core extension points
    │   └── README.md
    └── /[university]/             ← University-specific plugins
        └── README.md
```

## Quick Navigation for Common Tasks

### I want to create a NEW APPLICATION

1. **Read:** [`/docs/workflows/ADDING_APPS.md`](/docs/workflows/ADDING_APPS.md) - Step-by-step app creation guide
2. **Reference:** [`/docs/templates/APP_README_TEMPLATE.md`](/docs/templates/APP_README_TEMPLATE.md) - Documentation template
3. **Example:** [`/apps/management-ui-episodes/README.md`](/apps/management-ui-episodes/README.md) - Well-documented app
4. **Understand:** [`/apps/README.md`](/apps/README.md) - Application architecture patterns

### I want to create a NEW PLUGIN

1. **Read:** [`/docs/workflows/ADDING_PLUGINS.md`](/docs/workflows/ADDING_PLUGINS.md) - Plugin creation guide
2. **Reference:** [`/docs/templates/PLUGIN_README_TEMPLATE.md`](/docs/templates/PLUGIN_README_TEMPLATE.md) - Documentation template
3. **Example:** [`/plugins/example-university/README.md`](/plugins/example-university/README.md) - Reference implementation
4. **Understand:** [`/plugins/README.md`](/plugins/README.md) - Plugin system overview
5. **Export from core to org-local (official helper):** `pnpm plugin:export-local <plugin-name> --move`
6. **Export + convert to community-style runtime plugin:** `pnpm plugin:export-local <plugin-name> --move --convert-community --wire-config`
7. **Create new local community-style plugin from template:** `pnpm plugin:create-local <plugin-name> --wire-config`

### I want to create a NEW PACKAGE

1. **Read:** [`/docs/workflows/ADDING_PACKAGES.md`](/docs/workflows/ADDING_PACKAGES.md) - Package creation guide
2. **Reference:** [`/docs/templates/PACKAGE_README_TEMPLATE.md`](/docs/templates/PACKAGE_README_TEMPLATE.md) - Documentation template
3. **Check:** [`/docs/internal/COUPLING_ANALYSIS.md`](/docs/internal/COUPLING_ANALYSIS.md) - Understand dependency layers
4. **Understand:** [`/packages/README.md`](/packages/README.md) - Package ecosystem

### I want to MODIFY an existing package

1. **Read:** The package's `README.md` file first (e.g., `/packages/query/README.md`)
2. **Check:** [`/docs/internal/COUPLING_ANALYSIS.md`](/docs/internal/COUPLING_ANALYSIS.md) - Understand dependencies
3. **After changes:** Update the package's README.md with your modifications
4. **If adding features:** Document in "API Surface" section
5. **If changing dependencies:** Update "Dependencies & Coupling" section

### I want to UPDATE a dependency or SWAP technology

1. **Read:** [`/docs/workflows/UPDATING_DEPENDENCIES.md`](/docs/workflows/UPDATING_DEPENDENCIES.md) - Safe update process
2. **Read:** [`/docs/workflows/SWAPPING_TECHNOLOGIES.md`](/docs/workflows/SWAPPING_TECHNOLOGIES.md) - Technology replacement guide
3. **Check:** [`/packages/README.md`](/packages/README.md) - Dependency graph and impact analysis
4. **Test:** Follow validation steps in the workflow guides

## ⚠️ Critical Warnings: Auto-Generated Files

**DO NOT manually edit these folders/files - They are auto-generated and will be overwritten:**

1. **`packages/ui/src/components/ui/`** - shadcn/ui components
   - Generated by: `npx shadcn@latest add [component-name]`
   - Configuration: `packages/ui/components.json`
   - See: [`packages/ui/src/components/ui/README.md`](packages/ui/src/components/ui/README.md)
   - **Exception:** Prettier formatting is acceptable, but avoid structural changes

2. **Other auto-generated files** - Check for `components.json` or similar config files that indicate auto-generation

**If you need to customize auto-generated components:**

- Copy to a different location (e.g., `src/components/custom/`)
- Use the plugin system to override via `component-override` extension points
- Document your customization approach

## Documentation Update Requirements

**CRITICAL:** When you make ANY change to the codebase, you MUST update documentation:

### For Package Changes

- **Modified exports?** → Update "API Surface" section in package README.md
- **Added dependencies?** → Update "Dependencies & Coupling" section
- **Changed behavior?** → Update "Usage Examples" section
- **Breaking changes?** → Add to "Migration Guide" section

### For App Changes

- **New features?** → Update "Key Features" section in app README.md
- **New routes?** → Update "Architecture" or "File Structure" section
- **Changed integration?** → Update "Integration Points" section

### For Plugin Changes

- **New extension point?** → Document in core plugin README.md
- **New implementation?** → Create implementation README.md
- **Changed registration?** → Update plugin README.md examples

## Architecture Understanding

Before making significant changes, understand the system architecture:

### Package Dependency Layers

```
┌─────────────────────────────────────────┐
│ Application Layer                       │
│ - app-runtime, providers, vite-config   │
├─────────────────────────────────────────┤
│ Integration Layer                       │
│ - query, router, ui, ui-config          │
├─────────────────────────────────────────┤
│ Foundation Layer                        │
│ - plugin-system, store, i18n            │
├─────────────────────────────────────────┤
│ Core Infrastructure                     │
│ - utils, typescript-config, eslint-     │
│   config, tailwind-config               │
└─────────────────────────────────────────┘
```

**Key Principle:** Lower layers NEVER depend on higher layers.

### Read These Architecture Decisions:

- [`/docs/architecture/ADR-001-plugin-system.md`](/docs/architecture/ADR-001-plugin-system.md) - Why we use this plugin architecture
- [`/docs/architecture/ADR-002-monorepo-structure.md`](/docs/architecture/ADR-002-monorepo-structure.md) - Why packages are organized this way

## Key Design Principles

### 1. Loose Coupling

Each package should be **independently updatable**:

- Minimal dependencies
- Clear, stable interfaces
- No circular dependencies
- Implementation details hidden via exports

### 2. Plugin-First Architecture

Customization through plugins, not core modifications:

- Extension points defined by core
- Universities implement extensions
- Zero core code changes for customization

### 3. Explicit Over Implicit

Always prefer explicit definitions:

- Clear `exports` in package.json
- Documented public APIs
- Explicit dependency injection
- Clear architectural boundaries

### 4. Documentation as Code

Documentation is not optional:

- Every package has README.md
- Every app has README.md
- Every plugin has README.md
- Templates ensure consistency

## CRITICAL Patterns for Plugin Development

**AI MODELS: Read this section carefully. These are the most common mistakes.**

### Plugin App Registration (TWO PARTS REQUIRED!)

When creating a plugin that adds a new app with sidebar navigation, you need **TWO separate plugins**:

1. **App Plugin** (`apps:definitions`) - Registers the route and component
2. **Navigation Plugin** (`sidebar:nav-items`) - Adds the item to the sidebar

```typescript
// ❌ WRONG - Only registering the app (navigation won't appear!)
export const myAppPlugin = createPlugin({
  namespace: "my-feature",
  type: "app",
  initialize(manager) {
    manager.registerObject("apps:definitions", "my-app", {
      id: "my-app",
      name: "My Feature",
      routePath: "/my-feature",
      component: MyFeatureApp,
    });
  },
});

// ✅ CORRECT - Register BOTH app AND navigation
// File 1: my-feature-app-plugin.ts
export const myFeatureAppPlugin = createPlugin({
  namespace: "my-feature",
  type: "app",
  initialize(manager) {
    manager.registerObject("apps:definitions", "my-feature-app", {
      id: "my-feature-app",
      name: "My Feature",
      routePath: "/my-feature",
      component: MyFeatureApp,
    });
  },
  activate() {},
  deactivate() {},
});

// File 2: my-feature-nav-implementation.ts
export const myFeatureNavImplementation = createPlugin({
  namespace: "my-feature",
  type: "navigation",
  initialize(manager) {
    manager.registerObject("sidebar:nav-items", "my-feature", {
      title: "My Feature",
      path: "/my-feature",
      icon: MyIcon,
      order: 50,
      permissions: ["my-feature.view"],
    });
  },
  activate() {},
  deactivate() {},
});

// File 3: index.ts - Export BOTH
export { myFeatureAppPlugin } from "./my-feature-app-plugin";
export { myFeatureNavImplementation } from "./my-feature-nav-implementation";
```

### Data Fetching (USE EXISTING GraphQL HOOKS!)

**Never create mock implementations. Use the existing GraphQL hooks from `@workspace/query`.**

```typescript
// ❌ WRONG - Manual text input for IDs (terrible UX!)
<Input placeholder="Enter episode ID" />

// ✅ CORRECT - Use GraphQL hooks to fetch real data
import { useGetMyEventsQuery } from '@workspace/query';

const { data, isLoading } = useGetMyEventsQuery({
  limit: 20,
  query: searchTerm || undefined,
});

// IMPORTANT: Filter null values from GraphQL arrays!
const events = (data?.currentUser?.myEvents?.nodes || []).filter(
  (event): event is NonNullable<typeof event> => event !== null
);
```

See `/packages/query/README.md` for all available hooks and patterns.

### Translation Registration (ADD NAMESPACE!)

**When adding translations to a plugin, you MUST register the namespace:**

```typescript
// Step 1: Add namespace to packages/i18n/src/useTranslation.tsx
i18n.init({
  ns: ["common", "series", "episodes", "upload", "my-feature"], // Add here!
});

// Step 2: Create translation files in plugin
// plugins/my-feature/locales/my-feature/en.json
{
  "my-feature": {
    "heading": "My Feature",
    "description": "Feature description"
  }
}

// Step 3: Use in components
const { t } = useI18n();
return <h1>{t('my-feature:heading')}</h1>;
```

See `/packages/i18n/README.md` for complete translation guide.

### Plugin Export (DON'T FORGET plugins/index.ts!)

Every plugin must be exported from `plugins/index.ts`:

```typescript
// plugins/index.ts — only core plugins are exported here
export * from "./core";
export * from "./example-university";
export * from "./admin-marketplace";
// Org-specific plugins (univie, tuwien, etc.) live in .local-plugins/ or separate repos; do not add here.
```

### Directory Naming (AVOID `/api` PREFIX AT PROJECT ROOT)

**CRITICAL:** Do NOT name your directory with a path that **starts with `api`** at the root of a plugin (e.g., `plugins/my-plugin/api/` or `plugins/my-plugin/api-client/`).

- **Why?** The Vite dev server proxies paths starting with `/api` to the backend. Any folder whose path starts with `/api` (including `/api-client`, `/api-utils`, etc.) will be intercepted by the proxy, causing **404 errors** in standalone mode.
- **Fix:** Use `services`, `backend`, or `lib` instead.

## Common Patterns

### Creating a Component in @workspace/ui

```typescript
// 1. Create the component
// packages/ui/src/components/my-component/MyComponent.tsx

// 2. Export from index.ts
// packages/ui/src/index.ts
export { MyComponent } from "./components/my-component/MyComponent";

// 3. Document in README.md
// packages/ui/README.md - add to "Components" section

// 4. Use in apps
import { MyComponent } from "@workspace/ui";
```

### Creating an Extension Point

```typescript
// 1. Define in core plugin
// plugins/core/extension-points/my-extension-point.ts

// 2. Document in core README.md
// plugins/core/README.md - add to extension points catalog

// 3. Implement in university plugin
// plugins/myuni/implementations/my-implementation.ts

// 4. Register in plugin initialization
manager.registerComponent("my:extension-point", MyComponent);
```

### Adding a Hook to @workspace/query

```typescript
// 1. Create the hook
// packages/query/src/hooks/useMyData.ts

// 2. Export from index.ts
// packages/query/src/index.ts
export { useMyData } from "./hooks/useMyData";

// 3. Document in README.md
// packages/query/README.md - add usage example

// 4. Use in apps/plugins
import { useMyData } from "@workspace/query";
```

## Validation Checklist

Before considering your work complete:

- [ ] All modified packages have updated README.md
- [ ] All new files follow existing patterns
- [ ] TypeScript compiles: `pnpm check-types`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] No new circular dependencies introduced
- [ ] Documentation follows templates
- [ ] Examples are provided for new features
- [ ] Migration guide updated if breaking changes

## Getting Help

If you're unsure about:

- **Package organization** → Read [`/packages/README.md`](/packages/README.md)
- **App architecture** → Read [`/apps/README.md`](/apps/README.md)
- **Plugin system** → Read [`/plugins/README.md`](/plugins/README.md)
- **Dependencies** → Read [`/docs/internal/COUPLING_ANALYSIS.md`](/docs/internal/COUPLING_ANALYSIS.md)
- **Any decision** → Check [`/docs/architecture/`](/docs/architecture/) ADRs

## Example Workflows

### Workflow: Adding a New Data Fetching Hook

1. Read `/packages/query/README.md` to understand current patterns
2. Check `/docs/internal/COUPLING_ANALYSIS.md` for query package dependencies
3. Create hook in `packages/query/src/hooks/useNewData.ts`
4. Export from `packages/query/src/index.ts`
5. Update `/packages/query/README.md` with:
   - Hook description in "API Surface"
   - Usage example
   - Any new dependencies
6. Run `pnpm check-types` and `pnpm lint`
7. Use in app and verify functionality

### Workflow: Creating a University Plugin

1. Read `/docs/workflows/ADDING_PLUGINS.md` for step-by-step guide
2. Copy `/plugins/example-university/` as starting point
3. Follow template from `/docs/templates/PLUGIN_README_TEMPLATE.md`
4. Implement university-specific components
5. Register in plugin initialization
6. Create comprehensive README.md
7. Test in standalone mode: `cd plugins/myuni && pnpm dev`
8. Test in core shell: `cd apps/management-ui-core && pnpm dev`

## Community Plugin Development

The Management UI supports **Community Plugins** - externally developed plugins that can be loaded dynamically at runtime without rebuilding the core application.

### Key Documentation

- **Full Guide:** [`/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md`](/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md)
- **Template:** [`/plugins/community-plugin-template/`](/plugins/community-plugin-template/)

### Community Plugin Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Management UI Core                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Plugin       │  │ Fragment     │  │ Security     │  │
│  │ Manager      │  │ Registry     │  │ Service      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ▲                 ▲                  ▲          │
│         └─────────────────┼──────────────────┘          │
│                           │                              │
│                    ┌──────┴───────┐                     │
│                    │ Remote Loader │                     │
│                    └──────┬───────┘                     │
└───────────────────────────┼─────────────────────────────┘
                            │ dynamic import()
                            ▼
┌───────────────────────────────────────────────────────────┐
│              Community Plugin (ES Module)                  │
│  - Loaded from CDN (jsDelivr)                             │
│  - External deps: react, @workspace/*                      │
│  - Optional: __injected_fragments__ for GraphQL            │
└───────────────────────────────────────────────────────────┘
```

### Quick Start for Community Plugins

```bash
# Clone template
git clone https://github.com/opencast/community-plugin-template my-plugin
cd my-plugin

# Install and build
npm install
npm run build

# Test locally
npx http-server dist --cors -p 5173
# Load in Management UI via Developer Mode: http://127.0.0.1:5173/my-plugin.mjs
```

### Key Services for Community Plugins

| Service | Location | Purpose |
|---------|----------|---------|
| `RemoteLoader` | `plugins/admin-marketplace/src/services/remote-loader.ts` | Loads remote plugins |
| `SecurityService` | `plugins/admin-marketplace/src/services/security.ts` | URL allowlist & validation |
| `RegistryFetcher` | `plugins/admin-marketplace/src/services/registry-fetcher.ts` | Fetches plugin registry |
| `FragmentRegistry` | `packages/plugin-system/src/services/FragmentRegistry.ts` | GraphQL fragment management |

### Security Considerations

Community plugins are loaded from allowed domains only:
- `cdn.jsdelivr.net` (primary)
- `raw.githubusercontent.com`
- `*.github.io`
- `127.0.0.1` (development only)

Version compatibility is checked against `workspaceDependencies` in plugin metadata.

### GraphQL Fragment Extension

Community plugins can extend core GraphQL queries:

```graphql
# In plugin: src/gql/my-fields.graphql
fragment MyPluginFields on Event {
  customField
  nestedData {
    value
  }
}
```

Fragments are auto-extracted during build and registered with `FragmentRegistry` at load time.

## Success Indicators

You're following best practices when:

- ✅ You read relevant documentation BEFORE making changes
- ✅ You update documentation AFTER making changes
- ✅ You follow existing patterns in the codebase
- ✅ You check coupling analysis before adding dependencies
- ✅ Your changes pass all validation checks
- ✅ Your documentation helps the next developer (or AI)

## Remember

**Good documentation enables independent evolution.** Every piece of documentation you write helps future developers (human or AI) understand, modify, and extend the system without breaking it.

When in doubt, **over-document rather than under-document**.
