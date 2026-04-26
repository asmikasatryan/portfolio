import { askGemini } from '../services/geminiApi'
import axios from 'axios'

async function run(): Promise<void> {
  try {
    const result = await askGemini()
    console.log('Gemini answer:\n')
    console.log(JSON.stringify(result, null, 2))
    console.log('\nGemini text:\n')
    console.log(result.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No text')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Gemini API error:', error.response?.status, error.response?.data)
      return
    }
    console.error('Gemini API error:', error)
  }
}

void run()
