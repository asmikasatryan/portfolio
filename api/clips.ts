import fs from 'node:fs'
import path from 'node:path'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put } from '@vercel/blob'
import {
  ensureAllClips,
  normalizeClip,
  normalizeClipList,
  type SavedClip,
} from '../src/lib/savedClips'

const BLOB_PATHNAME = 'portfolio-saved-clips.json'
const PUBLIC_FILE = path.join(process.cwd(), 'public', 'saved-clips.json')

function readPublicClipsFile(): SavedClip[] {
  try {
    const raw = fs.readFileSync(PUBLIC_FILE, 'utf8')
    return normalizeClipList(JSON.parse(raw))
  } catch {
    return []
  }
}

function writePublicClipsFile(clips: SavedClip[]): void {
  const aiOnly = clips.filter((c) => !c.builtIn)
  fs.mkdirSync(path.dirname(PUBLIC_FILE), { recursive: true })
  fs.writeFileSync(PUBLIC_FILE, `${JSON.stringify(aiOnly, null, 2)}\n`, 'utf8')
}

async function readBlobClips(): Promise<SavedClip[] | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) {
    return null
  }
  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME, token })
    const match = blobs.find((b) => b.pathname === BLOB_PATHNAME)
    if (!match?.url) {
      return null
    }
    const res = await fetch(match.url)
    if (!res.ok) {
      return null
    }
    return normalizeClipList(await res.json())
  } catch {
    return null
  }
}

async function writeBlobClips(clips: SavedClip[]): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) {
    return
  }
  const aiOnly = clips.filter((c) => !c.builtIn)
  await put(BLOB_PATHNAME, JSON.stringify(aiOnly), {
    access: 'public',
    addRandomSuffix: false,
    token,
    contentType: 'application/json',
  })
}

async function loadAiClips(): Promise<SavedClip[]> {
  const fromBlob = await readBlobClips()
  if (fromBlob) {
    return fromBlob
  }
  return readPublicClipsFile()
}

async function saveAiClips(clips: SavedClip[]): Promise<void> {
  const aiOnly = clips.filter((c) => !c.builtIn)
  try {
    writePublicClipsFile(aiOnly)
  } catch {
    /* read-only filesystem on serverless */
  }
  await writeBlobClips(aiOnly)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const aiClips = await loadAiClips()
    return res.status(200).json({ clips: ensureAllClips(aiClips) })
  }

  if (req.method === 'POST') {
    const body = req.body as Partial<SavedClip>
    const incoming = normalizeClip(body)
    if (!incoming || incoming.builtIn) {
      return res.status(400).json({ error: 'Invalid clip payload' })
    }

    const existing = await loadAiClips()
    const byUrl = new Map(existing.map((c) => [c.videoUrl, c]))
    byUrl.set(incoming.videoUrl, incoming)
    const merged = [...byUrl.values()].sort((a, b) => b.createdAt - a.createdAt)

    await saveAiClips(merged)
    return res.status(200).json({ clips: ensureAllClips(merged) })
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
