import { Button, message, Typography } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isAzureSpeechConfigured,
  probeAzureSpeechConfigured,
  synthesizeAzureSpeechMp3,
} from '../../services/azureSpeechTts'
import { speakBrowserText, stopBrowserSpeech } from '../../services/browserSpeechTts'
import {
  ABOUT_PARAGRAPHS,
  ABOUT_STATS,
  getAboutSpeechParagraphs,
  getAboutSpeechScript,
  SECTION_TITLE,
} from './consts'
import styles from './styles.module.css'

const { Text } = Typography

type TtsPhase = 'idle' | 'loading' | 'playing'
type ListenEngine = 'azure' | 'browser' | null

export function AboutMe() {
  const clientAzureOk = isAzureSpeechConfigured()
  const [serverAzureOk, setServerAzureOk] = useState<boolean | null>(null)
  const azureAvailable = clientAzureOk || serverAzureOk === true

  useEffect(() => {
    const ac = new AbortController()
    void probeAzureSpeechConfigured(ac.signal).then((ok) => {
      if (!ac.signal.aborted) setServerAzureOk(ok)
    })
    return () => ac.abort()
  }, [])

  const [ttsPhase, setTtsPhase] = useState<TtsPhase>('idle')
  const [lastEngine, setLastEngine] = useState<ListenEngine>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const listenInFlightRef = useRef(false)

  const revokeAudioUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const stopPlayback = useCallback(() => {
    listenInFlightRef.current = false
    abortRef.current?.abort()
    abortRef.current = null
    stopBrowserSpeech()
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      audio.removeAttribute('src')
      audio.load()
    }
    revokeAudioUrl()
    setTtsPhase('idle')
  }, [revokeAudioUrl])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      stopBrowserSpeech()
      const audio = audioRef.current
      if (audio) {
        audio.pause()
      }
      revokeAudioUrl()
    }
  }, [revokeAudioUrl])

  const playAzureMp3 = useCallback(
    async (signal: AbortSignal) => {
      const mp3 = await synthesizeAzureSpeechMp3(getAboutSpeechParagraphs(), signal)
      if (signal.aborted) return

      revokeAudioUrl()
      const blob = new Blob([mp3], { type: 'audio/mpeg' })
      const objectUrl = URL.createObjectURL(blob)
      objectUrlRef.current = objectUrl

      const audio = audioRef.current
      if (!audio) {
        setTtsPhase('idle')
        return
      }

      audio.src = objectUrl
      audio.playbackRate = 1
      audio.onended = () => {
        setTtsPhase('idle')
        revokeAudioUrl()
      }
      audio.onerror = () => {
        message.error('Could not play audio in this browser.')
        stopPlayback()
      }

      await audio.play()
      setLastEngine('azure')
      setTtsPhase('playing')
    },
    [revokeAudioUrl, stopPlayback],
  )

  const handleListenToggle = useCallback(async () => {
    if (ttsPhase === 'playing' || ttsPhase === 'loading') {
      stopPlayback()
      return
    }

    if (listenInFlightRef.current) {
      return
    }
    listenInFlightRef.current = true

    const ac = new AbortController()
    abortRef.current = ac
    setTtsPhase('loading')

    try {
      if (azureAvailable) {
        try {
          await playAzureMp3(ac.signal)
          return
        } catch (azureErr) {
          if ((azureErr as Error).name === 'AbortError') return
        }
      }

      await speakBrowserText(getAboutSpeechScript(), {
        signal: ac.signal,
        onStart: () => {
          setLastEngine('browser')
          setTtsPhase('playing')
        },
      })
      if (!ac.signal.aborted) {
        setTtsPhase('idle')
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const text = err instanceof Error ? err.message : 'Speech failed.'
      message.error(text)
      setTtsPhase('idle')
    } finally {
      listenInFlightRef.current = false
      if (abortRef.current === ac) {
        abortRef.current = null
      }
    }
  }, [azureAvailable, playAzureMp3, stopPlayback, ttsPhase])

  const listenLabel =
    ttsPhase === 'loading' ? 'Preparing…' : ttsPhase === 'playing' ? 'Stop' : 'Listen'

  const voiceHint =
    lastEngine === 'azure' ? (
      <>
        Last played: <strong>Microsoft Azure</strong> — <strong>Ava</strong> multilingual.
      </>
    ) : lastEngine === 'browser' ? (
      <>
        Last played: <strong>browser voice</strong> (Windows/Chrome). Azure is tried first when
        configured.
      </>
    ) : azureAvailable ? (
      <>
        Tries <strong>Azure Ava</strong> first; falls back to <strong>browser voice</strong> if
        Azure fails.
      </>
    ) : (
      <>
        Uses <strong>browser voice</strong>. Add{' '}
        <code className={styles.envCode}>VITE_AZURE_SPEECH_KEY</code> for Azure Ava.
      </>
    )

  return (
    <section
      id="about"
      className={styles.section}
      aria-labelledby="about-heading"
    >
      <audio ref={audioRef} className={styles.hiddenAudio} preload="none" />
      <div className={styles.layout}>
        <div className={styles.portraitFrame}>
          <img
            className={styles.portrait}
            src="/1149de5674f43bdd39aae15d3c8370ed36dfd05e37cd8975c60bd0a3c63e903f.png"
            alt="Portrait of the maker"
          />
        </div>
        <div className={styles.copy}>
          <div className={styles.headingRow}>
            <h2 id="about-heading" className={styles.heading}>
              {SECTION_TITLE}
            </h2>
            <div className={styles.listenBlock}>
              <Button
                type="default"
                className={styles.ttsButton}
                loading={ttsPhase === 'loading'}
                onClick={handleListenToggle}
                aria-pressed={ttsPhase === 'playing' || ttsPhase === 'loading'}
              >
                {listenLabel}
              </Button>
              <Text type="secondary" className={styles.voiceHint}>
                {voiceHint}
              </Text>
            </div>
          </div>
          {ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph} className={styles.body}>
              {paragraph}
            </p>
          ))}
          <ul className={styles.stats} aria-label="Maker achievements">
            {ABOUT_STATS.map((stat) => (
              <li key={stat.label} className={styles.statItem}>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
