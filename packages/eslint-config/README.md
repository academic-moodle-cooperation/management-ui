# `@oc-mui/eslint-config`

A collection of ESLint configurations for the management-ui monorepo.

## Available Configurations

### Base Configuration (`@oc-mui/eslint-config/base`)

The base ESLint configuration that includes:

- ESLint recommended rules
- TypeScript ESLint recommended rules
- Prettier integration
- Turbo monorepo rules
- Only-warn plugin (converts errors to warnings for better developer experience)

### React Configuration (`@oc-mui/eslint-config/react-internal`)

Extends the base configuration with React-specific rules:

- React recommended rules
- React Hooks rules
- Browser and service worker globals
- Automatic React version detection

### Type-Aware Configuration (`@oc-mui/eslint-config/type-aware`)

Optional configuration that enables type-aware linting rules:

- `@typescript-eslint/no-floating-promises`: Error on unhandled promises
- `@typescript-eslint/no-misused-promises`: Error on promises used incorrectly

**Note:** This configuration requires TypeScript type information and may slow down linting. Use it selectively in packages where strict Promise handling is critical.

## Usage

Import the appropriate configuration in your `eslint.config.js`:

```javascript
// For non-React packages
import { config } from "@oc-mui/eslint-config/base";

export default config;
```

```javascript
// For React applications
import { config as baseConfig } from "@oc-mui/eslint-config/base";
import { config as reactConfig } from "@oc-mui/eslint-config/react-internal";

export default [
  ...baseConfig,
  ...reactConfig,
  // Your project-specific overrides
];
```
