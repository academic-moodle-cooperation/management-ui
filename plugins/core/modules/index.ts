/**
 * Core Plugin Modules
 *
 * Default modules that provide base functionality for the management UI.
 * These serve as fallback defaults and can be overridden by organization plugins.
 */

export { coreDefaultImplementations } from "./defaults";
export { coreFooterImplementation } from "./footer";
export { coreHeaderImplementation } from "./header";

// Reusable components that org plugins can import
export { LangSwitcher } from "./header/components/LangSwitcher";
export { LoginButton } from "./header/components/LoginButton";
