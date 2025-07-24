# `@workspace/eslint-config`

A collection of ESLint configurations for the management-ui monorepo.

## Available Configurations

### Base Configuration (`@workspace/eslint-config/base`)
The base ESLint configuration that includes:
- ESLint recommended rules
- TypeScript ESLint recommended rules
- Prettier integration
- Turbo monorepo rules
- Only-warn plugin (converts errors to warnings for better developer experience)

### React Configuration (`@workspace/eslint-config/react-internal`)
Extends the base configuration with React-specific rules:
- React recommended rules
- React Hooks rules
- Browser and service worker globals
- Automatic React version detection

## Usage

Import the appropriate configuration in your `eslint.config.js`:

```javascript
// For non-React packages
import { config } from '@workspace/eslint-config/base';

export default config;
```

```javascript
// For React applications
import { config as baseConfig } from '@workspace/eslint-config/base';
import { config as reactConfig } from '@workspace/eslint-config/react-internal';

export default [
  ...baseConfig,
  ...reactConfig,
  // Your project-specific overrides
];
```
