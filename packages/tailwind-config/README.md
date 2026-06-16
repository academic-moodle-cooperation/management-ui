# @opencast-mui/tailwind-config

Shared Tailwind CSS v4 configuration. Built on the shadcn/ui design system with CSS-variable-based theming, so org themes can override the look without changing component code.

## Usage

### Vite (the common case)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tailwindConfig from "@opencast-mui/tailwind-config";

export default defineConfig({
  plugins: [tailwindcss(tailwindConfig)],
});
```

### Just the preset

```js
// tailwind.config.js
import { shadcnPreset } from "@opencast-mui/tailwind-config/preset";

export default {
  presets: [shadcnPreset],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
};
```

## Subpath exports

| Subpath | What it provides |
|---------|------------------|
| `@opencast-mui/tailwind-config` | Full default config — preset + dark mode (class strategy) + container utilities + animations. |
| `@opencast-mui/tailwind-config/preset` | The shadcn preset on its own. Use this when you want to compose with your own config. |
| `@opencast-mui/tailwind-config/plugin` | The underlying Tailwind plugin (CSS-variable colour system, container utilities, typography extensions). |

## What's in the preset

- **CSS-variable colour system** — `bg-primary`, `text-muted-foreground`, etc. are all `var(--token)` lookups. Org themes override the values in `:root`; the class names stay the same. Full token catalog: [`docs/plugins/styling.md`](../../docs/plugins/styling.md).
- **Animations** — Tailwind's defaults plus `tailwindcss-animate` and a `bouncing-loader` keyframe used by `@opencast-mui/ui`'s loaders.
- **Container utilities** — centred, padded, with breakpoints up to `2xl` (1400 px).

## Layer

Core infrastructure. Depends only on `tailwindcss` and `tailwindcss-animate`.

## See also

- [`docs/plugins/styling.md`](../../docs/plugins/styling.md) — Theme Contract 2.0 — full token list and the rules plugins must follow.
- [`packages/ui/src/styles/globals.css`](../ui/src/styles/globals.css) — the actual CSS that defines the token values.
