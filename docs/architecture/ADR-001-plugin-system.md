# ADR-001: Plugin System Architecture

**Status:** Accepted  
**Date:** 2025-11-12  
**Deciders:** Architecture Team

## Context

Management UI needs to serve multiple universities, each with unique requirements for branding, workflows, metadata fields, and functionality. Traditional approaches would require:

- Forking the codebase per university (maintenance nightmare)
- Heavy use of feature flags (complexity explosion)
- Conditional logic throughout (poor code quality)
- Complex configuration files (limited flexibility)

We needed a way to allow extensive customization without modifying core code.

## Decision

We will implement a **plugin-based architecture** where:

1. **Core defines extension points** - The core system defines where customization is allowed
2. **Plugins implement extensions** - Universities create plugins that implement extension points
3. **Runtime resolution** - The system resolves which implementation to use at runtime
4. **Priority-based override** - Plugins can override defaults using priority numbers

### Key Components

#### 1. Plugin Manager

Central coordination system that:

- Discovers and loads plugins
- Manages component and object registration
- Resolves which components to use
- Handles plugin lifecycle (initialize, activate, deactivate)

#### 2. Extension Points

Named locations where plugins can customize:

- `app:header` - Application header
- `app:footer` - Application footer
- `app:sidebar` - Navigation sidebar
- `metadata:fields` - Custom metadata fields
- `workflows:definitions` - Custom workflows
- `apps:definitions` - Custom applications

#### 3. Component Resolver

React component that resolves plugins at render time:

```typescript
<ComponentResolver
  componentType="app:header"
  defaultComponent={DefaultHeader}
  componentProps={{ user }}
/>
```

#### 4. Plugin Definition API

```typescript
export const UniversityPlugin = createPlugin({
  namespace: "university",
  type: "extension",
  version: "1.0.0",

  initialize(manager) {
    manager.registerComponent("app:header", CustomHeader, { priority: 10 });
  },
});
```

## Rationale

### Why This Approach?

**Separation of Concerns:**

- Core focuses on platform functionality
- Plugins focus on university-specific requirements
- Clear boundaries between core and customization

**Zero Core Changes:**

- Universities can customize without touching core code
- Core can evolve independently
- Reduced merge conflicts

**Runtime Flexibility:**

- No rebuild needed for configuration changes
- Dynamic plugin loading (future: runtime plugin marketplace)
- A/B testing capabilities

**Maintainability:**

- Each university maintains only their plugin
- Core team maintains platform
- Clear ownership boundaries

**Scalability:**

- Easy to add new universities
- Easy to add new extension points
- Plugins can depend on other plugins

## Alternatives Considered

### Alternative 1: Configuration-Only Approach

**Approach:** Use JSON/YAML configuration files for customization

**Pros:**

- Simple to understand
- No code required for basic customization

**Cons:**

- Limited to predefined options
- Cannot add custom components
- Cannot implement custom logic
- Cannot create new applications

**Why Rejected:** Too limiting for complex university requirements

### Alternative 2: Template-Based Approach

**Approach:** Use template engines (Handlebars, EJS) for customization

**Pros:**

- Familiar to many developers
- Good for simple layouts

**Cons:**

- Limited to presentation layer
- Cannot implement business logic
- Poor TypeScript support
- Limited component reuse

**Why Rejected:** Cannot handle complex requirements like custom workflows

### Alternative 3: Micro-Frontend Architecture

**Approach:** Each university gets completely independent frontend

**Pros:**

- Complete independence
- Different technologies per university
- Isolated deployments

**Cons:**

- Massive duplication
- Inconsistent user experience
- No shared components
- Complex integration
- Higher maintenance cost

**Why Rejected:** Too much overhead, defeats purpose of shared platform

### Alternative 4: Monolith with Feature Flags

**Approach:** Single codebase with feature flags per university

**Pros:**

- Simple deployment
- Shared code

**Cons:**

- Code becomes unmaintainable
- Conditional logic everywhere
- Tight coupling
- Testing complexity grows exponentially

**Why Rejected:** Does not scale beyond a few universities

## Consequences

### Positive

✅ **Customization without core changes** - Universities can add features independently  
✅ **Clear boundaries** - Well-defined extension points  
✅ **Independent evolution** - Core and plugins evolve separately  
✅ **Easy onboarding** - New universities copy example plugin  
✅ **Type safety** - Full TypeScript support  
✅ **Testing** - Plugins can be tested independently  
✅ **Performance** - Only load plugins that are needed

### Negative

⚠️ **Learning curve** - Developers need to understand plugin system  
⚠️ **Abstraction overhead** - Extra layer of indirection  
⚠️ **Documentation critical** - Extension points must be well-documented  
⚠️ **Version compatibility** - Plugins may break with core updates  
⚠️ **Debugging complexity** - Issues may span core and plugins

### Neutral

- **Plugin discovery** - Need mechanism to find and load plugins
- **Dependency management** - Plugins may depend on specific core versions
- **Migration paths** - Need strategy for breaking changes in extension points

## Implementation Notes

### Plugin Package Structure

```
plugins/university-name/
├── implementations/        # Extension point implementations
│   ├── header/
│   ├── footer/
│   └── index.ts
├── apps/                   # Custom applications
├── assets/                 # University assets
├── index.ts                # Plugin entry point
└── package.json
```

### Priority System

Lower numbers = higher priority:

- Core defaults: 100
- General plugins: 50
- University plugins: 10
- Critical overrides: 1

### Extension Point Naming

Convention: `category:specific-point`

- `app:header` - Application-level header
- `episodes:empty-state` - Episodes app empty state
- `metadata:fields` - Metadata field definitions

## Related Decisions

- **ADR-002:** Monorepo Structure - Enables plugin organization
- **ADR-003:** Standalone Apps - Plugins can register apps
- Package coupling principles support plugin independence

## References

- [Plugin System Documentation](/packages/plugin-system/docs/README.md)
- [Plugin Development Guide](/docs/workflows/ADDING_PLUGINS.md)
- [Example Plugin](/plugins/example-university/)

## Evolution (2026-04)

The plugin architecture was refined based on production experience:

- **Multi-entry JARs:** One deployed JAR can now expose multiple frontend modules (e.g., sidebar + footer + app), each independently activatable via `pluginNamespace` type filtering.
- **Unified loading:** Dev (`.local-plugins` manifest) and prod (JAR `plugins.json`) now use the same two-phase loading flow: config plugins first, then remaining plugins filtered by merged config.
- **Canonical manifest:** `plugin.json` (schema at `packages/plugin-system/src/schemas/plugin.schema.json`) is the source of truth for plugin metadata, replacing ad-hoc filename conventions.
- **Styling contract:** Plugins must use semantic CSS tokens from the shared design system. Hardcoded colors are forbidden. See `docs/PLUGIN_STYLING_CONTRACT.md`.
- **Activation granularity:** Changed from "one org = one artifact" to "namespace:type as the activatable unit." Config can enable `{ "univie": { "types": ["sidebar", "footer"] } }` to load only specific modules.

These changes maintain backward compatibility with existing plugins while enabling finer-grained control and a clearer contract for external plugin authors.

## Review

- **Last Reviewed:** 2026-04-13
- **Next Review:** When adding major new extension point types or changing the manifest schema

## Status History

- 2025-11-12: Accepted - Initial ADR documenting current architecture
- 2026-04-13: Updated - Multi-entry JARs, unified loading, canonical manifest, styling contract
