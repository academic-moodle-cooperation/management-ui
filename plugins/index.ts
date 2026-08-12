/**
 * Export all plugins from their respective packages.
 *
 * IMPORTANT: Only built-in plugins that ship with the core repo should be committed here.
 * That includes:
 * - `plugins/core` for mandatory extension points/defaults
 * - optional shared plugins maintained with the core repo (for example admin tooling)
 *
 * University/organization-specific plugins should be:
 * - Developed in .local-plugins/ (gitignored), or
 * - Distributed as Community Plugins via a Registry, or
 * - Deployed as JAR files (backend bundles, served via plugins.json)
 *
 * Loading:
 * - Plugins exported here are loaded at app startup.
 * - Other plugins are loaded dynamically:
 *   - JAR: core fetches backend /management-tool/ui/config/plugins.json and loads each plugin URL.
 *   - Registry and .local-plugins: discovered/installed via Admin Marketplace (registry API or dev manifest at /local-plugins/manifest.json).
 *
 * This barrel is deliberately explicit:
 * - New core plugins must be exported here manually.
 * - Organization-specific plugins do NOT belong in this repo; they are
 *   integrated as community plugins or JARs instead.
 */

export * from "./core";
export * from "./core-episodes";
export * from "./core-series";
export * from "./core-upload";
export * from "./example";
export * from "./admin-marketplace";
// export * from "./my-org-plugin"; // Example org plugin; use .local-plugins/ or Marketplace to load
