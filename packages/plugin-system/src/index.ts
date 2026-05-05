// Export plugin interfaces and types
export * from "./IPlugin";
export * from "./pluginManager";
export * from "./pluginFactory";
export * from "./pluginTypes";
export * from "./types";
export * from "./appTypes";

// Public API contract version (see docs/architecture/CONTRACTS.md)
export {
  PLUGIN_API_VERSION,
  parseSemver,
  checkApiVersionCompatibility,
} from "./apiVersion";
export type { ParsedSemver, ApiVersionCheckResult } from "./apiVersion";

// Export plugin system components
export * from "./PluginProvider";
export * from "./RendererContext";
export * from "./component-resolver";
export { PluginComponent } from "./PluginComponent";

// Export plugin modules
export * from "./plugins/renderer";
export * from "./plugins/objectRegistry";
export * from "./plugins/objectRegistry/hooks/useRegistry";
export * from "./plugins/appRegistry";

// Export services (Community Plugin System)
export * from "./services";

// Export manifest validator (see docs/architecture/CONTRACTS.md #1)
export {
  validatePluginMetadata,
  type PluginMetadataValidationResult,
} from "./utils/pluginMetadataValidator";
