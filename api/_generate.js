/* Shared AI generation — used by api/ai.js, api/auto-reply.js, api/auto-describe.js
   DeepSeek  → chat/auto-reply
   Fireworks → product descriptions (replaces Gemini)
   Gemini    → fallback if others fail
*/

const DEEPSEEK_URL  = 'https://api.deepseek.com/chat/completions'
const FIREWORKS_URL = 'https://api.fireworks.ai/inference/v1/chat/completions'
const GEMINI_URL    = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

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

async function callFireworks(prompt) {
  const res = await fetch(FIREWORKS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'accounts/fireworks/models/llama4-scout-instruct-basic',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Fireworks error: ${res.status} ${err.slice(0, 100)}`)
  }
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

/* Default: DeepSeek → Fireworks → Gemini fallback chain */
export async function generate(prompt) {
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const result = await callDeepSeek(prompt)
      return { result, provider: 'deepseek' }
    } catch (err) {
      console.warn('DeepSeek failed:', err.message)
    }
  }
  if (process.env.FIREWORKS_API_KEY) {
    try {
      const result = await callFireworks(prompt)
      return { result, provider: 'fireworks' }
    } catch (err) {
      console.warn('Fireworks failed:', err.message)
    }
  }
  if (process.env.GEMINI_API_KEY) {
    const result = await callGemini(prompt)
    return { result, provider: 'gemini' }
  }
  throw new Error('No AI provider configured')
}

/* Product descriptions — Fireworks, fallback to DeepSeek then Gemini */
export async function generateForDescriptions(prompt) {
  if (process.env.FIREWORKS_API_KEY) {
    try {
      const result = await callFireworks(prompt)
      return { result, provider: 'fireworks' }
    } catch (err) {
      console.warn('Fireworks failed, trying fallback:', err.message)
    }
  }
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const result = await callDeepSeek(prompt)
      return { result, provider: 'deepseek' }
    } catch (err) {
      console.warn('DeepSeek failed:', err.message)
    }
  }
  if (process.env.GEMINI_API_KEY) {
    const result = await callGemini(prompt)
    return { result, provider: 'gemini' }
  }
  throw new Error('No AI provider configured')
}

/* Chat auto-reply — DeepSeek first, fallback chain */
export async function generateDeepSeek(prompt) {
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const result = await callDeepSeek(prompt)
      return { result, provider: 'deepseek' }
    } catch (err) {
      console.warn('DeepSeek failed, falling back:', err.message)
    }
  }
  if (process.env.FIREWORKS_API_KEY) {
    try {
      const result = await callFireworks(prompt)
      return { result, provider: 'fireworks' }
    } catch (err) {
      console.warn('Fireworks failed:', err.message)
    }
  }
  if (process.env.GEMINI_API_KEY) {
    const result = await callGemini(prompt)
    return { result, provider: 'gemini' }
  }
  throw new Error('No AI provider configured')
}

/* Keep for backward compat */
export async function generateGemini(prompt) {
  return generateForDescriptions(prompt)
}

export function parseJson(text) {
  let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const jsonStart = clean.indexOf('{')
  const jsonEnd   = clean.lastIndexOf('}')
  if (jsonStart > 0 && jsonEnd > jsonStart) {
    clean = clean.slice(jsonStart, jsonEnd + 1)
  }
  return JSON.parse(clean)
}
