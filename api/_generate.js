/* Shared AI generation — used by api/ai.js and api/auto-reply.js */

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

async function callDeepSeek(prompt) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

async function callGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text.trim()
}

export async function generate(prompt) {
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const result = await callDeepSeek(prompt)
      return { result, provider: 'deepseek' }
    } catch (err) {
      console.warn('DeepSeek failed, trying Gemini:', err.message)
    }
  }
  if (process.env.GEMINI_API_KEY) {
    const result = await callGemini(prompt)
    return { result, provider: 'gemini' }
  }
  throw new Error('No AI provider configured')
}

/* Always use Gemini — for product descriptions */
export async function generateGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')
  const result = await callGemini(prompt)
  return { result, provider: 'gemini' }
}

/* Always use DeepSeek — for chat replies. Falls back to Gemini if DeepSeek is down. */
export async function generateDeepSeek(prompt) {
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const result = await callDeepSeek(prompt)
      return { result, provider: 'deepseek' }
    } catch (err) {
      console.warn('DeepSeek failed, falling back to Gemini:', err.message)
    }
  }
  if (process.env.GEMINI_API_KEY) {
    const result = await callGemini(prompt)
    return { result, provider: 'gemini' }
  }
  throw new Error('No AI provider configured')
}

export function parseJson(text) {
  // Strip markdown code fences
  let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  // If AI prefixed text before the JSON, extract the first {...} block
  const jsonStart = clean.indexOf('{')
  const jsonEnd   = clean.lastIndexOf('}')
  if (jsonStart > 0 && jsonEnd > jsonStart) {
    clean = clean.slice(jsonStart, jsonEnd + 1)
  }

  return JSON.parse(clean)
}
