/**
 * ES module source transformation for remote plugins.
 *
 * Replaces bare import specifiers with references to window.__SHARED_MODULES__
 * so community plugins can use host-provided packages (react, @workspace/*).
 */

import { logger } from "@workspace/utils";

const remoteLoaderLogger = logger.child({ component: "RemotePluginLoader" });

/**
 * Known shared modules that the host app provides.
 * Must match what is exposed in sharedModules (e.g. management-ui-core).
 * Longer paths first so subpaths are replaced before parent (e.g. ui/lib/utils before ui/lib).
 */
export const SHARED_MODULE_NAMES = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "lucide-react",
  "@workspace/plugin-system",
  "@workspace/ui/components",
  "@workspace/ui/components/icons",
  "@workspace/ui/lib",
  "@workspace/ui/lib/utils",
  "@workspace/query",
  "@workspace/router",
  "@workspace/utils",
  "@workspace/i18n",
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
 *
 * @param source - ES module source code
 * @returns Transformed source with a preamble that provides the modules
 */
export function transformModuleSource(source: string): string {
  const sharedModules = (window as unknown as { __SHARED_MODULES__?: Record<string, unknown> })
    .__SHARED_MODULES__;
  if (typeof window === "undefined" || !sharedModules) {
    remoteLoaderLogger.warn("Shared modules not available, skipping transformation");
    return source;
  }

  const moduleNames = SHARED_MODULE_NAMES;

  const preamble = `
// === Community Plugin Module Shim ===
const __sharedModules__ = window.__SHARED_MODULES__;
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
