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
- Use Tailwind's raw palette classes (`text-gray-900`, `bg-amber-50`, `focus:ring-indigo-600`, …) — they ignore the theme tokens and break in dark mode and under org themes. **Lint-enforced** since #297 (`local/no-palette-classes`); genuinely intentional fixed colors need an `eslint-disable-next-line` with a reason.
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

Remote/JAR plugin CSS is loaded into the **`plugins` cascade layer**, which the host declares *after* Tailwind's `utilities` layer (in `@oc-mui/ui`'s `globals.css`). So a plugin's own utilities win on the plugin's own DOM — a normal responsive heading like `text-4xl sm:text-6xl` renders as authored — instead of losing to the host's base utilities by load order. Because every plugin ships into this one layer, and utility definitions are deterministic, plugins still can't reorder host chrome.

This is automatic; you don't do anything. The `@layer plugin-overrides` block below is only for the rarer case of restyling a *host or shared* component from your plugin.

> **Why the order matters more than it looks.** Several complete Tailwind builds
> reach the page — the `@oc-mui/ui` stylesheet ships one scanning `packages/ui`,
> the shell ships another scanning the apps and plugins, and each remote plugin
> may add its own. Utilities that appear in more than one are identical and
> harmless. The trap is a *base* utility in a later sheet beating a *responsive
> variant* that only an earlier sheet generated: they have equal specificity, so
> the later one wins and `flex-col md:flex-row` silently stays a column at every
> width. The shell therefore imports `@oc-mui/ui/globals.css` explicitly before
> its own `app.css` and scans `packages/ui` as well, so the last sheet is always
> a superset.
>
> That ordering rule governs the **host's own** stylesheets among themselves.
> Your plugin's build is exempt from it: the loader wraps your CSS in `@layer
> plugins`, and the host declares that layer after Tailwind's `utilities`. Layer
> order is resolved before load order, so your utilities win on your own DOM no
> matter which sheet lands first — you do not need to position your build
> relative to the host's.

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

## Dark mode

Light/dark is the **appearance axis**, separate from the org-branding theme (`app.theme`). The shell mounts `ThemeModeProvider` (from `@oc-mui/ui`, wrapping [`next-themes`](https://github.com/pacocoursey/next-themes)) and renders a Light/Dark/System toggle in the header. It defaults to the user's OS preference and persists their choice, applying a `.dark` class on `<html>` that activates the dark token block in `globals.css`.

**Your plugin gets dark mode for free — if you follow the one rule.** Because every semantic token (`--background`, `--primary`, `--sidebar`, …) already has a `.dark` value, a plugin that uses the token-backed utilities (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, …) flips automatically. You do nothing.

You only need to think about dark mode when you reach for a **non-token** color — which you should avoid, but if you must, use Tailwind's `dark:` variant so both appearances are covered:

```tsx
// ✅ token-backed — adapts automatically
<div className="bg-card text-card-foreground border border-border" />

// ⚠️ one-off color — cover both appearances explicitly
<div className="bg-emerald-50 dark:bg-emerald-950" />

// ❌ never — breaks in dark mode
<div className="bg-white text-black" />
```

> Verify your plugin in **both** appearances (toggle in the header). If something looks wrong in dark mode, it's almost always a hardcoded color that should be a token.

## How themes work

A theme is a CSS file that overrides token values — color **and** structure (radius, fonts, shadows, spacing). Plugins pick them up automatically.

```css
/* <theme>.css */
:root {
  --primary: oklch(0.45 0.15 250);
  --sidebar: oklch(0.20 0.05 250);
  --radius: 0.5rem;
  --font-heading: Georgia, "Times New Roman", serif; /* system stack — see below */
}

.dark {
  --primary: oklch(0.65 0.18 250);
  --sidebar: oklch(0.15 0.03 250);
}
```

**No external web fonts.** Set `--font-*` to **system font stacks only** — don't `@import` Google Fonts (or any remote font). Embedding remote fonts sends every user's IP to a third party, which is a GDPR problem for EU/university deployments (and breaks offline/air-gapped installs). Use serif vs. sans, plus `--radius`/`--shadow-*`/`--spacing-*`, to give a theme its character. See `apps/shell/public/plugins/themes/*.css` for worked examples.

**Where themes live & how they're served:**

| Theme kind | Location | Applied via |
| --- | --- | --- |
| Shipped showcase themes | `apps/shell/public/plugins/themes/<name>.css` | marketplace **and** `app.theme` |
| Org themes (dev) | `.local-plugins/<org>/themes/<org>.css` | `app.theme` |
| Org themes (prod) | the org's JAR, served at `/static/plugins/<org>/<org>.css` | `app.theme` |

> Theme CSS **must be served as a raw `text/css` static file**. A `.css` under a *source* dir (e.g. `plugins/themes/`) is returned by Vite as a JS module (dev) or the SPA `index.html` fallback (build), so a `<link rel="stylesheet">` "loads" it (200) but applies nothing. That's why shipped themes live under `public/`. The default baseline (`apps/shell/src/themes/default.css`) is the one exception — it's `import`ed directly by the shell, not loaded by name.

## Review checklist

- [ ] No hardcoded colors, fonts, or sizes.
- [ ] Uses `@oc-mui/ui` components, not local shadcn copies.
- [ ] CSS entry declares explicit Tailwind layers.
- [ ] Any host-component overrides are scoped with a plugin-root selector.
- [ ] Renders correctly in light and dark mode.
- [ ] Renders correctly against the default theme **and** at least one org theme.
- [ ] Theme files set `--font-*` to system stacks only — no remote `@import` of web fonts.

## Consuming `@oc-mui/ui` outside the monorepo

A plugin built in its own repo — installing `@oc-mui/ui` from the registry rather than via the workspace — gets working styling from a single import in its Tailwind entry:

```css
/* your-plugin/src/app.css */
@import "@oc-mui/ui/globals.css";
```

That one line pulls in Tailwind, the `tailwindcss-animate` plugin, the design tokens, the Geist fonts, and a scan of `@oc-mui/ui`'s own compiled classes — so the components you render are styled. Tailwind v4 additionally auto-scans your plugin's own project, so the utility classes in your markup are generated too; only content sources Tailwind can't auto-detect need an explicit `@source`. Override tokens exactly as in-repo (see [Overrides](#overrides)) — your theme CSS sets the same `--*` variables.

> The host application (the shell) declares the *app's* content sources in its own entry, [`apps/shell/src/app.css`](../../apps/shell/src/app.css), not in `globals.css` — which is why the shared stylesheet stays free of monorepo-specific paths and works unchanged for external consumers.

## See also

- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md#3-theme-contract) — stability guarantees and versioning.
- [`packages/ui/src/styles/globals.css`](../../packages/ui/src/styles/globals.css) — the source-of-truth token list.
- [`apps/shell/public/plugins/themes/`](../../apps/shell/public/plugins/themes/) — the shipped showcase themes (worked examples of full design languages).
- [`apps/shell/src/themes/default.css`](../../apps/shell/src/themes/default.css) — the always-loaded baseline.
