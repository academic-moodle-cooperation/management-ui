# `@workspace/vite-config`

A collection of Vite configurations and utilities for the management-ui monorepo, supporting both shell applications and micro-frontend plugins.

## Available Exports

### Base Configuration (`@workspace/vite-config/base`)

Core Vite configuration factory:

- `createBaseConfig(options)`: Creates a base Vite configuration with TypeScript, React, and Tailwind support

### Main Export (`@workspace/vite-config`)

Primary configuration factories:

- `createBaseConfig(options)`: Base configuration factory
- `createProxyConfig(options)`: Development proxy configuration
- `createShellAppViteConfig(options)`: Complete shell application configuration
- `createPluginAppViteConfig(options)`: Complete plugin application configuration

### Proxy Configuration (`@workspace/vite-config/proxy`)

Development server proxy utilities:

- `createProxyConfig({ shellPort, plugins })`: Sets up proxy rules for micro-frontend development

### Port Management (`@workspace/vite-config/ports`)

Port allocation utilities for micro-frontend architecture:

- `DEFAULT_SHELL_APP_PORT`: Default port (3000) for the shell application
- `getPluginPorts(pluginName)`: Returns dev and preview ports for plugins
- `getPluginBasePath(isProduction, pluginName, shellBasePath)`: Generates plugin base paths
- `getAppBasePath(isProduction, envVarBasePath)`: Determines shell app base path

## Usage

### Shell Application Configuration

```typescript
// vite.config.ts
import { createShellAppViteConfig } from "@workspace/vite-config";

export default createShellAppViteConfig({
  plugins: ["management-ui-episodes", "management-ui-series"],
  // Additional Vite configuration
});
```

### Plugin Application Configuration

```typescript
// vite.config.ts for a plugin
import { createPluginAppViteConfig } from "@workspace/vite-config";

export default createPluginAppViteConfig({
  pluginName: "management-ui-episodes",
  shellPort: 3000,
  // Additional Vite configuration
});
```

### Custom Base Configuration

```typescript
// vite.config.ts
import { createBaseConfig } from "@workspace/vite-config";

export default createBaseConfig({
  // Your custom options
});
```

### Using Port Utilities

```typescript
import { getPluginPorts, getAppBasePath } from "@workspace/vite-config/ports";

// Get ports for a plugin
const ports = getPluginPorts("management-ui-episodes");
// Returns: { dev: 3001, preview: 3101 }

// Get base path for production
const basePath = getAppBasePath(true);
// Returns: "/management-ui/"
```

## Configuration Features

### Base Configuration Includes:

- React support with SWC for fast compilation
- Tailwind CSS integration with Vite plugin
- TypeScript configuration
- Static file copying capabilities
- Development server optimization

### Shell App Configuration Adds:

- Proxy configuration for plugin development
- Base path management for deployment
- Plugin-specific routing setup
- Production build optimization

### Plugin App Configuration Adds:

- Port allocation for development
- Base path calculation for micro-frontend integration
- Proxy configuration for shell app communication
- Development mode detection

## Supported Plugins

The port allocation system recognizes these plugins:

- `management-ui-series` (port 3001/3101)
- `management-ui-episodes` (port 3002/3102)
- `management-ui-upload` (port 3003/3103)
- `management-ui-test` (port 3004/3104)

## Dependencies

### Runtime Dependencies:

- `vite`: ^6.3.5 - Core build tool
- `@vitejs/plugin-react-swc`: ^3.9.0 - React support with SWC
- `@tailwindcss/vite`: ^4.1.7 - Tailwind CSS integration
- `vite-plugin-static-copy`: ^1.0.6 - Static file copying

### Development Dependencies:

- `@types/node`: ^20.14.12 - Node.js type definitions
- `@workspace/eslint-config`: workspace:\* - ESLint configuration
- `@workspace/typescript-config`: workspace:\* - TypeScript configuration
- `eslint`: ^9.8.0 - Code linting
- `typescript`: ~5.5.4 - TypeScript compiler
