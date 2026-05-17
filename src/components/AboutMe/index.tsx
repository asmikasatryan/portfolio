import { Button, message } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isAzureSpeechConfigured,
  probeAzureSpeechConfigured,
  synthesizeAzureSpeechMp3,
} from '../../services/azureSpeechTts'
import { speakBrowserText, stopBrowserSpeech } from '../../services/browserSpeechTts'
import { HEADER_AVATAR_SRC } from '../SiteHeader/consts'
import {
  ABOUT_PARAGRAPHS,
  ABOUT_STATS,
  getAboutSpeechParagraphs,
  getAboutSpeechScript,
  SECTION_TITLE,
} from './consts'
import styles from './styles.module.css'

type TtsPhase = 'idle' | 'loading' | 'playing'

function renderAboutParagraph(paragraph: string, paragraphIndex: number) {
  if (paragraphIndex !== 0) {
    return paragraph
  }
  const commaIndex = paragraph.indexOf(',')
  if (commaIndex === -1) {
    return paragraph
  }
  return (
    <>
      <strong>{paragraph.slice(0, commaIndex + 1)}</strong>
      {paragraph.slice(commaIndex + 1)}
    </>
  )
}

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
            src={HEADER_AVATAR_SRC}
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
            </div>
          </div>
          {ABOUT_PARAGRAPHS.map((paragraph, index) => (
            <p key={paragraph} className={styles.body}>
              {renderAboutParagraph(paragraph, index)}
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
