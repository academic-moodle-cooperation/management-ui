/**
 * @oc-mui/remote-plugin-loader
 *
 * Loads remote ES module plugins by URL: fetch, transform bare imports to
 * window.__SHARED_MODULES__, import via blob, inject CSS, register GraphQL
 * fragments, and register with PluginManager.
 *
 * Used by:
 * - apps/shell for JAR plugins (loadJarPlugins + loadAndRegister with skipUrlValidation)
 * - admin-marketplace for registry and local plugins (after validating URL/version)
 */

export { loadAndRegister, isSameOriginUrl } from "./loadAndRegister";
export type { LoadOptions, LoadResult } from "./loadAndRegister";
export { transformModuleSource, SHARED_MODULE_NAMES } from "./transform";
