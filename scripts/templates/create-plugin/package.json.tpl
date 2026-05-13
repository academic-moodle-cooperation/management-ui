{
  "name": "@oc-mui/plugin-__PLUGIN_NAME__",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "check-types": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run",
    "test:contract": "vitest run plugin.contract"
  },
  "dependencies": {
    "@oc-mui/plugin-system": "workspace:*",
    "@oc-mui/utils": "workspace:*",
    "react": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0 || ^19.0.0",
    "@oc-mui/eslint-config": "workspace:*",
    "@oc-mui/plugin-testing": "workspace:*",
    "@oc-mui/typescript-config": "workspace:*",
    "eslint": "^9.20.0",
    "typescript": "^5.3.3",
    "vitest": "^4.0.17"
  }
}
