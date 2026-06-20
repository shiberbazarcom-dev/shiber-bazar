/* Vercel serverless function — AI content generation
   Primary: DeepSeek-V3
   Fallback: Google Gemini 1.5 Flash (free)
*/

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

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
      max_tokens: 1000,
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
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text.trim()
}

async function generate(prompt) {
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

/* ── Prompt builders ── */
const PROMPTS = {
  landing_page: ({ productName, price, category }) => `
তুমি একজন বাংলাদেশী মার্কেটিং কপিরাইটার। নিচের পণ্যের জন্য Facebook landing page এর content তৈরি করো।

পণ্য: ${productName}
${price ? `মূল্য: ৳${price}` : ''}
${category ? `ক্যাটাগরি: ${category}` : ''}

সম্পূর্ণ বাংলায় লেখো। JSON format এ return করো:
{
  "headline": "আকর্ষণীয় বড় হেডলাইন (১৫-২০ শব্দ)",
  "subheadline": "সাবহেডলাইন (২০-৩০ শব্দ)",
  "badge_text": "ছোট অফার ব্যাজ (৫-৭ শব্দ, emoji সহ)",
  "features": ["ফিচার ১", "ফিচার ২", "ফিচার ৩", "ফিচার ৪", "ফিচার ৫"],
  "faqs": [
    {"q": "প্রশ্ন ১?", "a": "উত্তর ১"},
    {"q": "প্রশ্ন ২?", "a": "উত্তর ২"},
    {"q": "প্রশ্ন ৩?", "a": "উত্তর ৩"}
  ],
  "cta_text": "CTA বাটনের লেখা",
  "whatsapp_message": "WhatsApp অর্ডার মেসেজ"
}

শুধু JSON দাও, আর কিছু না।`,

  product_description: ({ productName, category, price }) => `
তুমি একজন বাংলাদেশী e-commerce কপিরাইটার। নিচের পণ্যের জন্য আকর্ষণীয় বিবরণ ও বৈশিষ্ট্য লেখো।

পণ্য: ${productName}
${category ? `ক্যাটাগরি: ${category}` : ''}
${price ? `মূল্য: ৳${price}` : ''}

সম্পূর্ণ বাংলায় লেখো। JSON format এ return করো:
{
  "description": "২-৩ বাক্যের আকর্ষণীয় বিবরণ, পণ্যের উপকারিতা তুলে ধরবে",
  "features": "প্রতিটি বৈশিষ্ট্য আলাদা লাইনে, যেমন:\nউপাদান: ...\nসাইজ: ...\nরং: ...\nওজন: ...\nবিশেষত্ব: ..."
}

শুধু JSON দাও, আর কিছু না।`,

  smart_reply: ({ customerMessage, shopName, productList }) => `
তুমি "${shopName}" দোকানের একজন বিনয়ী ও সহায়ক customer service প্রতিনিধি।
Customer বাংলা বা banglish (বাংলা ইংরেজি মিশিয়ে) যেভাবেই লিখুক, তুমি বুঝে reply দেবে।
Reply সবসময় বাংলায় দেবে।

${productList ? `দোকানের পণ্য তালিকা (নাম ও দাম সহ):
${productList}

গুরুত্বপূর্ণ: Customer যদি কোনো পণ্যের দাম বা তথ্য জানতে চায়, পণ্য তালিকা থেকে সঠিক দাম ও তথ্য দাও। যদি পণ্য তালিকায় না থাকে, বিনয়ের সাথে জানাও যে এই পণ্যটি এখন নেই।` : ''}

Customer মেসেজ: "${customerMessage}"

এই মেসেজের জন্য ১টি সেরা reply দাও। সংক্ষিপ্ত, বিনয়ী ও সহায়ক হবে।
JSON format এ return করো:
{
  "replies": [
    "reply (২-৩ বাক্য, প্রাসঙ্গিক তথ্য সহ)"
  ]
}

শুধু JSON দাও, আর কিছু না।`,
}

/* ── Main handler ── */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const { type, ...params } = req.body
  if (!type || !PROMPTS[type]) return res.status(400).json({ error: 'Invalid type' })

  try {
    const prompt = PROMPTS[type](params)
    const { result, provider } = await generate(prompt)

    let parsed
    try {
      const clean = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return res.status(200).json({ raw: result, provider })
    }

    return res.status(200).json({ ...parsed, provider })
  } catch (err) {
    console.error('AI generation failed:', err)
    return res.status(500).json({ error: err.message })
  }
}
