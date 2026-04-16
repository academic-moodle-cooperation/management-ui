/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly VITE_PROXY_TARGET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
