# Theme & styling contract

How plugin CSS interacts with the host. Follow this and your plugin looks native in every org's deployment without code changes.

This is **Theme Contract 2.0** — frozen for the 1.x line. See [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md#3-theme-contract) for the stability guarantees.

## The one rule

**Use semantic tokens and shared UI components. No hardcoded colors.**

| Layer | Owns |
|-------|------|
| **Host shell** | App chrome (sidebar, header, footer), shared components in `@oc-mui/ui` |
| **Org theme** | Token values (`--primary`, `--sidebar`, fonts, radius) |
| **Plugin** | Markup it renders itself — pages, cards, scoped wrappers |

## Tokens

Defined in [`packages/ui/src/styles/globals.css`](../../packages/ui/src/styles/globals.css) and exposed as Tailwind utility classes. Org themes override the values; consumers stay the same.

### Surfaces & text

| Token | Tailwind | Purpose |
|-------|----------|---------|
| `--background` / `--foreground` | `bg-background` / `text-foreground` | Page surface and default text |
| `--card` / `--card-foreground` | `bg-card` / `text-card-foreground` | Card and panel surfaces |
| `--popover` / `--popover-foreground` | `bg-popover` / `text-popover-foreground` | Popovers, dropdowns |
| `--primary` / `--primary-foreground` | `bg-primary` / `text-primary-foreground` | Primary actions |
| `--secondary` / `--secondary-foreground` | `bg-secondary` / `text-secondary-foreground` | Secondary surfaces |
| `--muted` / `--muted-foreground` | `bg-muted` / `text-muted-foreground` | Subdued backgrounds, de-emphasized text |
| `--accent` / `--accent-foreground` | `bg-accent` / `text-accent-foreground` | Accent highlights |
| `--destructive` / `--destructive-foreground` | `bg-destructive` / `text-destructive-foreground` | Danger actions |

### Borders & focus

| Token | Tailwind |
|-------|----------|
| `--border` | `border-border` |
| `--input` | `border-input` |
| `--ring` | `ring-ring` |

### Status

| Token | Tailwind |
|-------|----------|
| `--ok` / `--ok-foreground` | `bg-ok` / `text-ok-foreground` |
| `--warning` / `--warning-foreground` | `bg-warning` / `text-warning-foreground` |
| `--error` / `--error-foreground` | `bg-error` / `text-error-foreground` |
| `--info` / `--info-foreground` | `bg-info` / `text-info-foreground` |

### Sidebar

| Token | Tailwind |
|-------|----------|
| `--sidebar` / `--sidebar-foreground` | `bg-sidebar` / `text-sidebar-foreground` |
| `--sidebar-primary` / `--sidebar-primary-foreground` | active item |
| `--sidebar-accent` / `--sidebar-accent-foreground` | hover state |
| `--sidebar-border` | `border-sidebar-border` |
| `--sidebar-ring` | `ring-sidebar-ring` |

### Typography & layout

| Variable | Purpose |
|----------|---------|
| `--font-sans` | Body font |
| `--font-mono` | Monospace |
| `--font-heading` | Headings (defaults to `--font-sans`) |
| `--radius` | Base radius — `sm`, `md`, `lg`, `xl` derived from it |
| `--spacing-tight` / `--spacing-normal` / `--spacing-relaxed` | `0.5rem` / `0.75rem` / `1rem` |
| `--duration-transition` | Default animation speed (`150ms`) |

### Charts

`--chart-1` through `--chart-5` → `bg-chart-1` etc. Use for data visualization series.

## Rules

**Do**

- Use semantic token classes (`bg-card`, `text-muted-foreground`, …).
- Use components from `@oc-mui/ui/components` (Button, Card, Input, Table, …).
- Use `lucide-react` for icons — provided by the host.
- Scope any custom CSS to plugin-owned markup.
- Override theme tokens in **theme CSS files**, not in plugin components.

**Don't**

- Hardcode hex/rgb/hsl/oklch colors.
- Hardcode font families — use `font-sans`, `font-heading`, `font-mono`.
- Bundle your own copy of shadcn/ui.
- Apply global styles that escape your plugin's DOM.
- Use `!important` on utility classes.

### Example

```tsx
// Correct
<div className="bg-background text-foreground">
  <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
  <p className="text-muted-foreground">Summary view</p>
  <Card>
    <CardContent>
      <Badge className="bg-ok text-ok-foreground">Active</Badge>
    </CardContent>
  </Card>
</div>

// Wrong
<div className="bg-white text-gray-900">
  <h1 style={{ fontFamily: "Inter" }}>Dashboard</h1>
  <span className="bg-green-500 text-white">Active</span>
</div>
```

## Load order

Remote/JAR plugin CSS is inserted **before** the host shell stylesheets. This prevents plugin utilities (`.flex`, `.p-0`, …) from overriding host UI when several plugins ship their own Tailwind builds.

The implied entry point for plugin CSS:

```css
@layer theme, base, components, utilities, plugin-overrides;

@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);

@layer plugin-overrides {
  /* Scoped overrides, see below */
}
```

## Overrides

When you must restyle a host or shared component:

1. Wrap the area in a plugin-specific root class or `data-` attribute.
2. Put the override in a scoped rule inside `@layer plugin-overrides`.
3. Prefer changing theme tokens over component-level CSS.

```css
@layer plugin-overrides {
  .my-plugin-sidebar [data-sidebar="menu-button"][data-active="true"] {
    background-color: var(--sidebar-primary);
    color: var(--sidebar-accent-foreground);
  }
}
```

## How org themes work

An org ships a CSS file that overrides token values. Plugins pick them up automatically.

```css
/* themes/univie.css */
:root {
  --primary: oklch(0.45 0.15 250);
  --sidebar: oklch(0.20 0.05 250);
  --font-heading: "Merriweather", serif;
  --radius: 0.5rem;
}

.dark {
  --primary: oklch(0.65 0.18 250);
  --sidebar: oklch(0.15 0.03 250);
}
```

## Review checklist

- [ ] No hardcoded colors, fonts, or sizes.
- [ ] Uses `@oc-mui/ui` components, not local shadcn copies.
- [ ] CSS entry declares explicit Tailwind layers.
- [ ] Any host-component overrides are scoped with a plugin-root selector.
- [ ] Renders correctly in light and dark mode.
- [ ] Renders correctly against the default theme **and** at least one org theme.

## See also

- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md#3-theme-contract) — stability guarantees and versioning.
- [`packages/ui/src/styles/globals.css`](../../packages/ui/src/styles/globals.css) — the source-of-truth token list.
- [`apps/shell/src/themes/`](../../apps/shell/src/themes/) — example org themes.
