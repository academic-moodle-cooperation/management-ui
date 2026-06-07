# Visual regression

Pixel-diff screenshots of the shell across themes — test-protocol.md §7
(Theming) and testing.md Follow-up #6, automated. Separate tier from the
functional smoke ([`tests/e2e/`](../e2e/README.md)) and the real-backend
integration suite ([`tests/integration/`](../integration/README.md)).

Runs against a **mocked backend** (the spec stubs the shell's boot endpoints),
so it's deterministic and needs no Opencast.

## Run

```bash
pnpm test:e2e:install      # one-time: Chromium
pnpm test:visual           # compare against committed baselines
pnpm test:visual:update    # re-record baselines after an intentional UI change
```

The HTML diff report (on failure) lands in `playwright-report-visual/`.

## How it stays stable

[`playwright.visual.config.ts`](../../playwright.visual.config.ts) + the spec
apply the standard flake controls: fixed 1280×800 viewport, `reducedMotion`,
animations/transitions/caret disabled, web fonts awaited before the shot,
the build-version footer masked, and a small `maxDiffPixelRatio` (0.02). Themes
are driven by emulating the OS color scheme (the shell defaults to "System"),
so light and dark render without touching app state.

## Baselines are environment-sensitive

Screenshot baselines depend on the OS/GPU/font stack that rendered them. The
committed baselines under `__screenshots__/` were recorded on macOS (Apple
Silicon). **If you run elsewhere — especially in CI — regenerate them in that
environment and commit those**, rather than mixing baselines across machines:

```bash
pnpm test:visual:update    # in your target environment / CI container
```

The most robust setup renders inside a fixed container (same image locally and
in CI) so the bytes match everywhere — that's why this tier is gated on its own
command rather than wired into per-PR CI. Promote it to a CI job once you've
settled on a rendering container.

## Add a screen

Snapshot more views (episodes table, series table, an alternate showcase theme)
by adding `toHaveScreenshot` calls in [`shell.spec.ts`](shell.spec.ts) or a new
`*.spec.ts` here, then `pnpm test:visual:update` to record their baselines.
