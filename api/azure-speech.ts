import type { VercelRequest, VercelResponse } from '@vercel/node'

/** 48 kHz — clearer speech MP3 (matches vite dev proxy + Vercel API). */
const OUTPUT_FORMAT = 'audio-48khz-192kbitrate-mono-mp3'

function getServerCredentials(): { key: string; region: string } | null {
  const key =
    process.env.VITE_AZURE_SPEECH_KEY?.trim() || process.env.AZURE_SPEECH_KEY?.trim()
  const region =
    process.env.VITE_AZURE_SPEECH_REGION?.trim() || process.env.AZURE_SPEECH_REGION?.trim()
  if (!key || !region || key === 'azure-speech-key') return null
  return { key, region }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const configured = Boolean(getServerCredentials())
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ configured })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const creds = getServerCredentials()
  if (!creds) {
    return res.status(500).json({ error: 'Azure Speech is not configured on the server.' })
  }

  const ssml = typeof req.body === 'string' ? req.body : ''
  if (!ssml.trim()) {
    return res.status(400).json({ error: 'Missing SSML body' })
  }

  const { key, region } = creds
  const azureRes = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
        'User-Agent': 'portfolio-about-tts',
      },
      body: ssml,
    },
  )

  if (!azureRes.ok) {
    const detail = (await azureRes.text().catch(() => '')).slice(0, 280)
    return res.status(azureRes.status).json({
      error: detail || `Azure Speech error ${azureRes.status}`,
    })
  }

  const audio = Buffer.from(await azureRes.arrayBuffer())
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(audio)
}
