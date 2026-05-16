import { HEADER_AVATAR_SRC } from '../components/SiteHeader/consts'

/** Local fallback video shipped in public/. */
export const FALLBACK_VIDEO_SRC = '/1778610328275.mp4'

export const PORTFOLIO_INTRO_ID = 'portfolio-intro'

export type SavedClip = {
  id: string
  videoUrl: string
  posterUrl: string
  scriptUsed?: string
  createdAt: number
  builtIn?: boolean
}

export function createPortfolioIntroClip(): SavedClip {
  return {
    id: PORTFOLIO_INTRO_ID,
    videoUrl: FALLBACK_VIDEO_SRC,
    posterUrl: HEADER_AVATAR_SRC,
    scriptUsed: 'Portfolio intro',
    createdAt: 0,
    builtIn: true,
  }
}

export function createClipId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeClip(raw: Partial<SavedClip>): SavedClip | null {
  if (!raw || typeof raw.videoUrl !== 'string' || !raw.videoUrl) {
    return null
  }
  const id =
    typeof raw.id === 'string' && raw.id
      ? raw.id
      : raw.videoUrl === FALLBACK_VIDEO_SRC
        ? PORTFOLIO_INTRO_ID
        : createClipId()
  return {
    id,
    videoUrl: raw.videoUrl,
    posterUrl: typeof raw.posterUrl === 'string' ? raw.posterUrl : '',
    scriptUsed: typeof raw.scriptUsed === 'string' ? raw.scriptUsed : undefined,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    builtIn:
      raw.builtIn === true ||
      id === PORTFOLIO_INTRO_ID ||
      raw.videoUrl === FALLBACK_VIDEO_SRC,
  }
}

export function normalizeClipList(raw: unknown): SavedClip[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const out: SavedClip[] = []
  for (const item of raw) {
    const clip = normalizeClip(item as Partial<SavedClip>)
    if (clip && !clip.builtIn) {
      out.push(clip)
    }
  }
  return out
}

/** Portfolio intro first, then AI clips newest → oldest. */
export function sortClipsForDisplay(clips: SavedClip[]): SavedClip[] {
  const builtIn = clips.filter((clip) => clip.builtIn)
  const generated = clips
    .filter((clip) => !clip.builtIn)
    .sort((a, b) => b.createdAt - a.createdAt)
  return [...builtIn, ...generated]
}

export function ensureAllClips(clips: SavedClip[]): SavedClip[] {
  const byId = new Map<string, SavedClip>()
  for (const clip of clips) {
    const normalized = normalizeClip(clip)
    if (normalized) {
      byId.set(normalized.id, normalized)
    }
  }
  if (!byId.has(PORTFOLIO_INTRO_ID)) {
    byId.set(PORTFOLIO_INTRO_ID, createPortfolioIntroClip())
  }
  return sortClipsForDisplay([...byId.values()])
}

export function formatClipDate(clip: SavedClip): string {
  if (clip.builtIn) {
    return 'Original clip'
  }
  return new Date(clip.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
