# Management UI

A modular, plugin-based video content management system built for educational institutions. This system provides a flexible architecture for managing video series, episodes, and content workflows with extensive customization capabilities.

## 🏗️ Architecture Overview

Management UI is built as a **monorepo** using **Turborepo**, structured around three core concepts:

- **Apps**: Domain-specific applications for content management
- **Packages**: Shared infrastructure and framework libraries
- **Plugins**: Extension points, built-in shared plugins, and externally deployable org customizations

```
apps/           ← Content management applications
├─ core/        ← Main application shell and orchestration
├─ series/      ← Video series management
├─ episodes/    ← Individual episode management
├─ upload/      ← Content upload and processing
└─ test/        ← Testing and QA tools

packages/       ← Shared infrastructure libraries
├─ plugin-system/  ← Plugin architecture and runtime
├─ app-runtime/    ← Standalone app execution and runtime abstraction
├─ ui/             ← Shared component library
├─ query/          ← Data fetching and state management
├─ router/         ← Application routing
├─ i18n/           ← Internationalization
└─ ...

plugins/        ← Built-in plugins shipped with the core repo
├─ core/        ← Core extension points and default implementations
├─ admin-*      ← Optional shared plugins shipped with core
└─ example/     ← Minimal reference plugin

.local-plugins/ ← External org/plugin checkout for development
└─ <org-or-plugin>/     ← Org-specific or privately shared plugins
```

## 📚 Documentation

**🤖 For AI Models:** Start with [`llms.txt`](llms.txt) for a quick summary, then read the [AI Development Guide](docs/AI_DEVELOPMENT_GUIDE.md) for full context. When you're ready to write or modify a plugin, read [`AGENTS.md`](AGENTS.md) for the operational rules.

### Core Documentation

- **[AGENTS.md](AGENTS.md)** - Operational rules for AI coding agents working on plugins
- **[AI Development Guide](docs/AI_DEVELOPMENT_GUIDE.md)** - Main entry point for AI models and new developers
- **[`llms.txt`](llms.txt)** - Machine-readable project summary for LLMs
- **[Package Ecosystem](/packages/README.md)** - Shared infrastructure packages and dependency management
- **[Application Architecture](/apps/README.md)** - Domain applications and dual-mode execution
- **[Plugin System](/plugins/README.md)** - Extension points and university customizations
- **[Coupling Analysis](/docs/internal/COUPLING_ANALYSIS.md)** - Package dependencies and refactoring priorities

### Plugin Development

- **[Community Plugin Development](docs/COMMUNITY_PLUGIN_DEVELOPMENT.md)** - Full plugin lifecycle guide
- **[Plugin Styling Contract](docs/PLUGIN_STYLING_CONTRACT.md)** - CSS/theming rules for plugins
- **[Plugin Loading Mechanisms](docs/PLUGIN_LOADING_MECHANISMS.md)** - All loading paths explained
- **[Plugin Manifest Schema](packages/plugin-system/src/schemas/plugin.schema.json)** - Canonical `plugin.json` schema

### Configuration & Assets

- **[Configuration](/docs/architecture/CONFIGURATION.md)** - Canonical layer model, `definePluginConfig` reader API, `enabledPlugins` vs. per-slice `enabled`
- **[Favicon Configuration](/docs/internal/FAVICON_CONFIGURATION.md)** - Customizing favicons and assets per university

### Testing

- **[Testing](/docs/TESTING.md)** - Test pyramid (unit / contract / E2E), `@workspace/plugin-testing` harness, Playwright setup, CI layout, deferred follow-ups

### Project Status

- **[Open Follow-ups](/docs/OPEN_FOLLOWUPS.md)** - Committed index of every "we know about this but we're not doing it now" item across the repo (architectural decisions deferred to a later phase, items waiting on upstream, items waiting on the 1.0 cut, etc.). Start here when you want to see what's pending.

### Development Workflows

Step-by-step guides for common tasks:

- **[Adding Packages](/docs/workflows/ADDING_PACKAGES.md)** - Create new workspace packages
- **[Adding Apps](/docs/workflows/ADDING_APPS.md)** - Create new applications
- **[Adding Plugins](/docs/workflows/ADDING_PLUGINS.md)** - Create university-specific plugins
- **[Updating Dependencies](/docs/workflows/UPDATING_DEPENDENCIES.md)** - Safe dependency updates
- **[Swapping Technologies](/docs/workflows/SWAPPING_TECHNOLOGIES.md)** - Replace underlying technologies

### Documentation Templates

Ensure consistency when creating documentation:

- **[Package README Template](/docs/templates/PACKAGE_README_TEMPLATE.md)** - For workspace packages
- **[App README Template](/docs/templates/APP_README_TEMPLATE.md)** - For applications
- **[Plugin README Template](/docs/templates/PLUGIN_README_TEMPLATE.md)** - For plugins
- **[Implementation README Template](/docs/templates/IMPLEMENTATION_README_TEMPLATE.md)** - For plugin implementations

### Architecture Decisions

Understanding why the system is designed this way:

- **[Architecture Decision Records](/docs/architecture/)** - Key architectural decisions and rationale

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10.4.1

### Installation

```bash
# Clone the repository
git clone https://github.com/eduardklinger/management-ui.git
cd management-ui

# Install dependencies
pnpm install

# Build applications and packages
pnpm build

# Start development servers
pnpm dev
```

### Standalone App Development

Applications can now run independently for focused development:

```bash
# Run individual apps standalone
cd apps/management-ui-episodes
pnpm dev    # http://127.0.0.1:3002

cd apps/management-ui-series
pnpm dev    # http://127.0.0.1:3001

cd apps/management-ui-upload
pnpm dev    # http://127.0.0.1:3003
```

Standalone apps have full provider context including router, authentication, and plugin system support.

### Development Commands

```bash
# Development
pnpm dev          # Start all applications in development mode
pnpm build        # Build all applications and packages
pnpm lint         # Run linting across all packages
pnpm check-types  # Type check all TypeScript code
pnpm clean        # Clean build artifacts and dependencies
```

## 🧩 Plugin System

The Management UI features a plugin system that keeps the core small and lets institutions ship their own customizations independently.

- `plugins/core` contains mandatory extension points and default implementations.
- Built-in shared plugins live in `plugins/` when they ship with the core repo but remain optional.
- Org-specific plugins live in `.local-plugins/` or separate repositories and are loaded dynamically in dev or via JAR/registry in production.

### Plugin Structure

```
plugins/
├── core/                    # Core extension points and default implementations
├── admin-marketplace/       # Built-in optional shared plugin
└── example/                 # Minimal reference plugin

.local-plugins/
└── my-org/                  # Org-specific plugin checkout
```

### Standalone Plugin Apps

Each university can create standalone applications that run independently:

```bash
# Org plugins live in .local-plugins/ (e.g. univie, tuwien)
cd .local-plugins/my-org
pnpm build && pnpm dev   # Build then run standalone, or use core in dev to load from /local-plugins/
```

### Extension Points

- **Layout & Navigation**: Customize headers, sidebars, footers, and branding
- **Content Management**: Add custom metadata fields, validation rules, and workflows
- **User Interface**: Override components with institution-specific implementations
- **Data Processing**: Extend content transformation and processing pipelines
- **App Registration**: Register new applications that integrate with the core shell

### App Registration

Plugins can register complete applications that appear in the main navigation:

```typescript
import { createPlugin } from "@workspace/plugin-system";
import { MyCustomApp } from "./MyCustomApp";

export const MyUniversityAppPlugin = createPlugin({
  namespace: "myuni",
  type: "app",
  version: "1.0.0",

  initialize(manager) {
    // Register a new application
    manager.registerObject("apps:definitions", "my-custom-app", {
      id: "my-custom-app",
      name: "My Custom App",
      routePath: "/my-custom",
      component: MyCustomApp,
      navigation: {
        title: "Custom App",
        icon: "star",
        order: 100,
        permissions: ["access.custom.app"],
      },
    });
  },
});
```

### Standalone Plugin Development

Plugin apps can run both within the core shell and as standalone applications:

```typescript
// .local-plugins/my-university/main.tsx
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import { MyUniversityApp } from "./apps/MyUniversityApp";

const config = {
  baseUrl: "/my-university",
  appName: "plugin-my-university",
};

bootstrapStandaloneApp(MyUniversityApp, "root", config);
```

```typescript
// .local-plugins/my-university/apps/MyUniversityApp.tsx
import { AdaptiveAppWrapper } from '@workspace/app-runtime';

export const MyUniversityApp: React.FC = () => (
  <AdaptiveAppWrapper>
    <MyAppContent />
  </AdaptiveAppWrapper>
);
```

For detailed plugin development, see [`plugins/README.md`](./plugins/README.md).

## 🚀 Standalone App Development

Applications in Management UI can run both within the core shell and as standalone development servers. This dual-mode capability accelerates development and testing.

### Creating Standalone Apps

Use the app runtime system to bootstrap standalone applications:

```typescript
// apps/my-app/src/main.tsx
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

// Configure the app for standalone execution
const config = {
  baseUrl: "/my-app",
  appName: "management-ui-my-app",
};

// Provides full context: router, auth, plugins, query client
bootstrapStandaloneApp(App, "root", config);
```

The `bootstrapStandaloneApp` function now requires a configuration object that specifies:

- `baseUrl`: The base URL path for the app (e.g., "/episodes", "/series")
- `appName`: The application name for identification and routing
- Additional runtime configuration options as needed

### Adaptive App Components

Apps can automatically adapt to their execution context:

```typescript
// apps/my-app/src/App.tsx
import { AdaptiveAppWrapper } from '@workspace/app-runtime';

const App = () => (
  <AdaptiveAppWrapper>
    <MyAppContent />
  </AdaptiveAppWrapper>
);
```

### Standalone Development Workflow

```bash
# Develop app in isolation
cd apps/management-ui-episodes
pnpm dev    # Runs on http://127.0.0.1:3002

# Test in core shell context
cd apps/management-ui-core
pnpm dev    # Access at http://127.0.0.1:3000/episodes
```

### Benefits

- **Faster Development**: Focus on single app without loading entire shell
- **Full Context**: Router, authentication, and plugin system available
- **Hot Reload**: Fast refresh for individual app changes
- **Easy Testing**: Test app behavior in isolation
- **Plugin Development**: Test app registration and integration

## 📦 Applications

### Core Applications

| Application                | Purpose            | Description                                                 |
| -------------------------- | ------------------ | ----------------------------------------------------------- |
| **management-ui-core**     | Application Shell  | Main orchestration layer, plugin loading, and shared layout |
| **management-ui-series**   | Series Management  | Video series creation, editing, and organization            |
| **management-ui-episodes** | Episode Management | Individual episode metadata, upload status, and workflows   |
| **management-ui-upload**   | Content Upload     | File upload, processing, and content ingestion              |
| **management-ui-test**     | Testing & QA       | Quality assurance tools and testing utilities               |

### Shared Packages

| Package           | Purpose                         | Description                                                                    |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| **plugin-system** | Plugin Architecture             | Core plugin loading, management, and extension point system                    |
| **app-runtime**   | Standalone Apps                 | Runtime abstraction for standalone app execution and provider hierarchy        |
| **ui**            | Component Library               | Shared React components, design system, and UI patterns                        |
| **query**         | Data Management & Configuration | GraphQL client, state management, data fetching, and application configuration |
| **router**        | Navigation                      | Application routing with plugin-aware route management                         |
| **i18n**          | Internationalization            | Multi-language support and localization                                        |

## 🎨 Customization

### University-Specific Implementations

The system supports extensive customization through plugins:

- **Example plugin** (`plugins/example/`): Minimal brand-neutral reference implementation (in-repo)
- **Org plugins** (e.g. TU Wien, University of Vienna): Use `.local-plugins/<name>/` or separate repos; see [Community Plugin Development](docs/COMMUNITY_PLUGIN_DEVELOPMENT.md)

### Branding & Theming

Customize the interface appearance:

```typescript
// University branding plugin
manager.registerObject("app:branding", "university-theme", {
  primaryColor: "#your-color",
  secondaryColor: "#your-secondary",
  logoUrl: "/path/to/logo.png",
  favicon: "/path/to/favicon.ico",
});
```

### Custom Workflows

Add institution-specific content workflows:

```typescript
// Custom approval workflow
manager.registerObject("workflows:definitions", "university-approval", {
  name: "University Content Approval",
  steps: ["submission", "review", "approval", "publication"],
  permissions: ["content.submit", "content.review", "content.approve"],
});
```

## 🔧 Development

### Monorepo Structure

This project uses **Turborepo** for efficient monorepo management:

- **Incremental builds**: Only rebuild changed packages
- **Task pipelines**: Coordinated build and test execution
- **Remote caching**: Shared build artifacts across team members

### Adding New Packages

```bash
# Create new package
mkdir packages/my-new-package
cd packages/my-new-package

# Initialize package
pnpm init
```

### Adding New Apps

```bash
# Create new app
mkdir apps/my-new-app
cd apps/my-new-app

# Initialize with standalone support
pnpm init
# Add @workspace/app-runtime dependency
# Use bootstrapStandaloneApp in main.tsx
```

### App Development Patterns

**Standalone Bootstrap Pattern**:

```typescript
// main.tsx - supports both standalone and core shell execution
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

const config = {
  baseUrl: "/my-app",
  appName: "management-ui-my-app",
};

bootstrapStandaloneApp(App, "root", config);
```

**Adaptive Component Pattern**:

```typescript
// App.tsx - automatically adapts to execution context
import { AdaptiveAppWrapper } from '@workspace/app-runtime';

const App = () => (
  <AdaptiveAppWrapper>
    <MyAppContent />
  </AdaptiveAppWrapper>
);
```

### Plugin Development

1. **Define Extension Points**: Create plugin definitions in `plugins/`
2. **Implement Extensions**: Add university-specific implementations
3. **Register Components**: Use the plugin manager to register functionality
4. **Register Apps**: Add complete applications via the plugin system
5. **Test Integration**: Verify plugins work with core applications

**App Registration Pattern**:

```typescript
// plugins/myuni/apps/my-app-plugin.ts
export const myAppPlugin = createPlugin({
  namespace: "myuni",
  type: "app",
  version: "1.0.0",

  initialize(manager) {
    manager.registerObject("apps:definitions", "my-app", {
      id: "my-app",
      name: "My Custom App",
      routePath: "/my-app",
      component: MyAppComponent,
      navigation: {
        title: "My App",
        icon: "app-window",
        order: 200,
      },
    });
  },
});
```

## 🚦 Deployment

### Build for Production

```bash
# Build all packages and applications
pnpm build

# Preview production build
pnpm preview

# Test standalone apps
cd apps/management-ui-episodes && pnpm dev
cd apps/management-ui-series && pnpm dev
```

### Configuration

The system supports environment-specific configuration:

- `.env.development` - Development settings
- `.env.production` - Production settings
- `turbo.json` - Build pipeline configuration

## 📚 Documentation

- **Plugin System**: [`packages/plugin-system/docs/README.md`](./packages/plugin-system/docs/README.md)
- **Plugin Development**: [`plugins/README.md`](./plugins/README.md)
- **Core Application**: [`apps/management-ui-core/README.md`](./apps/management-ui-core/README.md)
- **Archived Documentation**: [`docs/internal/`](./docs/internal/) - Historical technical documentation

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Develop** following the plugin architecture patterns
4. **Test** across multiple university configurations
5. **Submit** a pull request with clear documentation

## 📄 License

This project is maintained by educational institutions and follows open source principles. See individual package licenses for specific terms.

## 🔗 Related Projects

- **Backend**: Content processing and API services
- **Assemblies**: Deployment and infrastructure configuration
- **Extensions**: University-specific plugin implementations

---
