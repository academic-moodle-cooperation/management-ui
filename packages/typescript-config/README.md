# `@oc-mui/typescript-config`

A collection of TypeScript configurations for the management-ui monorepo.

## Available Configurations

### Base Configuration (`@oc-mui/typescript-config/base.json`)

The foundational TypeScript configuration that includes:

- ES2022 target with DOM libraries
- ESNext module system with bundler resolution
- Strict type checking enabled
- Isolated modules for faster compilation
- Source maps disabled for production builds

### Node ESM Library Configuration (`@oc-mui/typescript-config/node-esm-library.json`)

Extends the base configuration for Node.js ESM libraries:

- Node16 module system and resolution
- Declaration file generation enabled
- Output directory set to `./dist`
- Consistent file casing enforcement

### React Library Configuration (`@oc-mui/typescript-config/react-library.json`)

Extends the base configuration for React libraries:

- React JSX transform support (`react-jsx`)
- Composite project setup for monorepo builds
- Declaration files and source maps enabled
- Incremental compilation for faster rebuilds
- Output directory set to `./dist`

### React Application Configuration (`@oc-mui/typescript-config/react-application.json`)

Extends the React library configuration for applications:

- Optimized for applications (no emit, no incremental)
- Declaration generation disabled for faster builds
- Composite disabled for application bundles

## Usage

Extend the appropriate configuration in your `tsconfig.json`:

```json
{
  "extends": "@oc-mui/typescript-config/base.json",
  "compilerOptions": {
    // Your project-specific overrides
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### For React Libraries:

```json
{
  "extends": "@oc-mui/typescript-config/react-library.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### For React Applications:

```json
{
  "extends": "@oc-mui/typescript-config/react-application.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Dependencies

This package has no runtime dependencies and only provides TypeScript configuration files.
