/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the API. Falls back to the local server in dev.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
