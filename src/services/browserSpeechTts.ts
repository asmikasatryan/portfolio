function assertSpeechSynthesis(): SpeechSynthesis {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('Text-to-speech is not supported in this browser.')
  }
  return window.speechSynthesis
}

/** Known female voice name fragments (browser/OS dependent). */
const FEMALE_VOICE_HINTS = [
  'female',
  'woman',
  'zira',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'kate',
  'serena',
  'susan',
  'hazel',
  'jenny',
  'aria',
  'emma',
  'libby',
  'sonia',
  'natasha',
  'nicole',
  'linda',
  'allison',
  'ava',
  'sara',
] as const

/** Known male voice name fragments — deprioritized when picking. */
const MALE_VOICE_HINTS = [
  ' male',
  'male ',
  'david',
  'mark',
  'james',
  'daniel',
  'alex',
  'fred',
  'tom',
  'george',
  'guy',
  'ryan',
  'brian',
] as const

function voiceLabel(voice: SpeechSynthesisVoice): string {
  return `${voice.name} ${voice.voiceURI}`.toLowerCase()
}

function isLikelyFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const label = voiceLabel(voice)
  if (/\bfemale\b/.test(label) || /\bwoman\b/.test(label)) return true
  return FEMALE_VOICE_HINTS.some((hint) => label.includes(hint))
}

function isLikelyMaleVoice(voice: SpeechSynthesisVoice): boolean {
  const label = voiceLabel(voice)
  if (/\bmale\b/.test(label) && !/\bfemale\b/.test(label)) return true
  return MALE_VOICE_HINTS.some((hint) => label.includes(hint))
}

function pickPreferredVoice(candidates: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    candidates.find((v) => v.localService && v.default) ??
    candidates.find((v) => v.localService) ??
    candidates.find((v) => v.default) ??
    candidates[0]
  )
}

/** Prefer English (US) female voices; fall back to any English, then system default. */
function pickEnglishFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  if (!en.length) return voices[0]

  const enUs = en.filter((v) => v.lang.toLowerCase().startsWith('en-us'))
  const scoped = enUs.length > 0 ? enUs : en

  const female = scoped.filter((v) => isLikelyFemaleVoice(v) && !isLikelyMaleVoice(v))
  if (female.length > 0) return pickPreferredVoice(female)

  const notMale = scoped.filter((v) => !isLikelyMaleVoice(v))
  if (notMale.length > 0) return pickPreferredVoice(notMale)

  return pickPreferredVoice(scoped) ?? pickPreferredVoice(en) ?? voices[0]
}

function loadVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const existing = synth.getVoices()
  if (existing.length > 0) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let settled = false
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return
      settled = true
      synth.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(voices)
    }

    const onVoicesChanged = () => {
      const voices = synth.getVoices()
      if (voices.length > 0) finish(voices)
    }

    synth.addEventListener('voiceschanged', onVoicesChanged)
    window.setTimeout(() => finish(synth.getVoices()), 300)
  })
}

export type SpeakBrowserOptions = {
  signal?: AbortSignal
  onStart?: () => void
}

/** Speak plain text with the browser Web Speech API (no API key). */
export function speakBrowserText(
  plainText: string,
  options?: SpeakBrowserOptions,
): Promise<void> {
  const trimmed = plainText.trim()
  if (!trimmed) return Promise.resolve()

  const synth = assertSpeechSynthesis()
  const { signal, onStart } = options ?? {}

  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'))
  }

  return loadVoices(synth).then(
    (voices) =>
      new Promise((resolve, reject) => {
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }

        synth.cancel()

        const utterance = new SpeechSynthesisUtterance(trimmed)
        const voice = pickEnglishFemaleVoice(voices)
        if (voice) {
          utterance.voice = voice
          utterance.lang = voice.lang
        } else {
          utterance.lang = 'en-US'
        }

        const cleanup = () => {
          signal?.removeEventListener('abort', onAbort)
          utterance.onstart = null
          utterance.onend = null
          utterance.onerror = null
        }

        const onAbort = () => {
          synth.cancel()
          cleanup()
          reject(new DOMException('Aborted', 'AbortError'))
        }

        utterance.onstart = () => onStart?.()
        utterance.onend = () => {
          cleanup()
          resolve()
        }
        utterance.onerror = () => {
          cleanup()
          reject(new Error('Speech failed in this browser.'))
        }

        signal?.addEventListener('abort', onAbort, { once: true })
        synth.speak(utterance)
      }),
  )
}

export function stopBrowserSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
