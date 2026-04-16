import eslintPluginReactRefresh from "eslint-plugin-react-refresh";

import { config as baseConfig } from "@workspace/eslint-config/base";
import { config as reactConfig } from "@workspace/eslint-config/react-internal";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  ...reactConfig,
  {
    // Configuration specific to this app (shell)
    files: ["src/**/*.{ts,tsx}"], // Apply only to src files
    plugins: {
      "react-refresh": eslintPluginReactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // You can add other app-specific rules or overrides here
    },
    languageOptions: {
      // You might need to specify parserOptions or globals if your app needs them
      // and they are not covered by the base/react configs.
      // For example, if you use specific Vite environment variables:
      // globals: {
      //   'import.meta.env': 'readonly',
      // }
    },
  },
  // If you have other specific needs for this app, add more config objects
  // For example, to ignore specific files for this app:
  // {
  //   ignores: ['src/some-generated-file.ts']
  // }
];
