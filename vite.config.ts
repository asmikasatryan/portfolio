import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import {
  ensureAllClips,
  normalizeClip,
  normalizeClipList,
  type SavedClip,
} from './src/lib/savedClips'

const configDir = path.dirname(fileURLToPath(import.meta.url))

/** Some Windows editors save `.env` as UTF-16 LE; Vite’s loader can miss keys. */
function decodeEnvFile(buf: Buffer): string {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.subarray(2).toString('utf16le')
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3).toString('utf8')
  }
  return buf.toString('utf8')
}

function parseEnvText(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq <= 0) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    if (k) out[k] = v
  }
  return out
}

function readEnvFile(dir: string, name: string): Record<string, string> {
  const full = path.join(dir, name)
  try {
    return parseEnvText(decodeEnvFile(fs.readFileSync(full)))
  } catch {
    return {}
  }
}

function readDotEnvFiles(dir: string, mode: string): Record<string, string> {
  return {
    ...readEnvFile(dir, '.env'),
    ...readEnvFile(dir, '.env.local'),
    ...readEnvFile(dir, `.env.${mode}`),
    ...readEnvFile(dir, `.env.${mode}.local`),
  }
}

/** 48 kHz — clearer speech MP3. */
const OUTPUT_FORMAT = 'audio-48khz-192kbitrate-mono-mp3'

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function isPlaceholderKey(key: string): boolean {
  const k = key.toLowerCase()
  return k === '' || k === 'azure-speech-key' || k === 'your_key_here'
}

function resolveAzureEnv(env: Record<string, string>): {
  key: string
  region: string
  ready: boolean
} {
  const key = (env.VITE_AZURE_SPEECH_KEY || env.AZURE_SPEECH_KEY || '').trim()
  const region = (env.VITE_AZURE_SPEECH_REGION || env.AZURE_SPEECH_REGION || '').trim()
  const ready = Boolean(key && region && !isPlaceholderKey(key))
  return { key, region, ready }
}

const SAVED_CLIPS_FILE = path.join(configDir, 'public', 'saved-clips.json')

function readDevClipsFile(): SavedClip[] {
  try {
    const raw = fs.readFileSync(SAVED_CLIPS_FILE, 'utf8')
    return normalizeClipList(JSON.parse(raw))
  } catch {
    return []
  }
}

function writeDevClipsFile(clips: SavedClip[]): void {
  const aiOnly = clips.filter((c) => !c.builtIn)
  fs.mkdirSync(path.dirname(SAVED_CLIPS_FILE), { recursive: true })
  fs.writeFileSync(SAVED_CLIPS_FILE, `${JSON.stringify(aiOnly, null, 2)}\n`, 'utf8')
}

function clipsDevApi(): Plugin {
  return {
    name: 'clips-dev-api',
    configureServer(server) {
      server.middlewares.use(
        '/api/clips',
        async (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method === 'GET') {
            const all = ensureAllClips(readDevClipsFile())
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify({ clips: all }))
            return
          }

          if (req.method !== 'POST') {
            next()
            return
          }

          try {
            const bodyText = await readRequestBody(req)
            const body = JSON.parse(bodyText) as Partial<SavedClip>
            const incoming = normalizeClip(body)
            if (!incoming || incoming.builtIn) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid clip payload' }))
              return
            }

            const existing = readDevClipsFile()
            const byUrl = new Map(existing.map((c) => [c.videoUrl, c]))
            byUrl.set(incoming.videoUrl, incoming)
            const merged = [...byUrl.values()].sort((a, b) => b.createdAt - a.createdAt)
            writeDevClipsFile(merged)
            const all = ensureAllClips(merged)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify({ clips: all }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : 'Failed to save clip',
              }),
            )
          }
        },
      )
    },
  }
}

function azureSpeechDevApi(azureKey: string, azureRegion: string): Plugin {
  return {
    name: 'azure-speech-dev-api',
    configureServer(server) {
      server.middlewares.use(
        '/api/azure-speech',
        async (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method === 'GET') {
            const configured = Boolean(
              azureKey && azureRegion && !isPlaceholderKey(azureKey),
            )
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify({ configured }))
            return
          }

          if (req.method !== 'POST') {
            next()
            return
          }

          if (!azureKey || !azureRegion || isPlaceholderKey(azureKey)) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Azure Speech is not configured in .env' }))
            return
          }

          try {
            const ssml = await readRequestBody(req)
            if (!ssml.trim()) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing SSML body' }))
              return
            }

            const azureRes = await fetch(
              `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
              {
                method: 'POST',
                headers: {
                  'Ocp-Apim-Subscription-Key': azureKey,
                  'Content-Type': 'application/ssml+xml',
                  'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
                  'User-Agent': 'portfolio-about-tts',
                },
                body: ssml,
              },
            )

            if (!azureRes.ok) {
              const detail = (await azureRes.text().catch(() => '')).slice(0, 280)
              res.statusCode = azureRes.status
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: detail || `Azure Speech error ${azureRes.status}`,
                }),
              )
              return
            }

            const audio = Buffer.from(await azureRes.arrayBuffer())
            res.statusCode = 200
            res.setHeader('Content-Type', 'audio/mpeg')
            res.setHeader('Cache-Control', 'no-store')
            res.end(audio)
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : 'Azure proxy failed',
              }),
            )
          }
        },
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const fromDisk = readDotEnvFiles(configDir, mode)
  const fromVite = {
    ...loadEnv(mode, configDir, 'VITE_'),
    ...loadEnv(mode, configDir, 'AZURE_'),
  }
  const loaded: Record<string, string> = { ...fromDisk, ...fromVite }
  if (process.env.VITE_AZURE_SPEECH_KEY?.trim()) {
    loaded.VITE_AZURE_SPEECH_KEY = process.env.VITE_AZURE_SPEECH_KEY.trim()
  }
  if (process.env.VITE_AZURE_SPEECH_REGION?.trim()) {
    loaded.VITE_AZURE_SPEECH_REGION = process.env.VITE_AZURE_SPEECH_REGION.trim()
  }
  const { key: azureKey, region: azureRegion, ready: azureReady } = resolveAzureEnv(loaded)

  return {
    /** Same folder as this file — fixes empty env when `process.cwd()` ≠ project root. */
    envDir: configDir,
    define: {
      /** Avoid `import.meta.env.VITE_*` define merges (often dropped); esbuild inlines this identifier. */
      __ABOUT_AZURE_READY_STR__: JSON.stringify(azureReady ? '1' : '0'),
    },
    plugins: [react(), clipsDevApi(), azureSpeechDevApi(azureKey, azureRegion)],
  }
})
