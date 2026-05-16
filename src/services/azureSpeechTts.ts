/**
 * Azure US English **Ava Multilingual** neural (user-requested “Eva”: Microsoft’s name is *Ava*).
 * https://learn.microsoft.com/azure/ai-services/speech-service/language-support
 */
const PRIMARY_VOICE = 'en-US-AvaMultilingualNeural'
/** If primary unsupported in region / account, try Emma multilingual. */
const FALLBACK_VOICE = 'en-US-EmmaMultilingualNeural'
/** Slightly slower, conversational pace (1.0 = default). */
const SPEAKING_RATE = '0.82'
/** Light lift for clarity on compressed MP3. */
const PITCH_PERCENT = '+4%'
const VOLUME_PERCENT = '+4%'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSsml(paragraphs: string[], voiceName = PRIMARY_VOICE): string {
  const body = paragraphs
    .map((paragraph) => {
      const safe = escapeXml(paragraph.trim())
      if (!safe) return ''
      return [
        '<p>',
        `<prosody rate="${SPEAKING_RATE}" pitch="${PITCH_PERCENT}" volume="${VOLUME_PERCENT}">${safe}</prosody>`,
        '<break time="700ms"/>',
        '</p>',
      ].join('')
    })
    .filter(Boolean)
    .join('')

  return [
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">',
    `<voice name="${voiceName}">${body}</voice>`,
    '</speak>',
  ].join('')
}

/** True when Azure key + region are available (client `VITE_*` and/or Vite `define` flag from vite.config). */
export function isAzureSpeechConfigured(): boolean {
  const key = import.meta.env.VITE_AZURE_SPEECH_KEY?.trim()
  const region = import.meta.env.VITE_AZURE_SPEECH_REGION?.trim()
  const fromEnv = Boolean(
    key &&
      region &&
      key !== 'azure-speech-key' &&
      key.toLowerCase() !== 'your_key_here',
  )
  return fromEnv || __ABOUT_AZURE_READY_STR__ === '1'
}

async function fetchAzureSpeechMp3(ssml: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch('/api/azure-speech', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/ssml+xml' },
    body: ssml,
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      const detail = payload.error ?? `Azure Speech error ${response.status}`
      if (response.status === 401) {
        throw new Error(
          'Azure Speech 401: invalid key. In Azure Portal open your Speech resource → Keys and Endpoint → copy Key 1 (long hex string), not the Resource ID (UUID). Match VITE_AZURE_SPEECH_REGION to that resource’s region, save .env, restart pnpm dev.',
        )
      }
      throw new Error(detail)
    }
    const detail = (await response.text().catch(() => '')).slice(0, 280)
    if (response.status === 401) {
      throw new Error(
        'Azure Speech 401: invalid key. Use Key 1 from Keys and Endpoint (not Resource ID). Check region matches the resource.',
      )
    }
    throw new Error(detail || `Azure Speech error ${response.status}`)
  }

  const audio = await response.arrayBuffer()
  if (audio.byteLength < 512) {
    throw new Error('Azure returned empty audio. Check your Speech key and region in .env.')
  }

  return audio
}

/** Server has Azure credentials (dev proxy or Vercel); fixes client env / define drift on Windows. */
export async function probeAzureSpeechConfigured(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch('/api/azure-speech', {
      method: 'GET',
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return false
    const data = (await response.json()) as { configured?: boolean }
    return data.configured === true
  } catch {
    return false
  }
}

/** Synthesize paragraphs to MP3 via server proxy (Ava Multilingual → fallback Emma Multilingual). */
export async function synthesizeAzureSpeechMp3(
  paragraphs: readonly string[],
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const lines = paragraphs.map((p) => p.trim()).filter(Boolean)
  if (!lines.length) return new ArrayBuffer(0)

  try {
    return await fetchAzureSpeechMp3(buildSsml(lines), signal)
  } catch (primaryErr) {
    if (signal?.aborted) throw primaryErr
    const msg = primaryErr instanceof Error ? primaryErr.message : ''
    if (!/400|voice|invalid|unsupported/i.test(msg)) throw primaryErr
    return fetchAzureSpeechMp3(buildSsml(lines, FALLBACK_VOICE), signal)
  }
}
