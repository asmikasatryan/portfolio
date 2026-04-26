import { askGemini } from '../services/geminiApi'

async function run(): Promise<void> {
  try {
    // askGemini()-ն վերադարձնում է ամբողջ JSON response-ը
    const data = await askGemini()

    // Եթե ուզում ես ամբողջ JSON-ը տեսնել PowerShell-ում
    console.log(JSON.stringify(data, null, 2))

    // Եթե պետք է միայն հիմնական տեքստը
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) {
      console.log('\n--- Gemini text ---\n')
      console.log(text)
    }
  } catch (error) {
    console.error('Run error:', error)
    throw error
  }
}

void run()
