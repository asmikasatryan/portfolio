import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { PlayCircleOutlined } from '@ant-design/icons'
import { Button, Form, Input, Typography } from 'antd'
import ReactMarkdown from 'react-markdown'
import { AboutMe } from '../../components/AboutMe'
import { Experience } from '../../components/Experience'
import { FeaturedProjects } from '../../components/FeaturedProjects'
import { Hero } from '../../components/Hero'
import { HEADER_AVATAR_SRC } from '../../components/SiteHeader/consts'
import { SiteFooter } from '../../components/SiteFooter'
import { TechnicalSkills } from '../../components/TechnicalSkills'
import { askGemini } from '../../services/geminiApi'
import {
  createTalk,
  pollTalkUntilTerminal,
  type Talk,
} from '../../services/didApi'
import styles from './styles.module.css'

const { Title, Paragraph, Text } = Typography

const DEFAULT_SOURCE_URL =
  'https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg'

/** Local fallback video shipped in public/, used when no generated clip exists. */
const FALLBACK_VIDEO_SRC = '/1778610328275.mp4'

const GENERATED_VIDEO_STORAGE_KEY = 'home:generatedVideo'

type GeneratedVideoSaved = {
  videoUrl: string
  posterUrl: string
  scriptUsed?: string
  createdAt: number
}

function readSavedGeneratedVideo(): GeneratedVideoSaved | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(GENERATED_VIDEO_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<GeneratedVideoSaved>
    if (parsed && typeof parsed.videoUrl === 'string' && parsed.videoUrl) {
      return {
        videoUrl: parsed.videoUrl,
        posterUrl:
          typeof parsed.posterUrl === 'string' ? parsed.posterUrl : '',
        scriptUsed:
          typeof parsed.scriptUsed === 'string' ? parsed.scriptUsed : undefined,
        createdAt:
          typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

function persistGeneratedVideo(payload: GeneratedVideoSaved | null): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    if (payload === null) {
      window.localStorage.removeItem(GENERATED_VIDEO_STORAGE_KEY)
    } else {
      window.localStorage.setItem(
        GENERATED_VIDEO_STORAGE_KEY,
        JSON.stringify(payload),
      )
    }
  } catch {
    /* ignore quota / storage errors */
  }
}

export function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [sourceUrl, setSourceUrl] = useState(DEFAULT_SOURCE_URL)
  const [script, setScript] = useState('Hello! Welcome to my portfolio.')
  const initialSaved = readSavedGeneratedVideo()
  const [outputVideoUrl, setOutputVideoUrl] = useState(
    initialSaved?.videoUrl ?? '',
  )
  const [outputPosterUrl, setOutputPosterUrl] = useState(
    initialSaved?.posterUrl ?? '',
  )
  const [videoPlayerActive, setVideoPlayerActive] = useState(false)
  const [videoStatus, setVideoStatus] = useState('')
  const [videoError, setVideoError] = useState('')
  const [isVideoLoading, setIsVideoLoading] = useState(false)

  const outputVideoRef = useRef<HTMLVideoElement>(null)
  const showcaseRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (videoPlayerActive && outputVideoRef.current) {
      void outputVideoRef.current.play().catch(() => {
        /* user gesture may be required on some browsers */
      })
    }
  }, [videoPlayerActive])

  const handleClear = () => {
    setPrompt('')
    setAnswer('')
  }

  const handleAskGemini = async () => {
    if (!prompt.trim()) {
      setAnswer('Please write a prompt first.')
      return
    }

    setIsLoading(true)
    setAnswer('')

    try {
      const data = await askGemini(prompt)
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      setAnswer(text ?? 'Gemini returned an empty response.')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = (
          error.response?.data as { error?: { message?: string } } | undefined
        )?.error?.message
        setAnswer(
          `Gemini error${status ? ` (${status})` : ''}: ${
            message ?? 'Please try again in a moment.'
          }`,
        )
      } else {
        const message = error instanceof Error ? error.message : 'Please try again in a moment.'
        setAnswer(`Gemini error: ${message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (!sourceUrl.trim()) {
      setVideoError('Please provide a public source image URL.')
      return
    }
    if (script.trim().length < 3) {
      setVideoError('Script must be at least 3 characters long.')
      return
    }

    setIsVideoLoading(true)
    setVideoError('')
    setOutputVideoUrl('')
    setOutputPosterUrl('')
    setVideoPlayerActive(false)
    setVideoStatus('Sending request...')

    const posterForThisRun = sourceUrl.trim()

    try {
      const created = await createTalk({
        source_url: posterForThisRun,
        script: { type: 'text', input: script.trim() },
      })
      setVideoStatus(`Job ${created.id} ${created.status}. Polling...`)

      const finished = await pollTalkUntilTerminal(created.id, {
        intervalMs: 2000,
        timeoutMs: 120000,
        onUpdate: (talk: Talk) => {
          setVideoStatus(`Status: ${talk.status}`)
        },
      })

      if (!finished.result_url) {
        setVideoError('D-ID finished but did not return a result_url.')
        setVideoStatus('')
        return
      }

      setOutputVideoUrl(finished.result_url)
      setOutputPosterUrl(posterForThisRun)
      setVideoPlayerActive(false)
      setVideoStatus('Done. Scroll down to preview and play your clip.')
      persistGeneratedVideo({
        videoUrl: finished.result_url,
        posterUrl: posterForThisRun,
        scriptUsed: script.trim(),
        createdAt: Date.now(),
      })
      showcaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) {
      setVideoStatus('')
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data = error.response?.data as
          | {
              description?: string
              message?: string
              kind?: string
              details?: unknown
            }
          | undefined
        const detailText = data?.details
          ? ` — ${JSON.stringify(data.details)}`
          : ''
        const baseMessage =
          data?.description ?? data?.message ?? data?.kind ?? 'Please try again in a moment.'
        setVideoError(
          `D-ID error${status ? ` (${status})` : ''}: ${baseMessage}${detailText}`,
        )
        console.error('D-ID error response:', error.response?.data)
      } else {
        const message =
          error instanceof Error ? error.message : 'Please try again in a moment.'
        setVideoError(`D-ID error: ${message}`)
      }
    } finally {
      setIsVideoLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <Hero />
      <FeaturedProjects />
      <TechnicalSkills />
      <Experience />
      <AboutMe />
      <section id="gemini" className={styles.geminiSection}>
        <div className={styles.geminiGrid}>
          <div id="video" className={styles.geminiCard}>
            <Title level={3}>Generate Video</Title>
            <Paragraph type="secondary" className={styles.geminiIntro}>
              Powered by D-ID (POST /talks, then GET until done). The clip appears
              below the avatar — tap the poster to play.
            </Paragraph>
            <Form layout="vertical" onFinish={handleGenerateVideo}>
              <Form.Item label="Source Image URL">
                <Input
                  value={sourceUrl}
                  onChange={(event) => {
                    setSourceUrl(event.target.value)
                  }}
                  placeholder="https://.../portrait.jpg"
                />
              </Form.Item>
              <Form.Item label="Script (text to speak)">
                <Input.TextArea
                  value={script}
                  onChange={(event) => {
                    setScript(event.target.value)
                  }}
                  rows={4}
                  placeholder="Hello! Welcome to my portfolio."
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isVideoLoading}
                >
                  Generate Video
                </Button>
              </Form.Item>
            </Form>
            <div className={styles.videoGenStatusBox}>
              {videoError ? (
                <Text type="danger" className={styles.videoMessage}>
                  {videoError}
                </Text>
              ) : null}
              {videoStatus ? (
                <Text type="secondary" className={styles.videoMessage}>
                  {videoStatus}
                </Text>
              ) : null}
              {!videoError && !videoStatus ? (
                <Text type="secondary">
                  Status messages from D-ID will appear here while generating.
                </Text>
              ) : null}
            </div>
          </div>
          <div className={styles.geminiCard}>
            <Title level={3}>Ask Gemini</Title>
            <Paragraph type="secondary" className={styles.geminiIntro}>
              Type your question and get the answer below.
            </Paragraph>
            <Form layout="vertical" onFinish={handleAskGemini}>
              <Form.Item label="Your Prompt">
                <Input.TextArea
                  value={prompt}
                  onChange={(event) => {
                    setPrompt(event.target.value)
                  }}
                  rows={5}
                  placeholder="Write your prompt here..."
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  Send to Gemini
                </Button>
                <Button
                  type="default"
                  onClick={handleClear}
                  disabled={!prompt && !answer}
                  className={styles.clearButton}
                >
                  Clear
                </Button>
              </Form.Item>
            </Form>
            <div className={styles.answerBox}>
              {answer ? (
                <div className={styles.markdownContent}>
                  <ReactMarkdown>{answer}</ReactMarkdown>
                </div>
              ) : (
                'Gemini answer will appear here.'
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        ref={showcaseRef}
        id="generated-video"
        className={styles.videoShowcase}
        aria-labelledby="generated-video-heading"
      >
        <div className={styles.videoShowcaseInner}>
          <h2 id="generated-video-heading" className={styles.videoShowcaseTitle}>
            Your clip
          </h2>
          <div className={styles.showcasePlayerWrap}>
            {outputVideoUrl ? (
              videoPlayerActive ? (
                <video
                  ref={outputVideoRef}
                  className={styles.videoPlayer}
                  src={outputVideoUrl}
                  controls
                  playsInline
                />
              ) : (
                <button
                  type="button"
                  className={styles.posterTrigger}
                  onClick={() => {
                    setVideoPlayerActive(true)
                  }}
                  aria-label="Play generated video"
                >
                  <img
                    className={styles.posterImg}
                    src={outputPosterUrl || HEADER_AVATAR_SRC}
                    alt=""
                  />
                  <span className={styles.playOverlay} aria-hidden>
                    <PlayCircleOutlined />
                  </span>
                </button>
              )
            ) : (
              <video
                className={styles.videoPlayer}
                src={FALLBACK_VIDEO_SRC}
                poster={HEADER_AVATAR_SRC}
                controls
                playsInline
                preload="metadata"
              />
            )}
            {outputVideoUrl ? (
              <div className={styles.showcaseControls}>
                <Button
                  size="small"
                  type="text"
                  onClick={() => {
                    setOutputVideoUrl('')
                    setOutputPosterUrl('')
                    setVideoPlayerActive(false)
                    persistGeneratedVideo(null)
                  }}
                >
                  Clear saved clip
                </Button>
              </div>
            ) : (
              <p className={styles.showcaseHint}>
                Playing the bundled sample clip. Generate a video above to
                replace it.
              </p>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
