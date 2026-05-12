/**
 * ES module source transformation for remote plugins.
 *
 * Replaces bare import specifiers with references to window.__SHARED_MODULES__
 * so community plugins can use host-provided packages (react, @oc-mui/*).
 */

import { logger } from "@oc-mui/utils";

const remoteLoaderLogger = logger.child({ component: "RemotePluginLoader" });

/**
 * Known shared modules that the host app provides.
 * Must match what is exposed in sharedModules (e.g. apps/shell).
 * Longer paths first so subpaths are replaced before parent (e.g. ui/lib/utils before ui/lib).
 */
export const SHARED_MODULE_NAMES = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "lucide-react",
  "@oc-mui/plugin-system",
  "@oc-mui/ui/components",
  "@oc-mui/ui/components/icons",
  "@oc-mui/ui/lib",
  "@oc-mui/ui/lib/utils",
  "@oc-mui/query",
  "@oc-mui/router",
  "@oc-mui/utils",
  "@oc-mui/i18n",
];

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Transform ES module source to use shared modules from window.__SHARED_MODULES__
 *
 * Replaces bare import specifiers with references to the shared module registry.
 * When pluginScriptUrl is provided, injects __PLUGIN_BASE_URL__ so loaders that
 * dynamic-import sibling chunks (e.g. univie.mjs) resolve from the server path
 * instead of the blob URL.
 *
 * @param source - ES module source code
 * @param pluginScriptUrl - Optional URL of the plugin .mjs (used to inject base URL for dynamic imports)
 * @returns Transformed source with a preamble that provides the modules
 */
export function transformModuleSource(source: string, pluginScriptUrl?: string): string {
  const sharedModules = (window as unknown as { __SHARED_MODULES__?: Record<string, unknown> })
    .__SHARED_MODULES__;
  if (typeof window === "undefined" || !sharedModules) {
    remoteLoaderLogger.warn("Shared modules not available, skipping transformation");
    return source;
  }

  const moduleNames = SHARED_MODULE_NAMES;

  // Base URL for this plugin (directory of the .mjs). Used by multi-chunk plugins (e.g. univie)
  // so dynamic imports resolve to the server path instead of the blob URL.
  // Resolve against window.location.href so both relative and absolute plugin URLs stay valid.
  const baseUrlLine =
    pluginScriptUrl != null
      ? `const __PLUGIN_BASE_URL__ = ${JSON.stringify(pluginScriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^/]*$/, "/"))};\nconst __PLUGIN_BASE_URL_FULL__ = (typeof window !== "undefined" && window.location ? new URL(__PLUGIN_BASE_URL__, window.location.href).href : __PLUGIN_BASE_URL__);\n`
      : "";

  const preamble = `
// === Community Plugin Module Shim ===
${baseUrlLine}const __sharedModules__ = window.__SHARED_MODULES__;
${moduleNames
      .map((name) => {
        const varName = `__mod_${name.replace(/[^a-zA-Z0-9]/g, "_")}__`;
        return `const ${varName} = __sharedModules__["${name}"];`;
      })
      .join("\n")}
// === End Shim ===

`;

  let transformed = source;
  let replacementCount = 0;

  const sortedModuleNames = [...moduleNames].sort((a, b) => b.length - a.length);

  for (const name of sortedModuleNames) {
    const varName = `__mod_${name.replace(/[^a-zA-Z0-9]/g, "_")}__`;
    const escapedName = escapeRegExp(name);

    const namedImportRegex = new RegExp(
      `import\\s*\\{([^}]+)\\}\\s+from\\s+["']${escapedName}["']\\s*;?`,
      "g",
    );
    transformed = transformed.replace(namedImportRegex, (_match, imports) => {
      replacementCount++;
      const importList = (imports as string)
        .split(",")
        .map((s: string) => s.trim().replace(/\s+as\s+/g, ": "));
      return `const { ${importList.join(", ")} } = ${varName};`;
    });

    const namespaceImportRegex = new RegExp(
      `import\\s+\\*\\s+as\\s+(\\w+)\\s+from\\s+["']${escapedName}["']\\s*;?`,
      "g",
    );
    transformed = transformed.replace(namespaceImportRegex, (_match, alias) => {
      replacementCount++;
      return `const ${alias} = ${varName};`;
    });

    const defaultImportRegex = new RegExp(
      `import\\s+(\\w+)\\s+from\\s+["']${escapedName}["']\\s*;?`,
      "g",
    );
    transformed = transformed.replace(defaultImportRegex, (_match, alias) => {
      replacementCount++;
      return `const ${alias} = ${varName}.default || ${varName};`;
    });

    const mixedImportRegex = new RegExp(
      `import\\s+(\\w+)\\s*,\\s*\\{([^}]+)\\}\\s+from\\s+["']${escapedName}["']\\s*;?`,
      "g",
    );
    transformed = transformed.replace(mixedImportRegex, (_match, defaultAlias, namedImports) => {
      replacementCount++;
      const importList = (namedImports as string)
        .split(",")
        .map((s: string) => s.trim().replace(/\s+as\s+/g, ": "));
      return `const ${defaultAlias} = ${varName}.default || ${varName};\nconst { ${importList.join(", ")} } = ${varName};`;
    });

    const sideEffectImportRegex = new RegExp(
      `import\\s+["']${escapedName}["']\\s*;?`,
      "g",
    );
    transformed = transformed.replace(sideEffectImportRegex, () => {
      replacementCount++;
      return `// Side-effect import removed: ${name} (already available via shared modules)`;
    });
  }

  if (replacementCount > 0) {
    remoteLoaderLogger.debug(`Made ${replacementCount} import replacement(s)`);
  }

  const remainingImports = transformed.match(/import\s+.*?\s+from\s+["'][^"']+["']/g);
  if (remainingImports) {
    remoteLoaderLogger.warn("Unhandled imports remaining", { imports: remainingImports });
    for (const importStmt of remainingImports) {
      for (const name of moduleNames) {
        if (importStmt.includes(`"${name}"`) || importStmt.includes(`'${name}'`)) {
          const varName = `__mod_${name.replace(/[^a-zA-Z0-9]/g, "_")}__`;
          const mixedMatch = importStmt.match(/import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from/);
          if (mixedMatch?.[2]) {
            const [, defaultAlias, namedImports] = mixedMatch;
            const importList = namedImports
              .split(",")
              .map((s: string) => s.trim().replace(/\s+as\s+/g, ": "));
            const replacement = `const ${defaultAlias} = ${varName}.default || ${varName};\nconst { ${importList.join(", ")} } = ${varName};`;
            transformed = transformed.replace(importStmt, replacement);
            break;
          }
          const aggressiveRegex = new RegExp(
            `import\\s+.*?from\\s+["']${escapeRegExp(name)}["']\\s*;?\\s*`,
            "gi",
          );
          transformed = transformed.replace(aggressiveRegex, "");
        }
      }
    }
  }

  return preamble + transformed;
}
