import type { Page } from "@playwright/test";

/**
 * Make a page hold still before it is photographed.
 *
 * Three tiers take screenshots — the visual-regression tier
 * (`tests/visual/`), the org-plugin tier (`tests/org-plugin/`) and the
 * documentation captures (`tests/docs-screenshots/`) — and all three need the
 * same preparation: kill everything that moves (transitions, animations, the
 * blinking caret) and wait for web fonts, because a half-loaded font is the
 * single biggest source of cross-run pixel noise.
 *
 * This module is the one copy of that. It used to live twice, verbatim, in
 * `tests/visual/shell.spec.ts` and `tests/org-plugin/_org-plugin.ts`.
 */

export interface SettleOptions {
  /**
   * Also hide the dev-only TanStack Router/Query floating badges.
   *
   * Only relevant for tiers that must run against `vite dev` (org plugins load
   * nowhere else). The Query badge sits in the bottom-right corner, right on
   * top of the footer — exactly the chrome those snapshots are about.
   *
   * The documentation captures do not need this: `installMockBackend` already
   * hides the badges via an init script, before the first paint.
   */
  hideDevtools?: boolean;
}

/** Transitions, animations and the text caret — everything that can differ between two runs. */
const MOTIONLESS_CSS =
  "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}";

const DEVTOOLS_CSS =
  ".TanStackRouterDevtoolsPanel," +
  'button[aria-label="Open TanStack Router Devtools"],' +
  'button[aria-label="Open Tanstack query devtools"],' +
  ".tsqd-open-btn-container,.tsqd-parent-container{display:none!important;}";

export async function settle(page: Page, options: SettleOptions = {}): Promise<void> {
  await page.addStyleTag({
    content: options.hideDevtools ? MOTIONLESS_CSS + DEVTOOLS_CSS : MOTIONLESS_CSS,
  });
  await page.evaluate(() => document.fonts.ready);
}
