/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly VITE_PROXY_TARGET: string;
  readonly MODE: string;
  readonly VITE_INSTITUTION_WEBSITE?: string;
  readonly VITE_INSTITUTION_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
