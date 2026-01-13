import { shadcnPreset } from "./src/shadcn-preset";

import type { Config } from "tailwindcss";

export default {
  presets: [shadcnPreset],
  content: [],
  // Allow consuming packages to customize content paths
} satisfies Config;
