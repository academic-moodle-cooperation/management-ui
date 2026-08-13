# @oc-mui/tailwind-config

Shared Tailwind preset carrying the shadcn/ui design tokens (`bg-primary`, `text-muted-foreground`, … as CSS-variable lookups), so **standalone plugins built outside this repo** style consistently with the host.

**Who this is for**: external plugin authors who drive Tailwind through a JS/TS config file. Org plugins consume it that way today. The **in-tree** build does *not* use this package — since Tailwind v4 the workspace pipeline is CSS-first ([`packages/ui/src/styles/globals.css`](../ui/src/styles/globals.css) with `@plugin`/`@source` directives), which is why you won't find an in-tree `tailwind.config.ts` that imports it. It stays published because it is the supported preset for external JS-config setups.

## Usage

The pattern an external plugin uses:

```ts
// tailwind.config.ts
import { shadcnPreset } from "@oc-mui/tailwind-config/preset";

import type { Config } from "tailwindcss";

export default {
  presets: [shadcnPreset],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
} satisfies Config;
```

## Subpath exports

| Subpath | What it provides |
|---------|------------------|
| `@oc-mui/tailwind-config` | `{ presets: [shadcnPreset], content: [] }` — a ready-made config wrapping the preset. It adds **nothing** beyond the preset; prefer `/preset` and compose your own `content`. |
| `@oc-mui/tailwind-config/preset` | `shadcnPreset` — the preset itself (recommended entry point). |
| `@oc-mui/tailwind-config/plugin` | `shadcnPlugin` — the underlying Tailwind plugin, for advanced composition. |

## What's in the preset

- **CSS-variable colour system** (`shadcn-plugin.ts`) — every colour class resolves to `hsl(var(--token))`. Org themes override the values in `:root`; the class names stay the same. Full token catalog: [`docs/extend/styling.md`](../../docs/extend/styling.md).
- **`darkMode: "class"`** and **animations** — `tailwindcss-animate` plus the `bouncing-loader` keyframe used by `@oc-mui/ui`'s loaders (`shadcn-preset.ts`).
- **Container utilities** — centred, `2rem` padding, `2xl` breakpoint at 1400 px (`shadcn-plugin.ts`).

## Layer

Core infrastructure. Depends only on `tailwindcss` and `tailwindcss-animate`.

## See also

- [`docs/extend/styling.md`](../../docs/extend/styling.md) — Theme Contract, full token list, and the rules plugins must follow.
- [`packages/ui/src/styles/globals.css`](../ui/src/styles/globals.css) — the CSS-first pipeline that defines the token values in-tree.
