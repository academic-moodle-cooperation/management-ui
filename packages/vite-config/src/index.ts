export { createBaseConfig, type CreateBaseConfigOptions } from "./base.config.js";
export { createProxyConfig, type CreateProxyConfigOptions } from "./proxy.js";
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
export {
  generateConfigPlugin,
  type GenerateConfigPluginOptions,
} from "./generate-config-plugin.js";
