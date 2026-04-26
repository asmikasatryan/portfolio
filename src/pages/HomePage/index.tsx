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
import styles from './styles.module.css'

const { Title, Paragraph } = Typography

export function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className={styles.root}>
      <Hero />
      <FeaturedProjects />
      <TechnicalSkills />
      <Experience />
      <AboutMe />
      <section id="gemini" className={styles.geminiSection}>
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
      </section>
      <SiteFooter />
    </div>
  )
}
