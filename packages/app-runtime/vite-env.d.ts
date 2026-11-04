/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// `vite/client` (which declares `*.css`) is not resolvable from this package —
// Vite is not one of its dependencies — and TypeScript 6 rejects unresolved
// side-effect imports (TS2882). The consuming bundler handles the stylesheet.
declare module "*.css";
