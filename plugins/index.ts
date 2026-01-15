/**
 * Export all plugins from their respective packages
 *
 * IMPORTANT: The order of exports determines the configuration merge order in dev mode.
 * Later exports override earlier ones.
 *
 * To ensure consistency between dev and prod:
 * 1. This export order should match the PLUGIN_CONFIGS order in apps/management-ui-core/vite.config.ts
 * 2. The order here determines which config wins in dev mode (last one wins)
 *
 * Current active organization: univie (University of Vienna)
 * Note: All plugins are exported for compatibility, but only the active organization's
 * config is used (controlled by PLUGIN_CONFIGS in vite.config.ts for production,
 * and by export order here for development).
 */
export * from "./core";
export * from "./tuwien"; // TU Wien (exported but config not active)
export * from "./univie"; // University of Vienna (ACTIVE - config wins due to order)
export * from "./example-university";
