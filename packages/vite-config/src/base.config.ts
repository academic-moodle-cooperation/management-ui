import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { type UserConfig, type PluginOption } from "vite";
// import path from "node:path"; // path.resolve for '@' alias is app-specific

export interface CreateBaseConfigOptions {
  isProduction: boolean;
  plugins?: PluginOption[];
  resolveAliases?: Record<string, string>; // Aliases are passed in by the specific config creator.
  serverOptions?: UserConfig["server"]; // Server options are passed in.
  buildOptions?: UserConfig["build"]; // Build options are passed in; 'base' will be set by the caller.
}

export const createBaseConfig = ({
  isProduction,
  plugins = [],
  resolveAliases = {},
  serverOptions = {},
  buildOptions = {},
}: CreateBaseConfigOptions): UserConfig => {
  const baseUserConfig: UserConfig = {
    plugins: [react(), tailwindcss(), ...plugins],
    resolve: {
      alias: {
        ...resolveAliases, // Specific aliases like '@monorepo-apps' or '@/' are set by the calling config creator.
      },
      dedupe: ["lucide-react", "react", "react-dom"],
    },
    server: {
      // Specific fs.allow settings are handled by the calling config creator.
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
      },
      allowedHosts: ["localhost", "127.0.0.1", "eddies-m4-mbp.tailade2d0.ts.net"],
      ...serverOptions, // Merges with any server options provided by the caller.
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        external: (id) => {
          // Don't externalize lucide-react - we want it bundled
          if (id === "lucide-react") return false;
          return false;
        },
      },
      ...buildOptions, // Merges with build options; 'base' is explicitly set by the caller.
    },
    // The 'base' property for Vite (both for dev and build) is NOT set here.
    // It will be set by the more specific createShellAppViteConfig or createPluginAppViteConfig.
  };

  return baseUserConfig;
};
