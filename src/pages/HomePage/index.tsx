import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { DatabaseOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { Button, Form, Input, Typography } from 'antd'
import ReactMarkdown from 'react-markdown'
import { AboutMe } from '../../components/AboutMe'
import { Experience } from '../../components/Experience'
import { FeaturedProjects } from '../../components/FeaturedProjects'
import { Hero } from '../../components/Hero'
import { HEADER_AVATAR_SRC } from '../../components/SiteHeader/consts'
import { SiteFooter } from '../../components/SiteFooter'
import { TechnicalSkills } from '../../components/TechnicalSkills'
import {
  getPortfolioAvatarSourceUrl,
  getPublicSiteOrigin,
  isLocalDevOrigin,
  isLocalhostSourceUrl,
  validateDidSourceUrl,
} from '../../lib/portfolioAssets'
import {
  createClipId,
  createPortfolioIntroClip,
  formatClipDate,
  type SavedClip,
} from '../../lib/savedClips'
import {
  addSharedClip,
  clearLegacyLocalClips,
  fetchSharedClips,
  readLegacyLocalClips,
} from '../../services/clipsApi'
import { askGemini } from '../../services/geminiApi'
import {
  buildMicrosoftTalkScript,
  createTalk,
  DID_MICROSOFT_VOICE_ID,
  pollTalkUntilTerminal,
  type Talk,
} from '../../services/didApi'
import styles from './styles.module.css'

const { Title, Paragraph, Text } = Typography

const DEFAULT_SCRIPT = 'Welcome to my AI video generation demo.'

const STORAGE_SECTION_ID = 'video-storage'
const CLIPS_SECTION_TITLE = 'Video Storage'
const CLIPS_SECTION_SUBTITLE = 'Creative Clips with AI'

type ClipCardProps = {
  clip: SavedClip
  videoNumber: number
}

function ClipCard({ clip, videoNumber }: ClipCardProps) {
  const [playing, setPlaying] = useState(clip.builtIn === true)

  return (
    <article className={styles.clipCard}>
      <div className={styles.clipCardPlayer}>
        {playing || clip.builtIn ? (
          <video
            className={styles.videoPlayer}
            src={clip.videoUrl}
            poster={clip.posterUrl || HEADER_AVATAR_SRC}
            controls
            playsInline
            preload="metadata"
            autoPlay={playing && !clip.builtIn}
          />
        ) : (
          <button
            type="button"
            className={styles.posterTrigger}
            onClick={() => {
              setPlaying(true)
            }}
            aria-label={`Play Video ${videoNumber}`}
          >
            <img
              className={styles.posterImg}
              src={clip.posterUrl || HEADER_AVATAR_SRC}
              alt=""
            />
            <span className={styles.playOverlay} aria-hidden>
              <PlayCircleOutlined />
            </span>
          </button>
        )}
      </div>
      <p className={styles.clipLabel}>Video {videoNumber}</p>
      <div className={styles.clipCardMeta}>
        {clip.scriptUsed ? (
          <p className={styles.clipScript}>{clip.scriptUsed}</p>
        ) : null}
        <Text type="secondary" className={styles.clipDate}>
          {formatClipDate(clip)}
        </Text>
      </div>
    </article>
  )
}

export function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [sourceUrl, setSourceUrl] = useState(() => getPortfolioAvatarSourceUrl())
  const [script, setScript] = useState(DEFAULT_SCRIPT)

  useEffect(() => {
    if (isLocalDevOrigin()) {
      setSourceUrl((current) =>
        isLocalhostSourceUrl(current) ? getPortfolioAvatarSourceUrl() : current,
      )
    }
  }, [])
  const [savedClips, setSavedClips] = useState<SavedClip[]>([createPortfolioIntroClip()])
  const [clipsLoading, setClipsLoading] = useState(true)
  const [videoStatus, setVideoStatus] = useState('')
  const [videoError, setVideoError] = useState('')
  const [isVideoLoading, setIsVideoLoading] = useState(false)

  const loadClips = useCallback(async (signal?: AbortSignal) => {
    setClipsLoading(true)
    try {
      let clips = await fetchSharedClips(signal)

      const legacy = readLegacyLocalClips()
      if (legacy.length > 0) {
        for (const clip of legacy) {
          try {
            clips = await addSharedClip(clip)
          } catch {
            /* continue migrating others */
          }
        }
        clearLegacyLocalClips()
      }

      if (!signal?.aborted) {
        setSavedClips(clips)
      }
    } catch {
      if (!signal?.aborted) {
        setSavedClips([createPortfolioIntroClip()])
      }
    } finally {
      if (!signal?.aborted) {
        setClipsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    void loadClips(ac.signal)
    return () => ac.abort()
  }, [loadClips])

  const aiClipCount = savedClips.filter((clip) => !clip.builtIn).length

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
    const sourceValidation = validateDidSourceUrl(sourceUrl)
    if (sourceValidation) {
      setVideoError(sourceValidation)
      return
    }
    if (script.trim().length < 3) {
      setVideoError('Script must be at least 3 characters long.')
      return
    }

    setIsVideoLoading(true)
    setVideoError('')
    setVideoStatus('Sending request...')

    const posterForThisRun = sourceUrl.trim()
    const scriptUsed = script.trim()

    try {
      const created = await createTalk({
        source_url: posterForThisRun,
        script: buildMicrosoftTalkScript(script),
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

      const newClip: SavedClip = {
        id: createClipId(),
        videoUrl: finished.result_url,
        posterUrl: posterForThisRun,
        scriptUsed,
        createdAt: Date.now(),
        builtIn: false,
      }

      const clips = await addSharedClip(newClip)
      setSavedClips(clips)
      setVideoStatus(`Done. Saved to ${CLIPS_SECTION_TITLE} — visible to all visitors.`)
      document.getElementById(STORAGE_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
              Powered by D-ID (<code>VITE_DID_API_KEY</code>). Voice: Microsoft{' '}
              <strong>Ava</strong> multilingual (<code>{DID_MICROSOFT_VOICE_ID}</code>).
              Source image defaults to your <strong>portfolio avatar</strong>. New clips
              are saved in <strong>{CLIPS_SECTION_TITLE}</strong> below.
            </Paragraph>
            {isLocalDevOrigin() ? (
              <Paragraph type="secondary" className={styles.sourceHint}>
                On <code>localhost</code>, D-ID needs a <strong>public</strong> image URL.
                Default below uses your live site:{' '}
                <code className={styles.sourceHintCode}>{getPublicSiteOrigin()}</code>
              </Paragraph>
            ) : null}
            <Form layout="vertical" onFinish={handleGenerateVideo}>
              <Form.Item label="Source Image URL (portfolio avatar)">
                <div className={styles.sourceRow}>
                  <img
                    className={styles.sourcePreview}
                    src={HEADER_AVATAR_SRC}
                    alt="Portfolio avatar preview"
                  />
                  <Input
                    value={sourceUrl}
                    onChange={(event) => {
                      setSourceUrl(event.target.value)
                    }}
                    placeholder={getPortfolioAvatarSourceUrl()}
                  />
                </div>
              </Form.Item>
              <Form.Item>
                <Button
                  type="default"
                  htmlType="button"
                  onClick={() => {
                    setSourceUrl(getPortfolioAvatarSourceUrl())
                  }}
                >
                  Use portfolio avatar URL
                </Button>
              </Form.Item>
              <Form.Item label="Script (text to speak)">
                <Input.TextArea
                  value={script}
                  onChange={(event) => {
                    setScript(event.target.value)
                  }}
                  rows={4}
                  placeholder={DEFAULT_SCRIPT}
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
        id={STORAGE_SECTION_ID}
        className={styles.videoShowcase}
        aria-labelledby="video-storage-heading"
      >
        <div className={styles.videoShowcaseInner}>
          <p className={styles.storageEyebrow}>{CLIPS_SECTION_SUBTITLE}</p>
          <h2 id="video-storage-heading" className={styles.videoShowcaseTitle}>
            {CLIPS_SECTION_TITLE}
          </h2>
          <p className={styles.showcaseHint}>
            Shared visible storage — every saved video stays on display for all visitors.
          </p>

          <div className={styles.storagePanel} aria-label="Visible video storage">
            <div className={styles.storageHeader}>
              <span className={styles.storageIcon} aria-hidden>
                <DatabaseOutlined />
              </span>
              <div className={styles.storageHeaderText}>
                <Text strong className={styles.storageHeaderTitle}>
                  Visible storage
                </Text>
                <Text type="secondary" className={styles.storageHeaderMeta}>
                  {clipsLoading
                    ? 'Loading saved videos…'
                    : `${savedClips.length} video${savedClips.length === 1 ? '' : 's'} stored · public gallery`}
                </Text>
              </div>
              {!clipsLoading ? (
                <span className={styles.storageBadge}>
                  {savedClips.length} saved
                </span>
              ) : null}
            </div>

            {clipsLoading ? (
              <p className={styles.clipsEmpty}>Loading clips…</p>
            ) : (
              <ul className={styles.clipsGrid} aria-label="Stored video clips">
                {savedClips.map((clip, index) => (
                  <li key={clip.id}>
                    <ClipCard clip={clip} videoNumber={index + 1} />
                  </li>
                ))}
              </ul>
            )}

            {!clipsLoading && aiClipCount === 0 ? (
              <p className={styles.clipsEmpty}>
                Generate a video above — it will be stored here as Video 2 for everyone.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
