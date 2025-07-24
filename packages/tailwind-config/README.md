# `@workspace/tailwind-config`

A tailored Tailwind CSS configuration for the management-ui project, built on the shadcn/ui design system.

## Available Configurations

### Main Configuration (`@workspace/tailwind-config`)
The default Tailwind configuration that includes:
- shadcn/ui preset with CSS variables-based theming
- Dark mode support via class strategy
- Custom animations and keyframes
- Container utilities with responsive breakpoints

### Shadcn Preset (`@workspace/tailwind-config/preset`)
Direct access to the shadcn preset configuration:
- Complete shadcn/ui color palette using CSS variables
- Typography scale and spacing system
- Component-specific utilities (badges, buttons, etc.)
- Animation utilities including bouncing loader

### Shadcn Plugin (`@workspace/tailwind-config/plugin`)
The underlying Tailwind plugin that powers the preset:
- CSS variable-based color system
- Container component utilities
- Extended theme with custom properties
- Typography and spacing extensions

## Usage

### In a Vite Application
```typescript
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import tailwindConfig from '@workspace/tailwind-config';

export default defineConfig({
  plugins: [
    tailwindcss(tailwindConfig),
  ],
});
```

### In a Traditional Setup
```javascript
// tailwind.config.js
import config from '@workspace/tailwind-config';

export default {
  ...config,
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    // Add your content paths
  ],
};
```

### Using Just the Preset
```javascript
// tailwind.config.js
import { shadcnPreset } from '@workspace/tailwind-config/preset';

export default {
  presets: [shadcnPreset],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  // Your custom overrides
};
```

## Features

### CSS Variables Theming
All colors use CSS variables, allowing for easy theming:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### Custom Animations
- `bouncing-loader`: Animated loading indicator
- Standard Tailwind animations enhanced with `tailwindcss-animate`

### Responsive Design
- Container queries with center alignment
- Responsive breakpoints up to 2xl (1400px)
- Mobile-first approach with appropriate padding

## Dependencies

- `tailwindcss`: ^4.1.7 - Core Tailwind CSS framework
- `tailwindcss-animate`: ^1.0.7 - Enhanced animation utilities