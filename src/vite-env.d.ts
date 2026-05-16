/// <reference types="vite/client" />

/** Injected by `vite.config.ts` `define`: `"1"` | `"0"`. */
declare const __ABOUT_AZURE_READY_STR__: string

interface ImportMetaEnv {
  readonly VITE_AZURE_SPEECH_KEY?: string
  readonly VITE_AZURE_SPEECH_REGION?: string
  /** Production site origin, e.g. https://your-app.vercel.app (for D-ID avatar URL in dev). */
  readonly VITE_SITE_URL?: string
}
