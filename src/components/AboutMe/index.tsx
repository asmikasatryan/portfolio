import { Button, message } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { speakBrowserText, stopBrowserSpeech } from '../../services/browserSpeechTts'
import {
  ABOUT_PARAGRAPHS,
  ABOUT_STATS,
  getAboutSpeechScript,
  SECTION_TITLE,
} from './consts'
import styles from './styles.module.css'

type TtsPhase = 'idle' | 'loading' | 'playing'

export function AboutMe() {
  const [ttsPhase, setTtsPhase] = useState<TtsPhase>('idle')
  const abortRef = useRef<AbortController | null>(null)
  /** Prevents overlapping "Listen" runs before React state catches up to `loading`. */
  const listenInFlightRef = useRef(false)

  const stopPlayback = useCallback(() => {
    listenInFlightRef.current = false
    abortRef.current?.abort()
    abortRef.current = null
    stopBrowserSpeech()
    setTtsPhase('idle')
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      stopBrowserSpeech()
    }
  }, [])

  const handleListenToggle = useCallback(async () => {
    if (ttsPhase === 'playing' || ttsPhase === 'loading') {
      stopPlayback()
      return
    }

    if (listenInFlightRef.current) {
      return
    }
    listenInFlightRef.current = true

    const script = getAboutSpeechScript()
    const ac = new AbortController()
    abortRef.current = ac
    setTtsPhase('loading')

    try {
      await speakBrowserText(script, {
        signal: ac.signal,
        onStart: () => setTtsPhase('playing'),
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
  }, [stopPlayback, ttsPhase])

  const listenLabel =
    ttsPhase === 'loading' ? 'Preparing…' : ttsPhase === 'playing' ? 'Stop' : 'Listen'

  return (
    <section
      id="about"
      className={styles.section}
      aria-labelledby="about-heading"
    >
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
