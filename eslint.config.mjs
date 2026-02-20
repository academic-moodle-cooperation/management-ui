import { config as reactInternal } from "./packages/eslint-config/react-internal.js";

export default [
  ...reactInternal,
  {
    files: [".local-plugins/**/*.{js,jsx,ts,tsx}"],
    ignores: ["**/node_modules/**", "**/dist/**", "**/.turbo/**", "**/target/**"],
  },
];
