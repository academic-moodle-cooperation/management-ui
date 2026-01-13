import type { Plugin } from "vite";
import fs from "fs";
import path from "path";

export interface GenerateConfigPluginOptions {
  /** Path to output the config.json file (relative to outDir) */
  outputPath?: string;
  /** Default config object (imported from @workspace/ui-config) */
  defaultConfig: Record<string, unknown>;
  /** Plugin config objects to merge (imported directly in vite.config.ts) */
  pluginConfigs?: Array<Record<string, unknown>>;
}

/**
 * Deep merge utility (same as @workspace/utils/deepMerge)
 * Inlined here to avoid build-time import issues
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Partial<T> | Record<string, unknown>>
): T {
  return sources.reduce(
    (acc, source) => {
      if (!source) return acc;
      const sourceRecord = source as Record<string, unknown>;
      Object.keys(sourceRecord).forEach((key) => {
        const sourceValue = sourceRecord[key];
        const accValue = acc[key];
        if (Array.isArray(accValue) && Array.isArray(sourceValue)) {
          // Replace arrays (don't merge them)
          (acc as Record<string, unknown>)[key] = sourceValue;
        } else if (
          accValue &&
          typeof accValue === "object" &&
          sourceValue &&
          typeof sourceValue === "object" &&
          !Array.isArray(accValue) &&
          !Array.isArray(sourceValue)
        ) {
          // Recursively merge objects
          (acc as Record<string, unknown>)[key] = deepMerge(
            { ...(accValue as Record<string, unknown>) },
            sourceValue as Record<string, unknown>
          );
        } else if (sourceValue !== undefined) {
          // Replace primitive values
          (acc as Record<string, unknown>)[key] = sourceValue;
        }
      });
      return acc;
    },
    { ...target }
  ) as T;
}

/**
 * Vite plugin to generate production config.json at build time.
 *
 * This plugin:
 * 1. Imports the defaultConfig from @workspace/ui-config
 * 2. Imports plugin-specific configs (e.g., from plugins/univie/implementations/config)
 * 3. Deep merges them using the same logic as runtime
 * 4. Writes the result to dist/ui/config/management-ui/config.json
 *
 * Usage in vite.config.ts:
 * ```ts
 * import { generateConfigPlugin } from '@workspace/vite-config';
 * import { defaultConfig } from '@workspace/ui-config';
 * import { config as univieConfig } from '../../plugins/univie/implementations/config/config';
 *
 * plugins: [
 *   generateConfigPlugin({
 *     defaultConfig,
 *     pluginConfigs: [univieConfig]
 *   })
 * ]
 * ```
 */
export function generateConfigPlugin(options: GenerateConfigPluginOptions): Plugin {
  const {
    outputPath = "ui/config/management-ui/config.json",
    defaultConfig,
    pluginConfigs = [],
  } = options;

  let monorepoRoot: string;
  let outDir: string;

  return {
    name: "generate-config-plugin",

    configResolved(config) {
      // Detect monorepo root (go up from the app's root)
      monorepoRoot = path.resolve(config.root, "../..");
      outDir = path.resolve(config.root, config.build.outDir);
    },

    async closeBundle() {
      try {
        console.log("[generate-config] Generating production config.json...");
        console.log(`[generate-config] Merging ${pluginConfigs.length} plugin config(s)...`);

        // Deep merge configs (same logic as in useAppConfig.ts)
        const mergedConfig = deepMerge({ ...defaultConfig }, ...pluginConfigs);

        // Write to output
        const fullOutputPath = path.join(outDir, outputPath);
        const outputDir = path.dirname(fullOutputPath);

        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(fullOutputPath, JSON.stringify(mergedConfig, null, 2), "utf-8");

        console.log(
          `[generate-config] ✓ Config written to ${path.relative(process.cwd(), fullOutputPath)}`
        );
        console.log(`[generate-config] Summary:`);
        // Type assertion needed because mergedConfig is Record<string, unknown>
        // We know the structure matches AppConfig from ui-config
        const config = mergedConfig as { app?: { theme?: string; orgLogoUrl?: string; logoUrl?: string; pluginNamespace?: unknown[] } };
        console.log(`  - Theme: ${config.app?.theme || "default"}`);
        console.log(`  - Logo: ${config.app?.orgLogoUrl || config.app?.logoUrl || "default"}`);
        console.log(`  - Plugins: ${(Array.isArray(config.app?.pluginNamespace) ? config.app.pluginNamespace.length : 0)} namespaces`);
      } catch (error) {
        console.error("[generate-config] Failed to generate config:", error);
        // Don't fail the build, just warn
      }
    },
  };
}
