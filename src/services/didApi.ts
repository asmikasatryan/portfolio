import axios from 'axios'

const DID_BASE_URL = 'https://api.d-id.com'

/** Microsoft neural voice via D-ID TTS (no Azure Speech key required). */
export const DID_MICROSOFT_VOICE_ID = 'en-US-AvaMultilingualNeural'

export function buildMicrosoftTalkScript(input: string): TalkScript {
  return {
    type: 'text',
    input: input.trim(),
    provider: {
      type: 'microsoft',
      voice_id: DID_MICROSOFT_VOICE_ID,
    },
  }
}

export type TalkScript = {
  type: 'text'
  input: string
  provider?: {
    type: string
    voice_id?: string
  }
}

export type TalkLogo = {
  url: string
  position: [number, number]
}

export type TalksConfig = {
  logo?: TalkLogo
  stitch?: boolean
  result_format?: 'mp4' | 'mov'
  fluent?: boolean
  pad_audio?: number
  driver_expressions?: unknown
}

export type CreateTalkBody = {
  source_url: string
  script: TalkScript
  config?: TalksConfig
}

const LOCAL_TRANSPARENT_PNG = '/transparent-1x1.png'
const LOGO_CACHE_KEY = 'did:invisibleLogoUrl'

type DidImageUploadResponse = {
  id?: string
  url?: string
}

/**
 * Upload `public/transparent-1x1.png` to D-ID's /images endpoint and return the
 * D-ID-hosted https URL. D-ID stores it 24–48h; we cache the URL in localStorage.
 */
async function getOrUploadInvisibleLogoUrl(): Promise<string | undefined> {
  if (typeof window === 'undefined') {
    return undefined
  }

  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  const fromEnv = env?.VITE_DID_LOGO_URL?.trim()
  if (fromEnv && /^(https|s3):\/\//.test(fromEnv)) {
    return fromEnv
  }

  if (window.location.origin.startsWith('https://')) {
    return `${window.location.origin}${LOCAL_TRANSPARENT_PNG}`
  }

  const cached = window.localStorage.getItem(LOGO_CACHE_KEY)
  if (cached && /^(https|s3):\/\//.test(cached)) {
    return cached
  }

  try {
    const pngResponse = await axios.get<Blob>(LOCAL_TRANSPARENT_PNG, {
      responseType: 'blob',
    })
    const form = new FormData()
    form.append('image', pngResponse.data, 'transparent-1x1.png')

    const uploadResponse = await axios.post<DidImageUploadResponse>(
      `${DID_BASE_URL}/images`,
      form,
      { auth: { username: getApiKey(), password: '' } },
    )

    const uploadedUrl = uploadResponse.data?.url
    if (uploadedUrl && /^(https|s3):\/\//.test(uploadedUrl)) {
      window.localStorage.setItem(LOGO_CACHE_KEY, uploadedUrl)
      return uploadedUrl
    }
  } catch (error) {
    console.warn('Failed to upload invisible logo to D-ID:', error)
  }

  return undefined
}

/**
 * D-ID composites a default "D-ID" logo unless `config.logo` is set (Talks API).
 * We override it with a 1×1 transparent PNG so nothing visible is drawn.
 */
async function withInvisibleLogoInsteadOfDefault(
  body: CreateTalkBody,
): Promise<CreateTalkBody> {
  if (body.config?.logo) {
    return body
  }

  const logoUrl = await getOrUploadInvisibleLogoUrl()
  if (!logoUrl) {
    return body
  }

  return {
    ...body,
    config: {
      ...body.config,
      logo: { url: logoUrl, position: [0, 0] },
    },
  }
}

export type TalkStatus = 'created' | 'started' | 'done' | 'error' | 'rejected'

export type Talk = {
  id: string
  status: TalkStatus
  result_url?: string
  error?: {
    kind?: string
    description?: string
  }
  [key: string]: unknown
}

function getApiKey(): string {
  const apiKey = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env?.VITE_DID_API_KEY

  if (!apiKey) {
    throw new Error('Missing API key: set VITE_DID_API_KEY in .env')
  }

  return apiKey
}

function authConfig() {
  return {
    auth: { username: getApiKey(), password: '' },
    headers: { 'Content-Type': 'application/json' },
  }
}

export async function createTalk(body: CreateTalkBody): Promise<Talk> {
  const finalBody = await withInvisibleLogoInsteadOfDefault(body)
  const response = await axios.post<Talk>(
    `${DID_BASE_URL}/talks`,
    finalBody,
    authConfig(),
  )
  return response.data
}

export async function getTalk(id: string): Promise<Talk> {
  const response = await axios.get<Talk>(
    `${DID_BASE_URL}/talks/${id}`,
    authConfig(),
  )
  return response.data
}

export type PollOptions = {
  intervalMs?: number
  timeoutMs?: number
  onUpdate?: (talk: Talk) => void
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function pollTalkUntilTerminal(
  id: string,
  options: PollOptions = {},
): Promise<Talk> {
  const intervalMs = options.intervalMs ?? 2000
  const timeoutMs = options.timeoutMs ?? 120000
  const startedAt = Date.now()

  while (true) {
    const talk = await getTalk(id)
    options.onUpdate?.(talk)

    if (talk.status === 'done') {
      return talk
    }

    if (talk.status === 'error' || talk.status === 'rejected') {
      const description = talk.error?.description ?? talk.status
      throw new Error(`D-ID talk ${talk.status}: ${description}`)
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('D-ID talk polling timed out')
    }

    await wait(intervalMs)
  }
}
