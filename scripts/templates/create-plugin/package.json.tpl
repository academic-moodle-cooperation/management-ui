{
  "name": "@opencast-mui/plugin-__PLUGIN_NAME__",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "check-types": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run",
    "test:contract": "vitest run plugin.contract"
  },
  "dependencies": {
    "@opencast-mui/plugin-system": "workspace:*",
    "@opencast-mui/utils": "workspace:*",
    "react": "^19.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.0.0 || ^19.0.0",
    "@opencast-mui/eslint-config": "workspace:*",
    "@opencast-mui/plugin-testing": "workspace:*",
    "@opencast-mui/typescript-config": "workspace:*",
    "@opencast-mui/vite-config": "workspace:*",
    "eslint": "^9.20.0",
    "typescript": "^5.3.3",
    "vite": "^6.3.5",
    "vitest": "^4.0.17"
  }
}
