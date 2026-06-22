/* Shared AI generation
   Chat/auto-reply:       DeepSeek → Groq
   Product descriptions:  Groq → Cerebras → Fireworks → Gemini
*/

const DEEPSEEK_URL  = 'https://api.deepseek.com/chat/completions'
const GROQ_URL      = 'https://api.groq.com/openai/v1/chat/completions'
const CEREBRAS_URL  = 'https://api.cerebras.ai/v1/chat/completions'
const FIREWORKS_URL = 'https://api.fireworks.ai/inference/v1/chat/completions'
const GEMINI_URL    = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callDeepSeek(prompt) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1500 }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

async function callGroq(prompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1500 }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

async function callCerebras(prompt) {
  const res = await fetch(CEREBRAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}` },
    body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 1500 }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Cerebras ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

async function callFireworks(prompt) {
  const res = await fetch(FIREWORKS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}` },
    body: JSON.stringify({ model: 'accounts/fireworks/models/llama4-scout-instruct-basic', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 2000 }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Fireworks ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

async function callGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1500 } }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text.trim()
}

async function tryChain(calls) {
  for (const { name, fn, key } of calls) {
    if (!process.env[key]) continue
    try {
      const result = await fn()
      console.log(`[AI] provider: ${name}`)
      return { result, provider: name }
    } catch (err) {
      console.warn(`[AI] ${name} failed: ${err.message}`)
    }
  }
  throw new Error('All AI providers failed')
}

/* Chat / auto-reply: DeepSeek → Groq */
export async function generateDeepSeek(prompt) {
  return tryChain([
    { name: 'deepseek',  key: 'DEEPSEEK_API_KEY',  fn: () => callDeepSeek(prompt) },
    { name: 'groq',      key: 'GROQ_API_KEY',       fn: () => callGroq(prompt) },
  ])
}

/* Product descriptions: Groq → Cerebras → Fireworks → Gemini */
export async function generateForDescriptions(prompt) {
  return tryChain([
    { name: 'groq',      key: 'GROQ_API_KEY',       fn: () => callGroq(prompt) },
    { name: 'cerebras',  key: 'CEREBRAS_API_KEY',    fn: () => callCerebras(prompt) },
    { name: 'fireworks', key: 'FIREWORKS_API_KEY',   fn: () => callFireworks(prompt) },
    { name: 'gemini',    key: 'GEMINI_API_KEY',      fn: () => callGemini(prompt) },
  ])
}

/* Default fallback (used by landing_page, smart_reply etc) */
export async function generate(prompt) {
  return tryChain([
    { name: 'deepseek',  key: 'DEEPSEEK_API_KEY',  fn: () => callDeepSeek(prompt) },
    { name: 'groq',      key: 'GROQ_API_KEY',       fn: () => callGroq(prompt) },
    { name: 'cerebras',  key: 'CEREBRAS_API_KEY',   fn: () => callCerebras(prompt) },
    { name: 'fireworks', key: 'FIREWORKS_API_KEY',  fn: () => callFireworks(prompt) },
    { name: 'gemini',    key: 'GEMINI_API_KEY',     fn: () => callGemini(prompt) },
  ])
}

/* Backward compat */
export const generateGemini = generateForDescriptions

export function parseJson(text) {
  let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const jsonStart = clean.indexOf('{')
  const jsonEnd   = clean.lastIndexOf('}')
  if (jsonStart > 0 && jsonEnd > jsonStart) clean = clean.slice(jsonStart, jsonEnd + 1)
  return JSON.parse(clean)
}
