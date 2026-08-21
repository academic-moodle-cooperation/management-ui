// Export plugin interfaces and types
export * from "./IPlugin";
export * from "./pluginManager";
export * from "./pluginFactory";
export * from "./pluginTypes";
export * from "./types";
export * from "./appTypes";

// Public API contract version (see docs/reference/contracts.md)
export {
  PLUGIN_API_VERSION,
  parseSemver,
  checkApiVersionCompatibility,
} from "./apiVersion";
export type { ParsedSemver, ApiVersionCheckResult } from "./apiVersion";

// Shared Runtime Dependencies contract (see docs/reference/contracts.md #5)
export {
  SHARED_RUNTIME_MAJORS,
  checkSharedDependencyCompatibility,
  parseRangeMajor,
} from "./sharedRuntime";
export type {
  SharedRuntimeDependencyName,
  SharedDependencyCheckResult,
  SharedDependencyIncompatibility,
} from "./sharedRuntime";

// Export plugin system components
export * from "./PluginProvider";
export * from "./RendererContext";
export * from "./component-resolver";
export { PluginComponent } from "./PluginComponent";

// Export plugin modules
export * from "./builtins/renderer";
export * from "./builtins/objectRegistry";
export * from "./builtins/objectRegistry/hooks/useRegistry";
export * from "./builtins/appRegistry";

// Export services (Community Plugin System)
export * from "./services";

// Export manifest validator (see docs/reference/contracts.md #1)
export {
  validatePluginMetadata,
  type PluginMetadataValidationResult,
} from "./utils/pluginMetadataValidator";
