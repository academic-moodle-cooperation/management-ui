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

The Management UI features a sophisticated plugin system that allows institutions to customize functionality without modifying core code:

### Extension Points

- **Layout & Navigation**: Customize headers, sidebars, footers, and branding
- **Content Management**: Add custom metadata fields, validation rules, and workflows
- **User Interface**: Override components with institution-specific implementations
- **Data Processing**: Extend content transformation and processing pipelines

### Example Plugin

```typescript
import { createPlugin } from '@workspace/plugin-system';

export const MyUniversityPlugin = createPlugin({
  namespace: 'myuni',
  type: 'university-extension',
  version: '1.0.0',
  
  initialize(manager) {
    // Add custom navigation item
    manager.registerObject('sidebar:nav-items', 'university-policies', {
      title: 'University Policies',
      path: '/policies',
      icon: 'shield-check',
      order: 80
    });
    
    // Custom branding
    manager.registerObject('app:branding', 'university-theme', {
      primaryColor: '#003366',
      logoUrl: '/assets/university-logo.png'
    });
  }
});
```

For detailed plugin development, see [`packages/plugin-system/docs/README.md`](./packages/plugin-system/docs/README.md).

## 📦 Applications

### Core Applications

| Application | Purpose | Description |
|-------------|---------|-------------|
| **management-ui-core** | Application Shell | Main orchestration layer, plugin loading, and shared layout |
| **management-ui-series** | Series Management | Video series creation, editing, and organization |
| **management-ui-episodes** | Episode Management | Individual episode metadata, upload status, and workflows |
| **management-ui-upload** | Content Upload | File upload, processing, and content ingestion |
| **management-ui-test** | Testing & QA | Quality assurance tools and testing utilities |

### Shared Packages

| Package | Purpose | Description |
|---------|---------|-------------|
| **plugin-system** | Plugin Architecture | Core plugin loading, management, and extension point system |
| **ui** | Component Library | Shared React components, design system, and UI patterns |
| **query** | Data Management & Configuration | GraphQL client, state management, data fetching, and application configuration |
| **router** | Navigation | Application routing with plugin-aware route management |
| **i18n** | Internationalization | Multi-language support and localization |

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
manager.registerObject('app:branding', 'university-theme', {
  primaryColor: '#your-color',
  secondaryColor: '#your-secondary',
  logoUrl: '/path/to/logo.png',
  favicon: '/path/to/favicon.ico'
});
```

### Custom Workflows

Add institution-specific content workflows:

```typescript
// Custom approval workflow
manager.registerObject('workflows:definitions', 'university-approval', {
  name: 'University Content Approval',
  steps: ['submission', 'review', 'approval', 'publication'],
  permissions: ['content.submit', 'content.review', 'content.approve']
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

### Plugin Development

1. **Define Extension Points**: Create plugin definitions in `plugins/`
2. **Implement Extensions**: Add university-specific implementations
3. **Register Components**: Use the plugin manager to register functionality
4. **Test Integration**: Verify plugins work with core applications

## 🚦 Deployment

### Build for Production

```bash
# Build all packages and applications
pnpm build

# Preview production build
pnpm preview
```

### Configuration

The system supports environment-specific configuration:

- `.env.development` - Development settings
- `.env.production` - Production settings  
- `turbo.json` - Build pipeline configuration

## 📚 Documentation

- **Plugin System**: [`packages/plugin-system/docs/README.md`](./packages/plugin-system/docs/README.md)
- **Core Application**: [`apps/management-ui-core/README.md`](./apps/management-ui-core/README.md)
- **Archived Documentation**: [`docs/archive/`](./docs/archive/) - Historical technical documentation

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

