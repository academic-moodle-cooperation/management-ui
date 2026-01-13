/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INSTITUTION_NAME?: string;
  readonly VITE_INSTITUTION_WEBSITE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
