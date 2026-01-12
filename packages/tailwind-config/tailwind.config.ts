import type { Config } from "tailwindcss";
import { shadcnPreset } from "./src/shadcn-preset";

export default {
  presets: [shadcnPreset],
  content: [],
  // Allow consuming packages to customize content paths
} satisfies Config;
