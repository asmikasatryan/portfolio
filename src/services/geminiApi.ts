import axios from 'axios'

type GeminiPart = {
  text: string
}

type GeminiCandidate = {
  content: {
    parts: GeminiPart[]
  }
}

export type GeminiResponse = {
  candidates: GeminiCandidate[]
}

const DEFAULT_PROMPT = `Գրի CV-ի կարճ summary junior frontend developer-ի համար։
Սովորել է HTML, CSS, JavaScript, Node.js, React basic, Python basic։
Ունի Cordova-ով պատրաստված mobile հավելված Google Play-ում։`

const MODEL_CANDIDATES = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
]
const MAX_ATTEMPTS = 6

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function askGemini(prompt: string = DEFAULT_PROMPT): Promise<GeminiResponse> {
  const apiKey =
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      ?.VITE_GEMINI_API_KEY ??
    (
      globalThis as {
        process?: { env?: Record<string, string | undefined> }
      }
    ).process?.env?.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Missing API key: set VITE_GEMINI_API_KEY or GEMINI_API_KEY')
  }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const model = MODEL_CANDIDATES[attempt % MODEL_CANDIDATES.length]

    try {
      const response = await axios.post<GeminiResponse>(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      return response.data
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error
      }

      const status = error.response?.status
      const apiStatus = (error.response?.data as { error?: { status?: string } } | undefined)
        ?.error?.status
      const shouldRetry = status === 429 || status === 503 || apiStatus === 'UNAVAILABLE'

      if (!shouldRetry || attempt === MAX_ATTEMPTS - 1) {
        console.error('Gemini API error:', status, error.response?.data)
        throw error
      }

      await wait(1500 * (attempt + 1))
    }
  }

  throw new Error('Failed to get Gemini response')
}
