/**
 * Vite Configuration for Community Plugin
 *
 * This configuration builds the plugin as an ES module that can be
 * dynamically loaded by the Management UI Core.
 *
 * Key points:
 * - Library mode produces a single .mjs file
 * - React and @workspace/* packages are external (provided by host)
 * - GraphQL fragments in src/**\/*.graphql are auto-extracted
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// Read plugin name from package.json
import pkg from "./package.json";
const pluginName = pkg.pluginMetadata?.id || "community-plugin";

export default defineConfig({
  plugins: [react()],

  css: {
    postcss: "./postcss.config.mjs",
  },

  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: pluginName.replace(/-/g, "_"),
      fileName: (format) => `${pluginName}.${format === "es" ? "mjs" : "js"}`,
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: true,

    rollupOptions: {
      // External dependencies - these are provided by the host application
      external: (id) => {
        // React ecosystem
        if (
          id === "react" ||
          id === "react-dom" ||
          id === "react/jsx-runtime" ||
          id === "react/jsx-dev-runtime" ||
          id.startsWith("react/")
        ) {
          return true;
        }

        // All workspace packages (check both package name and resolved paths)
        if (id.startsWith("@workspace/") || id.includes("/packages/")) {
          return true;
        }

        // Common shared dependencies
        if (id === "lucide-react" || id.startsWith("lucide-react/")) {
          return true;
        }

        // Additional workspace packages that might be imported
        if (id.startsWith("@workspace/query") || id.includes("/packages/query")) {
          return true;
        }

        return false;
      },

      output: {
        exports: "named",
        generatedCode: {
          constBindings: true,
        },
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime",
        },
        // Ensure CSS is output as a separate file
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css" || assetInfo.name?.endsWith(".css")) {
            return `${pluginName}.css`;
          }
          return assetInfo.name || "asset";
        },
      },
    },
  },

  esbuild: {
    jsx: "automatic",
  },

  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
