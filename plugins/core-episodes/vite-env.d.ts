/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly VITE_PROXY_TARGET: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// `vite/client` (which declares `*.css`) is not resolvable from this plugin —
// Vite is not one of its dependencies — and TypeScript 6 rejects unresolved
// side-effect imports (TS2882). Vite handles the stylesheet at build time.
declare module "*.css";
