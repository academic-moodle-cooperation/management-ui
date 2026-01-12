/**
 * Core Plugin Implementations
 *
 * Default implementations that provide base functionality for the management UI.
 * These serve as the fallback implementations and can be overridden by universities.
 */

// Export core implementations
export { coreDefaultImplementations } from "./defaults";
export { coreFooterImplementation } from "./footer";
export { coreHeaderImplementation } from "./header";

// Export reusable components that universities can use in their implementations
export { LangSwitcher } from "./header/components/LangSwitcher";
export { LoginButton } from "./header/components/LoginButton";
