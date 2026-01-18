# Management UI

A modular, plugin-based video content management system built for educational institutions. This system provides a flexible architecture for managing video series, episodes, and content workflows with extensive customization capabilities.

## 🏗️ Architecture Overview

Management UI is built as a **monorepo** using **Turborepo**, structured around three core concepts:

- **Apps**: Domain-specific applications for content management
- **Packages**: Shared infrastructure and framework libraries
- **Plugins**: Extension points and university-specific customizations

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

plugins/        ← Extension point definitions
├─ core/        ← Core extension points
├─ tuwien/      ← TU Wien specific implementations
├─ univie/      ← University of Vienna implementations
└─ example-university/  ← Example implementations
```

## 📚 Documentation

**🤖 For AI Models:** Start with the [AI Development Guide](docs/AI_DEVELOPMENT_GUIDE.md) - your entry point for understanding and contributing to this codebase.

### Core Documentation

- **[AI Development Guide](docs/AI_DEVELOPMENT_GUIDE.md)** - Main entry point for AI models and new developers
- **[Package Ecosystem](/packages/README.md)** - Shared infrastructure packages and dependency management
- **[Application Architecture](/apps/README.md)** - Domain applications and dual-mode execution
- **[Plugin System](/plugins/README.md)** - Extension points and university customizations
- **[Coupling Analysis](/docs/internal/COUPLING_ANALYSIS.md)** - Package dependencies and refactoring priorities

### Configuration & Assets

- **[Config Generation](/docs/CONFIG_GENERATION.md)** - How configuration works in dev vs production
- **[Config Order](/docs/CONFIG_ORDER.md)** - Plugin configuration precedence and merging
- **[Favicon Configuration](/docs/internal/FAVICON_CONFIGURATION.md)** - Customizing favicons and assets per university

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

The Management UI features a sophisticated plugin system that allows institutions to customize functionality without modifying core code. Each university now has its own independent plugin package with standalone execution capabilities.

### Plugin Structure

```
plugins/
├── core/                    # Core extension points and implementations
├── tuwien/                  # TU Wien specific plugins and apps (Port 3005)
├── univie/                  # University of Vienna plugins (Port 3006)
└── example-university/      # Example implementations (Port 3007)
```

### Standalone Plugin Apps

Each university can create standalone applications that run independently:

```bash
# TU Wien plugin app
cd plugins/tuwien
pnpm dev    # Runs on http://127.0.0.1:3005

# University of Vienna plugin app
cd plugins/univie
pnpm dev    # Runs on http://127.0.0.1:3006
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
// plugins/my-university/main.tsx
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import { MyUniversityApp } from "./apps/MyUniversityApp";

const config = {
  baseUrl: "/my-university",
  appName: "plugin-my-university",
};

bootstrapStandaloneApp(MyUniversityApp, "root", config);
```

```typescript
// plugins/my-university/apps/MyUniversityApp.tsx
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

- **TU Wien** (`plugins/tuwien/`): Header, footer, sidebar, and upload ACL implementations
- **University of Vienna** (`plugins/univie/`): Custom sidebar and empty state components
- **Example University** (`plugins/example-university/`): Reference implementations

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
- `.env.example` - Example configuration with all available options
- `turbo.json` - Build pipeline configuration

#### Opencast Thumbnail Configuration

If your Opencast instance uses different tags for preview images, you can configure them via environment variables:

```bash
# The channel ID to retrieve thumbnail images from (default: engage-player)
OPENCAST_THUMBNAIL_CHANNEL_ID=engage-player

# The MediaPackage element flavor for thumbnail images (default: presenter/search+preview)
# Common alternatives: presenter/thumbnail, presenter/player+preview
OPENCAST_THUMBNAIL_FLAVOR=presenter/search+preview
```

These settings control which preview images are displayed in the gallery view of the episodes table.

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
