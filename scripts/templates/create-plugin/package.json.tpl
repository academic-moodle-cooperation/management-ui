{
  "name": "@workspace/plugin-__PLUGIN_NAME__",
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
    "@workspace/plugin-system": "workspace:*",
    "@workspace/utils": "workspace:*",
    "react": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0 || ^19.0.0",
    "@workspace/eslint-config": "workspace:*",
    "@workspace/plugin-testing": "workspace:*",
    "@workspace/typescript-config": "workspace:*",
    "eslint": "^9.20.0",
    "typescript": "^5.3.3",
    "vitest": "^4.0.17"
  }
}
