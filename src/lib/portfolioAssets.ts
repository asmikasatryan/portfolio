import { HEADER_AVATAR_SRC } from '../components/SiteHeader/consts'

/** Fallback when `VITE_SITE_URL` is unset and app runs on localhost. */
const FALLBACK_PUBLIC_SITE = 'https://portfolio-fawn-three-56.vercel.app'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export function isLocalDevOrigin(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return LOCAL_HOSTS.has(window.location.hostname)
}

/** Public site origin for building D-ID-accessible asset URLs. */
export function getPublicSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && !isLocalDevOrigin()) {
    return window.location.origin
  }
  return FALLBACK_PUBLIC_SITE
}

/** Absolute avatar URL that D-ID can fetch (never localhost in dev). */
export function getPortfolioAvatarSourceUrl(): string {
  const base = getPublicSiteOrigin()
  return new URL(HEADER_AVATAR_SRC, `${base}/`).href
}

const DID_IMAGE_URL_RE = /\.(jpe?g|png)(\?.*)?$/i

export function validateDidSourceUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) {
    return 'Please provide a public source image URL.'
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return 'Enter a full URL starting with https:// (must end with .jpg, .jpeg, or .png).'
  }

  if (!/^https?:$/i.test(parsed.protocol)) {
    return 'Image URL must use http or https.'
  }

  if (LOCAL_HOSTS.has(parsed.hostname)) {
    return 'D-ID cannot use localhost. Use your deployed site URL or a public image host (e.g. imgbb).'
  }

  const pathForExt = parsed.pathname.split('/').pop() ?? ''
  if (!DID_IMAGE_URL_RE.test(pathForExt)) {
    return 'Image URL must end with .jpg, .jpeg, or .png (D-ID requirement).'
  }

  return null
}

export function isLocalhostSourceUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url.trim()).hostname)
  } catch {
    return false
  }
}
