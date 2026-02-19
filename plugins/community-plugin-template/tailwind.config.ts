import type { Config } from "tailwindcss";
import { shadcnPreset } from "@workspace/tailwind-config/shadcn-preset";

/**
 * Tailwind Configuration for Community Plugin
 *
 * This configuration uses the shared shadcn preset from @workspace/tailwind-config
 * to ensure consistency with the Management UI design system.
 *
 * The content array only includes files from THIS plugin, ensuring that:
 * - The plugin's Tailwind build is independent of the host
 * - No gitignore issues (the host doesn't need to scan plugin files)
 * - Each plugin can have its own Tailwind classes without conflicts
 */
export default {
  presets: [shadcnPreset],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Add plugin-specific theme extensions here if needed
      // Example:
      // colors: {
      //   "my-plugin-primary": "#your-color",
      // },
    },
  },
} satisfies Config;
