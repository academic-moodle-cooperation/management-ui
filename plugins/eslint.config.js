import { config as reactInternal } from "@opencast-mui/eslint-config/react-internal";

export default [
  ...reactInternal,
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["node_modules/**", "dist/**", ".turbo/**", "tsconfig.tsbuildinfo"],
  },
];
