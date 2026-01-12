# ADR-002: Monorepo Structure with Dependency Layers

**Status:** Accepted  
**Date:** 2025-11-12  
**Deciders:** Architecture Team

## Context

The Management UI system consists of multiple applications (series, episodes, upload), shared infrastructure packages (UI, query, router), and university-specific plugins. We need to decide how to organize this code to:

- Enable code sharing across applications
- Maintain clear boundaries between components
- Support independent deployment of applications
- Allow university-specific customizations
- Enable parallel development by multiple teams
- Simplify dependency management

## Decision

We will use a **monorepo structure with strict dependency layers** organized as:

```
┌─────────────────────────────────────────────────────┐
│ Application Layer                                   │
│ - app-runtime, providers, vite-config, ui-config    │
├─────────────────────────────────────────────────────┤
│ Integration Layer                                   │
│ - query, router, ui                                 │
├─────────────────────────────────────────────────────┤
│ Foundation Layer                                    │
│ - plugin-system, store, i18n                        │
├─────────────────────────────────────────────────────┤
│ Core Infrastructure                                 │
│ - utils, typescript-config, eslint-config,          │
│   tailwind-config                                   │
└─────────────────────────────────────────────────────┘
```

**Key Principles:**

1. **Layer Separation** - Lower layers never depend on higher layers
2. **Workspace Packages** - Shared code lives in `packages/` with `@workspace/*` scope
3. **Application Independence** - Apps in `apps/` depend on packages but not other apps
4. **Plugin Isolation** - Plugins in `plugins/` customize without modifying core
5. **Build Orchestration** - Turborepo coordinates builds across the monorepo

### Monorepo Tools

- **pnpm workspaces** - Package management and linking
- **Turborepo** - Build orchestration and caching
- **TypeScript Project References** - Type checking coordination

## Rationale

### Why Monorepo?

**Code Sharing:**

- Single source of truth for shared components
- Easy to extract and refactor shared code
- Consistent versions across all apps

**Atomic Changes:**

- Update multiple packages in single PR
- See impact of changes immediately
- Easier refactoring across boundaries

**Simplified Development:**

- Clone once, work on everything
- No complex submodule management
- Unified CI/CD pipeline

**Consistent Tooling:**

- Single TypeScript configuration
- Single linting configuration
- Single dependency management

### Why Dependency Layers?

**Prevents Circular Dependencies:**

- Clear direction: only depend downward
- Impossible to create cycles if followed

**Enables Independent Updates:**

- Core infrastructure has zero workspace deps → update anytime
- Foundation has minimal deps → update with little impact
- Integration layer abstracted → swappable
- Application layer orchestrates → expected high coupling

**Supports Technology Swapping:**

- Each layer has well-defined boundaries
- Integration layer abstracts third-party libs
- Can swap implementations without affecting higher layers

**Improves Understanding:**

- Clear mental model
- New developers quickly understand structure
- AI models can reason about impact

## Alternatives Considered

### Alternative 1: Polyrepo (Multiple Repositories)

**Approach:** Separate repository for each app and package

**Pros:**

- Complete independence
- Different teams own different repos
- Isolated version control

**Cons:**

- Complex dependency management
- Difficult to make atomic changes
- Submodule hell
- Duplication of configuration
- Hard to refactor across boundaries
- Inconsistent versions

**Why Rejected:** Overhead too high, defeats purpose of shared platform

### Alternative 2: Monolith (Single Application)

**Approach:** All code in single application

**Pros:**

- Simple deployment
- No dependency management
- Easy to start

**Cons:**

- No code organization
- Cannot deploy apps independently
- Everything couples to everything
- Large bundle sizes
- Hard to maintain

**Why Rejected:** Does not scale to multiple teams and applications

### Alternative 3: Flat Monorepo (No Layers)

**Approach:** Monorepo but packages can depend on anything

**Pros:**

- Maximum flexibility
- Easy to add dependencies

**Cons:**

- Circular dependencies inevitable
- Hard to understand impact
- Cannot swap technologies
- Coupling grows unbounded
- Updates become risky

**Why Rejected:** Leads to unmaintainable spaghetti

### Alternative 4: Microservices

**Approach:** Each app as completely independent service

**Pros:**

- Complete independence
- Different technologies
- Scalable deployment

**Cons:**

- Massive duplication
- Inconsistent UI/UX
- Complex integration
- Higher operational cost
- Overkill for our use case

**Why Rejected:** Too much overhead for frontend applications

## Consequences

### Positive

✅ **Code Sharing** - Easy to share components and utilities  
✅ **Atomic Changes** - Change multiple packages in one PR  
✅ **Clear Structure** - Layer model provides mental model  
✅ **Prevents Cycles** - Layer rules make circular deps impossible  
✅ **Independent Updates** - Core packages update without affecting all  
✅ **Technology Swapping** - Integration layer enables swapping  
✅ **Fast Builds** - Turborepo caching and parallelization  
✅ **Single CI/CD** - One pipeline for everything

### Negative

⚠️ **Build Complexity** - Turborepo learning curve  
⚠️ **Dependency Management** - pnpm workspaces can be tricky  
⚠️ **Layer Violations** - Requires discipline to maintain  
⚠️ **Larger Repository** - Single repo grows large  
⚠️ **Shared CI** - One slow package affects all  
⚠️ **Version Coupling** - External deps often shared (good and bad)

### Neutral

- **Team Coordination** - Need communication about shared packages
- **Documentation** - Each package needs documentation
- **Tooling Setup** - Initial setup more complex than single app

## Implementation Details

### Directory Structure

```
management-ui/
├── apps/                    # Applications
│   ├── management-ui-core/
│   ├── management-ui-series/
│   ├── management-ui-episodes/
│   ├── management-ui-upload/
│   └── management-ui-test/
├── packages/                # Shared packages (layers)
│   ├── utils/               # Core Infrastructure
│   ├── typescript-config/
│   ├── eslint-config/
│   ├── tailwind-config/
│   ├── plugin-system/       # Foundation
│   ├── store/
│   ├── i18n/
│   ├── query/               # Integration
│   ├── router/
│   ├── ui/
│   ├── app-runtime/         # Application
│   ├── providers/
│   ├── ui-config/
│   └── vite-config/
├── plugins/                 # University customizations
│   ├── core/
│   ├── tuwien/
│   ├── univie/
│   └── example-university/
├── package.json             # Root workspace
├── pnpm-workspace.yaml      # Workspace configuration
├── turbo.json               # Turborepo configuration
└── tsconfig.json            # Root TypeScript config
```

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "plugins"
  - "plugins/*"
```

### Build Orchestration

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // Build dependencies first
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Layer Enforcement

Enforced through:

1. **Documentation** - Clear rules in [COUPLING_ANALYSIS.md](/docs/COUPLING_ANALYSIS.md)
2. **Code Review** - Check dependencies in PRs
3. **Automated Tools** - (Future) dependency-cruiser for validation

## Dependency Layer Rules

### Core Infrastructure (Layer 0)

**Allowed Dependencies:**

- External packages only
- No workspace dependencies

**Purpose:** Foundation utilities used by all

**Examples:** utils, config packages

### Foundation (Layer 1)

**Allowed Dependencies:**

- Core Infrastructure
- External packages

**Purpose:** Core system capabilities

**Examples:** plugin-system, store, i18n

### Integration (Layer 2)

**Allowed Dependencies:**

- Foundation
- Core Infrastructure
- External packages

**Purpose:** Integrate third-party libraries

**Examples:** query (TanStack Query), router (TanStack Router), ui (Radix UI)

### Application (Layer 3)

**Allowed Dependencies:**

- All lower layers
- External packages

**Purpose:** Orchestration and composition

**Examples:** app-runtime, providers, vite-config

## Migration Strategy

If layer violations are found:

1. **Extract shared code** to lower layer
2. **Use dependency injection** to invert dependency
3. **Create interface** in lower layer, implementation in higher
4. **Document exception** if unavoidable (with justification)

## Related Decisions

- **ADR-001:** Plugin System - Plugins isolated in own directory
- **ADR-003:** Standalone Apps - Apps can be independent
- Coupling Analysis documents current state

## References

- [Package Ecosystem](/packages/README.md) - Package overview
- [Coupling Analysis](/docs/COUPLING_ANALYSIS.md) - Current dependency state
- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## Review

- **Last Reviewed:** 2025-11-12
- **Next Review:** When considering adding new packages or restructuring

## Status History

- 2025-11-12: Accepted - Initial ADR documenting current structure
