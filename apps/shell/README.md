# Management UI Core

The **Application Shell** and orchestration layer for the Management UI system. This core application provides the foundational runtime environment, plugin loading infrastructure, and shared layout components that tie together all other applications in the management UI ecosystem.

## 🎯 Purpose

Management UI Core serves as the **"Appshell"** - the main container that:

- **Loads and manages plugins** from different university implementations
- **Provides shared layout** (headers, sidebars, navigation) across all applications
- **Orchestrates routing** between different content management apps
- **Manages authentication** and authorization state
- **Handles theme and branding** customizations from plugins

## 🏛️ Architecture

### Application Shell Pattern

```
┌─────────────────────────────────────────────────┐
│ Management UI Core (Appshell)                   │
├─────────────────────────────────────────────────┤
│ 🔌 Plugin System                               │
│ ├─ University Branding                          │
│ ├─ Custom Navigation                            │
│ └─ Extension Points                             │
├─────────────────────────────────────────────────┤
│ 🖼️  Shared Layout                              │
│ ├─ Header (customizable)                        │
│ ├─ Sidebar (plugin-driven)                      │
│ ├─ Main Content Area                            │
│ └─ Footer (customizable)                        │
├─────────────────────────────────────────────────┤
│ 🧭 Dynamic App Loading                         │
│ ├─ /series     → management-ui-series          │
│ ├─ /episodes   → management-ui-episodes        │
│ ├─ /upload     → management-ui-upload          │
│ └─ /test       → management-ui-test            │
└─────────────────────────────────────────────────┘
```

### Key Responsibilities

1. **Plugin Orchestration**
   - Load and initialize university-specific plugins
   - Manage plugin lifecycle (activate/deactivate)
   - Provide plugin API and extension points

2. **Layout Management**
   - Render shared header, sidebar, and footer components
   - Handle responsive layout and mobile navigation
   - Manage theme switching and branding

3. **Routing Coordination**
   - Route requests to appropriate sub-applications
   - Handle authentication-protected routes
   - Manage navigation state and breadcrumbs

4. **State Management**
   - User authentication and session management
   - Global application state (theme, language, preferences)
   - Plugin-specific state coordination

## 🔧 Technology Stack

- **React 19** - Modern React with concurrent features
- **Vite** - Fast development server and build tool
- **TanStack Router** - Type-safe routing with plugin awareness
- **TanStack Query** - Server state management and caching
- **Tailwind CSS** - Utility-first styling with plugin customizations

## 🚀 Development

### Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- Dependencies installed at monorepo root

### Local Development

```bash
# From monorepo root
pnpm dev

# Or run only this app
cd apps/management-ui-core
pnpm dev
```

### Build

```bash
# Production build
pnpm build

# Type checking
pnpm check-types

# Linting
pnpm lint
```

## 🔌 Plugin Integration

### Extension Points

The core application provides these extension points for university customization:

#### Layout Extensions

```typescript
// Custom header component
manager.registerComponent("app:header", UniversityHeader);

// Custom sidebar navigation
manager.registerObject("sidebar:nav-items", "custom-nav", {
  title: "University Portal",
  path: "/portal",
  icon: "building-2",
});

// Custom footer
manager.registerComponent("app:footer", UniversityFooter);
```

#### Branding Extensions

```typescript
// University branding
manager.registerObject("app:branding", "university-theme", {
  primaryColor: "#003366",
  logoUrl: "/assets/university-logo.png",
  favicon: "/assets/favicon.ico",
});
```

#### Authentication Extensions

```typescript
// Custom authentication provider
manager.registerObject("auth:provider", "university-sso", {
  loginUrl: "/auth/university-login",
  logoutUrl: "/auth/logout",
  userInfoEndpoint: "/auth/me",
});
```

### Loading Plugins

Plugins are automatically discovered and loaded from:

- `plugins/core/` - Core system plugins
- Org plugins (e.g. tuwien, univie) live in `.local-plugins/` or separate repos; see [Community Plugin Development](/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md)
- `plugins/example-university/` - Example reference implementations

## 🎨 Customization

### University-Specific Layouts

Each university can customize the core layout:

```typescript
// TU Wien header implementation
const TUWienHeader = () => (
  <header className="bg-tuwien-blue">
    <img src="/tuwien-logo.png" alt="TU Wien" />
    <nav>
      <Link to="/series">Video Series</Link>
      <Link to="/policies">University Policies</Link>
    </nav>
  </header>
);
```

### Theme Customization

Universities can override CSS variables and Tailwind configuration:

```css
/* University-specific theme variables */
:root {
  --primary-color: #003366;
  --secondary-color: #0066cc;
  --accent-color: #ffcc00;
}
```

## 🔐 Authentication & Authorization

The core handles authentication through:

1. **Plugin-based Auth Providers**: Universities can implement custom SSO
2. **Role-based Access Control**: Integration with university permission systems
3. **Route Protection**: Automatic route guarding based on user permissions

## 📁 File Structure

```
apps/management-ui-core/
├── src/
│   ├── components/          # Shared layout components
│   │   ├── Header.tsx       # Main header component
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── Footer.tsx       # Footer component
│   │   └── Layout.tsx       # Root layout wrapper
│   ├── plugins/             # Plugin loading and management
│   │   ├── PluginManager.ts # Plugin lifecycle management
│   │   └── extensionPoints.ts # Core extension point definitions
│   ├── routes/              # Application routing
│   │   ├── index.tsx        # Route definitions
│   │   └── protected.tsx    # Authentication guards
│   ├── hooks/               # Shared React hooks
│   ├── providers/           # Context providers
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
├── package.json
└── vite.config.ts
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Integration tests with plugin loading
pnpm test:integration

# E2E tests across university configurations
pnpm test:e2e
```

## 🔄 Dynamic App Loading

The core coordinates loading of other management UI applications:

- **Series Management** (`/series`) - Dynamically loads `management-ui-series`
- **Episode Management** (`/episodes`) - Dynamically loads `management-ui-episodes`
- **Upload Portal** (`/upload`) - Dynamically loads `management-ui-upload`
- **Testing Tools** (`/test`) - Dynamically loads `management-ui-test`

This architecture allows each application to be developed and deployed independently while maintaining a cohesive user experience.

## 📚 Related Documentation

- **Plugin System**: [`../../packages/plugin-system/docs/README.md`](../../packages/plugin-system/docs/README.md)
- **Extension Points**: [`../../plugins/README.md`](../../plugins/README.md)
- **UI Components**: [`../../packages/ui/README.md`](../../packages/ui/README.md)

## 🤝 Contributing

When contributing to the core application:

1. **Maintain plugin compatibility** - Ensure changes don't break existing university plugins
2. **Follow extension patterns** - Use established extension points rather than hardcoding features
3. **Test across universities** - Verify changes work with TU Wien, UniVie, and example implementations
4. **Document new extension points** - Update plugin documentation for any new customization capabilities

The core application should remain **university-agnostic** while providing maximum flexibility for customization through the plugin system.
