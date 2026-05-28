export { createBaseConfig, type CreateBaseConfigOptions } from "./base.config.js";
export { createProxyConfig, CONFIG_JSON_PATH, type CreateProxyConfigOptions } from "./proxy.js";
export {
  DEFAULT_SHELL_APP_PORT,
  getAppBasePath, // For shell app
  getPluginPorts, // For plugins
  getPluginBasePath, // For plugins
} from "./ports.js";
export { createShellAppViteConfig, type CreateShellAppViteConfigOptions } from "./shell.config.js";
export {
  createPluginAppViteConfig,
  type CreatePluginAppViteConfigOptions,
} from "./plugin.config.js";

// Community Plugin System
export {
  createCommunityPluginConfig,
  type CreateCommunityPluginConfigOptions,
  type ExtractedFragment,
} from "./community-plugin.config.js";
export {
  fragmentExtractorPlugin,
  type FragmentExtractorOptions,
} from "./plugins/fragment-extractor.js";
export {
  localPluginsDevPlugin,
  type LocalPluginsDevPluginOptions,
} from "./plugins/local-plugins-dev.js";
export {
  localConfigDevPlugin,
  type LocalConfigDevPluginOptions,
} from "./plugins/local-config-dev.js";