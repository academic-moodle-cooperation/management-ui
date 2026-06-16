import type { Plugin, PluginManager } from "@opencast-mui/plugin-system";

import type { ReactElement, ReactNode } from "react";

/**
 * Subset of the plugin manifest shape the harness cares about. Aligned with
 * `plugin.schema.json` but intentionally narrow: only the fields the harness
 * needs to read or forward are declared here.
 *
 * The harness accepts any object that satisfies this shape; additional fields
 * from the full manifest are preserved verbatim via the index signature so
 * downstream consumers can still read them if they need to.
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  namespace: string;
  author: { name: string; [key: string]: unknown };
  /** Manifest 1.1: optional list of extension points this plugin populates. */
  extensionPoints?: string[] | undefined;
  /** Manifest 1.0: directory containing locale files, relative to plugin root. */
  locales?: string | undefined;
  /** Manifest 1.0: i18n namespaces shipped by the plugin. */
  i18nNamespaces?: string[] | undefined;
  [key: string]: unknown;
}

/**
 * Record of console events captured by the harness since it was created.
 * Used by {@link TestHarness.expectCleanRender} to assert nothing was
 * logged at error or warning level during activation or rendering.
 */
export interface ConsoleCapture {
  errors: ConsoleEvent[];
  warnings: ConsoleEvent[];
}

export interface ConsoleEvent {
  args: unknown[];
  /** Human-readable concatenation of args, handy for assertion messages. */
  message: string;
}

export interface HarnessOptions {
  /**
   * Parsed plugin manifest. When supplied, the harness can drive
   * `expectAllManifestRegistrationsSucceed` and locate the locales
   * directory for `expectI18nKeyParity` without explicit paths.
   */
  manifest?: PluginManifest;
  /**
   * Absolute filesystem path to the plugin root. Only required when the
   * caller wants `expectI18nKeyParity` to resolve a relative `manifest.locales`
   * directory.
   */
  pluginDir?: string;
  /**
   * Locales the harness should cross-check for key parity. Defaults to
   * whichever locale files are present under the i18n namespace folder.
   */
  i18nLocales?: string[];
}

export interface ExpectCleanRenderOptions {
  /**
   * Optional React element to render. When omitted, the harness simply
   * asserts that plugin activation did not log to `console.error` /
   * `console.warn`, without mounting any additional UI.
   */
  render?: ReactElement | ReactNode;
}

export interface TestHarness {
  /** The active plugin manager. Useful for ad-hoc assertions not covered by the helpers. */
  manager: PluginManager;
  /** The plugin that was loaded into the harness. */
  plugin: Plugin;
  /** Manifest passed via `HarnessOptions.manifest`, if any. */
  manifest?: PluginManifest | undefined;

  /** Assert the plugin was registered and made it through activate(). */
  expectActivated(): void;

  /** Assert that each of the given extension points has at least one entry. */
  expectRegistered(extensionPoints: string[]): void;

  /**
   * Assert that every extension point listed in `manifest.extensionPoints`
   * has at least one entry. Throws if the manifest is missing or has no
   * `extensionPoints` field (callers can fall back to {@link expectRegistered}).
   */
  expectAllManifestRegistrationsSucceed(): void;

  /**
   * Assert that every i18n namespace declared by the plugin (via
   * `manifest.i18nNamespaces` + `manifest.locales`) exposes the same set
   * of keys across all supplied locales (or all discovered locales).
   */
  expectI18nKeyParity(locales?: string[]): Promise<void>;

  /**
   * Render inside the harness' provider stack and assert nothing new was
   * logged at error/warning level during activation or the render pass.
   */
  expectCleanRender(opts?: ExpectCleanRenderOptions): Promise<void>;

  /** Low-level console capture for harness-authored assertions. */
  captured: ConsoleCapture;

  /** Tear down the harness: deactivate the plugin, restore console. */
  dispose(): void;
}
