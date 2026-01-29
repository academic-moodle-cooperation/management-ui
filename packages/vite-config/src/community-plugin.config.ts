/**
 * Community Plugin Vite Configuration
 *
 * Provides a pre-configured Vite setup for building community plugins as
 * ES modules that can be dynamically loaded by the Management UI Core.
 *
 * Key features:
 * - Library mode (ES module output)
 * - External dependencies (@workspace/*, react, react-dom)
 * - GraphQL fragment extraction
 * - Source maps for debugging
 *
 * Usage in a community plugin's vite.config.ts:
 * ```typescript
 * import { createCommunityPluginConfig } from "@workspace/vite-config";
 *
 * export default createCommunityPluginConfig({
 *   pluginName: "my-community-plugin",
 *   entry: "./src/index.ts",
 * });
 * ```
 */
import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { type UserConfig, type LibraryOptions, type PluginOption } from "vite";

import { fragmentExtractorPlugin } from "./plugins/fragment-extractor.js";

export interface CreateCommunityPluginConfigOptions {
  /**
   * The name of the plugin (used for output filename)
   * @example "my-community-plugin"
   */
  pluginName: string;

  /**
   * Entry point file path (relative to project root)
   * @default "./src/index.ts"
   */
  entry?: string;

  /**
   * Output directory for built files
   * @default "dist"
   */
  outDir?: string;

  /**
   * Whether to generate source maps
   * @default true
   */
  sourcemap?: boolean;

  /**
   * Whether to minify the output
   * @default true
   */
  minify?: boolean;

  /**
   * Additional external dependencies to exclude from bundle
   * @default []
   */
  additionalExternals?: (string | RegExp)[];

  /**
   * Whether to extract and inject GraphQL fragments
   * @default true
   */
  extractFragments?: boolean;

  /**
   * Directory to scan for GraphQL fragments
   * @default "src"
   */
  fragmentSrcDir?: string;
}

/**
 * Default external dependencies that should NOT be bundled.
 * These are provided by the host application (Management UI Core).
 */
const DEFAULT_EXTERNALS: (string | RegExp)[] = [
  // React ecosystem - provided by host
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",

  // All workspace packages - provided by host
  /^@workspace\//,

  // Common UI libraries that host provides
  "lucide-react",
];

/**
 * Creates a Vite configuration for building a community plugin.
 *
 * The resulting bundle is an ES module that:
 * - Exports a default plugin object (createPlugin result)
 * - Optionally exports __injected_fragments__ for GraphQL extension
 * - Does NOT include React or workspace packages (external)
 *
 * @param options - Configuration options
 * @returns Vite UserConfig
 */
export function createCommunityPluginConfig(options: CreateCommunityPluginConfigOptions): UserConfig {
  const {
    pluginName,
    entry = "./src/index.ts",
    outDir = "dist",
    sourcemap = true,
    minify = true,
    additionalExternals = [],
    extractFragments = true,
    fragmentSrcDir = "src",
  } = options;

  // Combine default and additional externals
  const allExternals = [...DEFAULT_EXTERNALS, ...additionalExternals];

  // Build the library options
  const libOptions: LibraryOptions = {
    entry: path.resolve(process.cwd(), entry),
    name: pluginName.replace(/-/g, "_"), // Convert kebab-case to snake_case for UMD name
    fileName: (format) => `${pluginName}.${format === "es" ? "mjs" : "js"}`,
    formats: ["es"], // Only ES modules for dynamic import()
  };

  // Build plugins array
  const plugins: PluginOption[] = [react()];

  if (extractFragments) {
    plugins.push(
      fragmentExtractorPlugin({
        srcDir: fragmentSrcDir,
      }),
    );
  }

  const config: UserConfig = {
    plugins,

    build: {
      lib: libOptions,
      outDir,
      emptyOutDir: true,
      sourcemap,
      minify,

      rollupOptions: {
        // External dependencies - these are provided by the host
        external: (id) => {
          // Check string externals
          for (const external of allExternals) {
            if (typeof external === "string" && id === external) {
              return true;
            }
            if (external instanceof RegExp && external.test(id)) {
              return true;
            }
          }
          return false;
        },

        output: {
          // Preserve export names
          exports: "named",

          // Generate clean output
          generatedCode: {
            constBindings: true,
          },

          // Global names for external dependencies (for potential UMD builds)
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "ReactJSXRuntime",
          },
        },
      },
    },

    // Ensure we don't have issues with JSX
    esbuild: {
      jsx: "automatic",
    },

    // Resolve configuration
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  };

  return config;
}

export type { ExtractedFragment } from "./plugins/fragment-extractor.js";

export default createCommunityPluginConfig;
