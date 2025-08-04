# Plugin System - Standalone Plugin Apps

This directory contains the plugin system for the Management UI, now restructured to support standalone plugin apps with dedicated ports and independent development.

## New Structure

Each university/organization now has its own package with independent configuration:

```
plugins/
├── core/                    # Core extension points and implementations
│   ├── package.json        # Core plugin dependencies
│   ├── extension-points/   # What CAN be customized
│   ├── implementations/    # Default implementations
│   └── apps/              # Core app plugins
├── tuwien/                 # TU Wien specific plugins and apps
│   ├── package.json        # TU Wien dependencies (port 3005)
│   ├── main.tsx           # Standalone entry point
│   ├── index.html         # HTML template
│   ├── vite.config.ts     # Vite configuration
│   ├── tsconfig.json      # TypeScript configuration
│   ├── implementations/   # TU Wien specific implementations
│   └── apps/              # TU Wien custom apps
├── univie/                 # University of Vienna plugins
│   ├── package.json        # Univie dependencies (port 3006)
│   └── implementations/   # Univie specific implementations
├── example-university/     # Example implementations
│   ├── package.json        # Example dependencies (port 3007)
│   └── implementations/   # Example implementations
└── shared/                 # Shared configuration files
    ├── package.json        # Legacy shared package
    ├── tsconfig.json       # Legacy shared config
    └── README.md           # Legacy documentation
```

## Standalone Plugin Apps

### TU Wien Custom App

The TU Wien plugin demonstrates how to create standalone plugin apps:

**Features:**
- ✅ **Dual Execution**: Runs in core shell or standalone
- ✅ **Dedicated Port**: Port 3005 for standalone development
- ✅ **Full Provider Context**: Router, auth, plugins, query client
- ✅ **Independent Development**: Can be developed without loading core shell

**Development:**
```bash
cd plugins/tuwien
pnpm dev          # Runs on http://localhost:3005
pnpm build        # Build for production
pnpm preview      # Preview on http://localhost:3105
```

**Core Shell Integration:**
The app automatically appears in the core shell navigation at `/tuwien-custom` when the TU Wien plugin is loaded.

### Port Assignment

Each plugin package gets its own dedicated port:

| Plugin | Development Port | Preview Port | Base URL |
|--------|------------------|--------------|----------|
| Core Shell | 3000 | 3090 | `/management-ui/` |
| Series App | 3001 | 3101 | `/series` |
| Episodes App | 3002 | 3102 | `/episodes` |
| Upload App | 3003 | 3103 | `/upload` |
| Test App | 3004 | 3104 | `/test` |
| **TU Wien Plugin** | **3005** | **3105** | `/tuwien-custom` |
| **Univie Plugin** | **3006** | **3106** | `/univie-custom` |
| **Example Plugin** | **3007** | **3107** | `/example-custom` |

## Creating New Plugin Apps

### 1. Create Plugin Package Structure

```bash
mkdir plugins/my-university
cd plugins/my-university
```

### 2. Create Package Configuration

```json
// plugins/my-university/package.json
{
  "name": "@workspace/plugin-my-university",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite --port 3008",
    "build": "vite build",
    "preview": "vite preview --port 3108"
  },
  "dependencies": {
    "@workspace/plugin-system": "workspace:*",
    "@workspace/ui": "workspace:*",
    "@workspace/app-runtime": "workspace:*",
    "@workspace/router": "workspace:*",
    "@workspace/query": "workspace:*",
    "@workspace/i18n": "workspace:*",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@workspace/vite-config": "workspace:*",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^6.3.5",
    "typescript": "~5.5.4"
  }
}
```

### 3. Create Standalone Entry Point

```typescript
// plugins/my-university/main.tsx
import React from 'react';
import { bootstrapStandaloneApp } from '@workspace/app-runtime';
import { MyUniversityApp } from './apps/MyUniversityApp';

const config = {
  baseUrl: "/my-university",
  appName: "plugin-my-university",
};

bootstrapStandaloneApp(MyUniversityApp, "root", config);
```

### 4. Create App Component

```typescript
// plugins/my-university/apps/MyUniversityApp.tsx
import React from 'react';
import { AdaptiveAppWrapper } from '@workspace/app-runtime';
import { Container } from '@workspace/ui/components';

export const MyUniversityApp: React.FC = () => {
  return (
    <AdaptiveAppWrapper>
      <Container className="p-6">
        <h1>My University Custom App</h1>
        {/* Your app content */}
      </Container>
    </AdaptiveAppWrapper>
  );
};
```

### 5. Create Plugin Registration

```typescript
// plugins/my-university/apps/my-university-plugin.ts
import { createPlugin } from '@workspace/plugin-system';
import { MyUniversityApp } from './MyUniversityApp';

export const myUniversityAppPlugin = createPlugin({
  namespace: 'myuniversity',
  type: 'app',
  version: '1.0.0',
  
  initialize(manager) {
    manager.registerObject('apps:definitions', 'my-university-app', {
      id: 'my-university-app',
      name: 'My University App',
      routePath: '/my-university',
      component: MyUniversityApp,
      navigation: {
        title: 'My University',
        icon: 'building',
        order: 200,
        permissions: ['access_my_university']
      }
    });
  }
});
```

### 6. Update Port Configuration

Add your plugin to the port assignment:

```typescript
// packages/vite-config/src/ports.ts
const KNOWN_PLUGIN_PACKAGE_NAMES = [
  // ... existing plugins
  "plugin-my-university", // My University plugin (port 3008)
];
```

## Benefits of New Structure

### ✅ **Independent Development**
- Each university can develop their plugins independently
- No interference between different university implementations
- Dedicated ports prevent conflicts

### ✅ **Proper Package Management**
- Each plugin has its own `package.json` and dependencies
- Workspace dependencies work correctly
- Proper TypeScript configuration per plugin

### ✅ **Standalone Execution**
- Plugin apps can run independently with `pnpm dev`
- Full provider context (router, auth, plugins, query)
- Same functionality as core apps

### ✅ **Core Shell Integration**
- Plugin apps automatically appear in core shell navigation
- Seamless integration with existing architecture
- No changes needed to core system

### ✅ **Scalability**
- Easy to add new universities
- Clear separation of concerns
- Maintainable codebase

## Migration from Old Structure

The old structure with shared `plugins` package has been moved to `plugins/shared/` for reference. New development should use the individual plugin packages.

## Development Workflow

### For Plugin Developers

1. **Standalone Development**: Develop and test your plugin app independently
2. **Core Integration**: Test integration with core shell
3. **Deployment**: Deploy as standalone app or integrated with core

### For Core Developers

1. **Plugin Discovery**: Plugins are automatically discovered and loaded
2. **Navigation**: Plugin apps appear in navigation automatically
3. **Testing**: Test plugin integration in core shell

## Examples

- **TU Wien**: Complete example with standalone app at http://localhost:3005
- **University of Vienna**: Basic plugin structure
- **Example University**: Reference implementations for learning

This new structure provides the flexibility and independence needed for university-specific customizations while maintaining the benefits of the shared plugin architecture. 