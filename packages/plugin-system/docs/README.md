# Plugin System Documentation

The core plugin architecture for the Management UI system. This package provides the foundational plugin loading, management, and extension point system that enables university-specific customizations without modifying core application code.

## 🎯 Overview

The plugin system enables **controlled extensibility** where:

- **Core applications** define extension points (what can be customized)
- **University plugins** implement extensions (how it's customized)  
- **Plugin manager** coordinates loading and lifecycle management

```
┌─────────────────────────────────────────────────┐
│ Plugin System Architecture                      │
├─────────────────────────────────────────────────┤
│ 🏗️  Extension Points (Core)                    │
│ ├─ sidebar:nav-items                            │
│ ├─ app:header                                   │
│ ├─ app:branding                                 │
│ └─ metadata:fields                              │
├─────────────────────────────────────────────────┤
│ 🔧 Plugin Manager                              │
│ ├─ Plugin Discovery & Loading                   │
│ ├─ Component Registration                       │
│ ├─ Object Management                            │
│ └─ Lifecycle Coordination                       │
├─────────────────────────────────────────────────┤
│ 🏛️  University Implementations                │
│ ├─ TU Wien Plugins                             │
│ ├─ University of Vienna Plugins                │
│ └─ Example University Plugins                  │
└─────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Creating a Plugin

```typescript
import { createPlugin } from '@workspace/plugin-system';
import { MyCustomComponent } from './MyCustomComponent';

export const MyUniversityPlugin = createPlugin({
  namespace: 'myuni',
  type: 'university-extension',
  version: '1.0.0',
  
  initialize(manager) {
    // Register a custom component
    manager.registerComponent(
      'app:header',
      MyCustomComponent,
      { priority: 10 }
    );
    
    // Register configuration data
    manager.registerObject(
      'app:branding',
      'university-theme',
      {
        primaryColor: '#003366',
        logoUrl: '/assets/university-logo.png'
      }
    );
  },
  
  activate() {
    console.log('MyUniversityPlugin activated');
  },
  
  deactivate() {
    console.log('MyUniversityPlugin deactivated');
  }
});
```

### Using Components from Plugins

```tsx
import { ComponentResolver } from '@workspace/plugin-system';

function AppLayout() {
  return (
    <div className="app-layout">
      {/* Header with plugin customizations */}
      <ComponentResolver
        componentType="app:header"
        defaultComponent={DefaultHeader}
        componentProps={{ user: currentUser }}
      />
      
      <main>
        {/* Main content area */}
        <ComponentResolver
          componentType="content:main"
          defaultComponent={() => <div>Default content</div>}
        />
      </main>
      
      {/* Footer with plugin customizations */}
      <ComponentResolver
        componentType="app:footer"
        defaultComponent={DefaultFooter}
      />
    </div>
  );
}
```

## 🔧 Core Concepts

### 1. **Extension Points**

Defined locations where plugins can add or override functionality:

```typescript
// Core application defines extension points
manager.defineExtensionPoint('sidebar:nav-items', {
  description: 'Navigation items in the main sidebar',
  expectedSchema: {
    title: 'string',
    path: 'string', 
    icon: 'string|Component',
    order: 'number',
    permissions: 'string[]'
  }
});
```

### 2. **Plugin Registration**

Plugins register components and objects at extension points:

```typescript
// University plugin implements extension points
manager.registerObject('sidebar:nav-items', 'university-portal', {
  title: 'University Portal',
  path: '/portal',
  icon: 'building-2',
  order: 50,
  permissions: ['portal.access']
});
```

### 3. **Component Resolution**

The plugin system resolves which components to render:

```typescript
// Plugin system finds best matching component
const HeaderComponent = manager.resolveComponent('app:header', {
  fallback: DefaultHeader,
  filter: (plugin) => plugin.isActive,
  sort: (a, b) => a.priority - b.priority
});
```

## 🏗️ Architecture

### Plugin Manager

The central coordination system:

- **Discovery**: Automatically finds and loads plugins
- **Registration**: Manages component and object registration
- **Resolution**: Determines which components to use
- **Lifecycle**: Handles plugin activation/deactivation

### Extension Point Types

1. **Component Extensions**: Replace or enhance UI components
2. **Object Extensions**: Provide configuration and data
3. **Function Extensions**: Add custom business logic
4. **Route Extensions**: Define custom application routes

### Priority System

Multiple plugins can target the same extension point:

```typescript
// Higher priority (lower number) wins
manager.registerComponent('app:header', TUWienHeader, { priority: 10 });
manager.registerComponent('app:header', GenericHeader, { priority: 50 });

// TUWienHeader will be used
```

## 🎨 Extension Points Reference

### Layout Extensions

- `app:header` - Main application header
- `app:footer` - Application footer
- `app:sidebar` - Main navigation sidebar
- `app:branding` - Theme colors, logos, and styling

### Navigation Extensions

- `sidebar:nav-items` - Main navigation menu items
- `sidebar:user-items` - User-specific menu items
- `sidebar:admin-items` - Administrative menu items

### Content Extensions

- `metadata:fields` - Custom metadata input fields
- `content:validators` - Custom validation rules
- `workflows:definitions` - Custom approval workflows
- `content:transformers` - Custom content processing

### Authentication Extensions

- `auth:provider` - Custom authentication providers
- `auth:permissions` - Custom permission systems
- `auth:user-profile` - User profile customizations

## 🧪 Testing Plugins

### Unit Testing

```typescript
import { PluginManager } from '@workspace/plugin-system';
import { MyUniversityPlugin } from './MyUniversityPlugin';

describe('MyUniversityPlugin', () => {
  let manager: PluginManager;
  
  beforeEach(() => {
    manager = new PluginManager();
    MyUniversityPlugin.initialize(manager);
  });
  
  it('should register header component', () => {
    const header = manager.resolveComponent('app:header');
    expect(header).toBeDefined();
  });
  
  it('should provide branding configuration', () => {
    const branding = manager.getObject('app:branding', 'university-theme');
    expect(branding.primaryColor).toBe('#003366');
  });
});
```

### Integration Testing

```typescript
import { render } from '@testing-library/react';
import { ComponentResolver } from '@workspace/plugin-system';

it('should render university header', () => {
  const { getByText } = render(
    <ComponentResolver
      componentType="app:header"
      componentProps={{ title: 'Test App' }}
    />
  );
  
  expect(getByText('University Logo')).toBeInTheDocument();
});
```

## 📦 Package Structure

```
packages/plugin-system/
├── src/
│   ├── core/                    # Core plugin system
│   │   ├── PluginManager.ts     # Main plugin manager
│   │   ├── Plugin.ts            # Plugin base class
│   │   └── ExtensionPoint.ts    # Extension point definitions
│   ├── components/              # React integration
│   │   ├── ComponentResolver.tsx # Component resolution
│   │   ├── PluginProvider.tsx   # React context provider
│   │   └── hooks.ts             # React hooks for plugins
│   ├── types/                   # TypeScript definitions
│   │   ├── Plugin.ts            # Plugin interfaces
│   │   ├── ExtensionPoint.ts    # Extension point types
│   │   └── ComponentResolver.ts # Component resolver types
│   └── index.ts                 # Public API exports
├── docs/                        # Documentation
├── package.json
└── README.md
```

## 🔄 Migration Guide

### From Old System

The archived documentation contains detailed migration information:

- **Migration Guide**: [`../../../docs/archive/packages/plugin-system/docs/migration-guide.md`](../../../docs/archive/packages/plugin-system/docs/migration-guide.md)
- **Plugin System Guide**: [`../../../docs/archive/packages/plugin-system/docs/plugin-system-guide.md`](../../../docs/archive/packages/plugin-system/docs/plugin-system-guide.md)  
- **Naming Conventions**: [`../../../docs/archive/packages/plugin-system/docs/plugin-naming-conventions.md`](../../../docs/archive/packages/plugin-system/docs/plugin-naming-conventions.md)

### Key Changes

1. **Unified API**: Single plugin manager for all extension types
2. **Type Safety**: Full TypeScript support for plugin development
3. **React Integration**: Built-in React hooks and components
4. **Performance**: Optimized component resolution and caching

## 🤝 Contributing

### Plugin Development Guidelines

1. **Follow naming conventions**: Use consistent `namespace:type` patterns
2. **Document extension points**: Provide clear schemas and examples
3. **Test thoroughly**: Include unit and integration tests
4. **Version properly**: Use semantic versioning for plugin releases

### Adding Extension Points

1. **Identify need**: What should be customizable?
2. **Design API**: Define clear parameters and expected behavior
3. **Document thoroughly**: Include schema, examples, and usage patterns
4. **Test implementations**: Verify extension points work as expected

## 📚 Examples

### University Header Plugin

```typescript
import { createPlugin } from '@workspace/plugin-system';

export const UniversityHeaderPlugin = createPlugin({
  namespace: 'university',
  type: 'header',
  version: '1.0.0',
  
  initialize(manager) {
    manager.registerComponent('app:header', ({ user }) => (
      <header className="bg-university-blue text-white p-4">
        <div className="flex items-center justify-between">
          <img src="/university-logo.png" alt="University" className="h-8" />
          <nav className="space-x-4">
            <a href="/series">Video Series</a>
            <a href="/episodes">Episodes</a>
            <a href="/upload">Upload</a>
          </nav>
          <div className="user-info">
            Welcome, {user.name}
          </div>
        </div>
      </header>
    ));
  }
});
```

### Custom Sidebar Navigation

```typescript
export const CustomNavigationPlugin = createPlugin({
  namespace: 'university',
  type: 'navigation',
  version: '1.0.0',
  
  initialize(manager) {
    // Add university-specific navigation items
    manager.registerObject('sidebar:nav-items', 'university-policies', {
      title: 'University Policies',
      path: '/policies',
      icon: 'shield-check',
      order: 80,
      permissions: [],
      category: 'university'
    });
    
    manager.registerObject('sidebar:nav-items', 'student-resources', {
      title: 'Student Resources',
      path: '/resources',
      icon: 'book-open',
      order: 90,
      permissions: ['resources.view'],
      category: 'university'
    });
  }
});
```

This plugin system provides the foundation for a flexible, maintainable, and university-customizable content management platform. 