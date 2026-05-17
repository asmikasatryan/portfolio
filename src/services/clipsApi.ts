import axios from 'axios'
import {
  ensureAllClips,
  normalizeClip,
  normalizeClipList,
  type SavedClip,
} from '../lib/savedClips'

const LEGACY_CLIP_STORAGE_KEY = 'home:generatedVideo'
const LEGACY_CLIPS_STORAGE_KEY = 'home:generatedClips'

function isJsonClipsPayload(data: unknown): data is { clips?: unknown } | unknown[] {
  if (Array.isArray(data)) {
    return true
  }
  return typeof data === 'object' && data !== null && 'clips' in data
}

async function fetchSavedClipsFile(signal?: AbortSignal): Promise<SavedClip[]> {
  const { data } = await axios.get<unknown>('/saved-clips.json', {
    signal,
    params: { t: Date.now() },
  })
  return ensureAllClips(normalizeClipList(data))
}

export async function fetchSharedClips(signal?: AbortSignal): Promise<SavedClip[]> {
  try {
    const { data, headers } = await axios.get<unknown>('/api/clips', {
      signal,
      headers: { 'Cache-Control': 'no-store' },
    })
    const contentType = String(headers['content-type'] ?? '')
    if (contentType.includes('application/json') && isJsonClipsPayload(data)) {
      const clips = Array.isArray(data) ? data : (data as { clips?: unknown }).clips
      return ensureAllClips(normalizeClipList(clips))
    }
  } catch {
    /* use saved-clips.json fallback */
  }

  try {
    return await fetchSavedClipsFile(signal)
  } catch {
    return ensureAllClips([])
  }
}

export async function addSharedClip(clip: SavedClip): Promise<SavedClip[]> {
  const { data } = await axios.post<{ clips: unknown }>('/api/clips', clip, {
    headers: { 'Content-Type': 'application/json' },
  })
  return ensureAllClips(normalizeClipList(data.clips))
}

/** One-time: push old browser-only clips to the shared gallery. */
export function readLegacyLocalClips(): SavedClip[] {
  if (typeof window === 'undefined') {
    return []
  }
  const found: SavedClip[] = []

  try {
    const raw = window.localStorage.getItem(LEGACY_CLIPS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      found.push(...normalizeClipList(parsed))
    }
  } catch {
    /* ignore */
  }

  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_CLIP_STORAGE_KEY)
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Partial<SavedClip>
      const migrated = normalizeClip(legacy)
      if (migrated && !migrated.builtIn) {
        found.push(migrated)
      }
    }
  } catch {
    /* ignore */
  }

  return found
}

export function clearLegacyLocalClips(): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.removeItem(LEGACY_CLIPS_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_CLIP_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
