/**
 * Shared Modules for Community Plugins
 *
 * This module exposes internal packages to community plugins via window globals.
 * When a community plugin is loaded, its imports are transformed to use these
 * exposed modules instead of trying to resolve bare specifiers.
 *
 * Usage:
 * 1. Call `exposeSharedModules()` early in the app initialization
 * 2. Community plugins can then import from "@workspace/*" packages
 */

import * as React from "react";
import * as ReactJSXRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";
import * as LucideReact from "lucide-react";

import * as PluginSystem from "@workspace/plugin-system";
import * as Query from "@workspace/query";
import * as Router from "@workspace/router";
import * as UIComponents from "@workspace/ui/components";
import { logger } from "@workspace/utils";

// Re-export UI component types for consumers
export type { UIComponents };

/**
 * Module registry exposed to community plugins
 */
export interface SharedModuleRegistry {
  "react": typeof React;
  "react-dom": typeof ReactDOM;
  "react/jsx-runtime": typeof ReactJSXRuntime;
  "lucide-react": typeof LucideReact;
  "@workspace/plugin-system": typeof PluginSystem;
  "@workspace/ui/components": typeof UIComponents;
  "@workspace/query": typeof Query;
  "@workspace/router": typeof Router;
}

declare global {
  interface Window {
    __SHARED_MODULES__: SharedModuleRegistry;
  }
}

/**
 * Expose shared modules to window for community plugins
 *
 * This must be called before loading any community plugins.
 */
const sharedLogger = logger.child({ component: "SharedModules" });

export function exposeSharedModules(): void {
  if (window.__SHARED_MODULES__) {
    sharedLogger.debug("Already exposed, skipping");
    return;
  }

  window.__SHARED_MODULES__ = {
    react: React,
    "react-dom": ReactDOM,
    "react/jsx-runtime": ReactJSXRuntime,
    "lucide-react": LucideReact,
    "@workspace/plugin-system": PluginSystem,
    "@workspace/ui/components": UIComponents,
    "@workspace/query": Query,
    "@workspace/router": Router,
  };

  sharedLogger.debug("Exposed modules for community plugins", { modules: Object.keys(window.__SHARED_MODULES__) });
}

/**
 * Get an exposed module by name
 *
 * @param name - Module name (e.g., "react", "@workspace/plugin-system")
 * @returns The module or undefined
 */
export function getSharedModule(name: string): unknown {
  return window.__SHARED_MODULES__?.[name as keyof SharedModuleRegistry];
}

/**
 * Check if shared modules are available
 */
export function areSharedModulesAvailable(): boolean {
  return Boolean(window.__SHARED_MODULES__);
}

/**
 * Transform ES module source to use shared modules
 *
 * Replaces bare import specifiers with references to the shared module registry.
 * This allows community plugins to import from "@workspace/*" and "react" without
 * the browser needing to resolve those specifiers.
 *
 * @param source - ES module source code
 * @returns Transformed source with a preamble that provides the modules
 */
export function transformModuleSource(source: string): string {
  const moduleNames = Object.keys(window.__SHARED_MODULES__ || {});

  // Create a preamble that extracts modules from the global registry
  const preamble = `
// === Community Plugin Module Shim ===
const __sharedModules__ = window.__SHARED_MODULES__;
${moduleNames
      .map((name) => {
        // Create a safe variable name from the module path
        const varName = `__mod_${name.replace(/[^a-zA-Z0-9]/g, "_")}__`;
        return `const ${varName} = __sharedModules__["${name}"];`;
      })
      .join("\n")}

// Re-export for import statements
${moduleNames
      .map((name) => {
        const varName = `__mod_${name.replace(/[^a-zA-Z0-9]/g, "_")}__`;
        // Handle special case for react/jsx-runtime which needs specific exports
        if (name === "react/jsx-runtime") {
          return `const { jsx, jsxs, Fragment } = ${varName};`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n")}
// === End Shim ===

`;

  // Transform the source code
  let transformed = source;

  // Replace named imports from each module
  for (const name of moduleNames) {
    const varName = `__mod_${name.replace(/[^a-zA-Z0-9]/g, "_")}__`;

    // Match: import { foo, bar as baz } from "module-name"
    // Replace with destructuring from our variable
    const namedImportRegex = new RegExp(
      `import\\s*\\{([^}]+)\\}\\s*from\\s*["']${escapeRegExp(name)}["'];?`,
      "g"
    );
    transformed = transformed.replace(namedImportRegex, (match, imports) => {
      // Convert import aliases (as) to destructuring aliases (:)
      // "foo as bar" in imports becomes "foo: bar" in destructuring
      const importList = imports
        .split(",")
        .map((s: string) => s.trim().replace(/\s+as\s+/g, ": "));
      return `const { ${importList.join(", ")} } = ${varName};`;
    });

    // Match: import * as foo from "module-name"
    const namespaceImportRegex = new RegExp(
      `import\\s*\\*\\s*as\\s+(\\w+)\\s*from\\s*["']${escapeRegExp(name)}["'];?`,
      "g"
    );
    transformed = transformed.replace(namespaceImportRegex, (match, alias) => {
      return `const ${alias} = ${varName};`;
    });

    // Match: import foo from "module-name"
    const defaultImportRegex = new RegExp(
      `import\\s+(\\w+)\\s*from\\s*["']${escapeRegExp(name)}["'];?`,
      "g"
    );
    transformed = transformed.replace(defaultImportRegex, (match, alias) => {
      return `const ${alias} = ${varName}.default || ${varName};`;
    });
  }

  return preamble + transformed;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Load a community plugin with module transformation
 *
 * @param url - URL to the plugin module
 * @returns The loaded module
 */
export async function loadTransformedModule(url: string): Promise<unknown> {
  if (!areSharedModulesAvailable()) {
    throw new Error("Shared modules not exposed. Call exposeSharedModules() first.");
  }

  // Fetch the module source
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch plugin: ${response.status} ${response.statusText}`);
  }

  const source = await response.text();

  // Transform the source
  const transformed = transformModuleSource(source);

  // Create a blob URL and import it
  const blob = new Blob([transformed], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const module = await import(/* @vite-ignore */ blobUrl);
    return module;
  } finally {
    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
  }
}
