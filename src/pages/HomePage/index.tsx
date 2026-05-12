import { useState } from 'react'
import axios from 'axios'
import { Button, Form, Input, Typography } from 'antd'
import ReactMarkdown from 'react-markdown'
import { AboutMe } from '../../components/AboutMe'
import { Experience } from '../../components/Experience'
import { FeaturedProjects } from '../../components/FeaturedProjects'
import { Hero } from '../../components/Hero'
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

export function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [sourceUrl, setSourceUrl] = useState(DEFAULT_SOURCE_URL)
  const [script, setScript] = useState('Hello! Welcome to my portfolio.')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoStatus, setVideoStatus] = useState('')
  const [videoError, setVideoError] = useState('')
  const [isVideoLoading, setIsVideoLoading] = useState(false)

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
    setVideoUrl('')
    setVideoStatus('Sending request...')

    try {
      const created = await createTalk({
        source_url: sourceUrl.trim(),
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

      setVideoUrl(finished.result_url)
      setVideoStatus('Done.')
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
              Powered by D-ID. Provide a public portrait image URL and a short
              script.
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
            <div className={styles.answerBox}>
              {videoUrl ? (
                <video
                  className={styles.videoPlayer}
                  src={videoUrl}
                  controls
                  autoPlay
                />
              ) : videoError ? (
                <Text type="danger">{videoError}</Text>
              ) : videoStatus ? (
                <Text type="secondary">{videoStatus}</Text>
              ) : (
                'Generated video will appear here.'
              )}
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
      <SiteFooter />
    </div>
  )
}
