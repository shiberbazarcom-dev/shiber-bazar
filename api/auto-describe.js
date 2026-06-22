/* Vercel serverless function — AI product description generation via Gemini
   Processes first 25 products in one call to stay within timeout limits.
*/
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.SUPABASE_URL  || process.env.VITE_SUPABASE_URL
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
const GEMINI_KEY    = process.env.GEMINI_API_KEY
const GEMINI_URL    = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

async function callGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 4000 },
    }),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 100)}`)
  }
  const data = await res.json()
  return data.candidates[0].content.parts[0].text.trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { shopId, categoryName } = req.body || {}
  if (!shopId) return res.status(400).json({ error: 'shopId required' })

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[auto-describe] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return res.status(500).json({ error: 'Server misconfigured' })
  }
  if (!GEMINI_KEY) {
    console.error('[auto-describe] Missing GEMINI_API_KEY')
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  // Verify shop exists
  const { data: shop, error: shopErr } = await admin
    .from('shops').select('id').eq('id', shopId).single()
  if (shopErr || !shop) return res.status(404).json({ error: 'Shop not found' })

  // Fetch first 25 products without descriptions
  const { data: products, error: fetchErr } = await admin
    .from('products')
    .select('id, name, price')
    .eq('shop_id', shopId)
    .is('description', null)
    .limit(25)

  if (fetchErr) return res.status(500).json({ error: fetchErr.message })
  if (!products?.length) return res.status(200).json({ ok: true, count: 0 })

  console.log(`[auto-describe] ${products.length} products for shop ${shopId}, category: ${categoryName}`)

  // Build compact prompt for all products in one call
  const list = products.map((p, i) => `${i + 1}|${p.name}|৳${p.price}`).join('\n')
  const prompt = `তুমি একজন বাংলাদেশী e-commerce কপিরাইটার। দোকানের ধরন: ${categoryName || 'সাধারণ'}

নিচের ${products.length}টি পণ্যের জন্য বাংলায় সংক্ষিপ্ত description ও features লেখো।
ফরম্যাট: idx|name|price
${list}

JSON array return করো (সব ${products.length}টি item):
[{"idx":1,"desc":"১ বাক্যে বিবরণ","feat":"বৈশিষ্ট্য ১\\nবৈশিষ্ট্য ২"},{"idx":2,...}]

শুধু JSON array দাও।`

  let rawResult
  try {
    rawResult = await callGemini(prompt)
    console.log('[auto-describe] Gemini responded, length:', rawResult.length)
  } catch (err) {
    console.error('[auto-describe] Gemini call failed:', err.message)
    return res.status(500).json({ error: 'Gemini failed: ' + err.message })
  }

  // Parse JSON array from response
  let items
  try {
    const clean = rawResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const s = clean.indexOf('['), e = clean.lastIndexOf(']')
    if (s === -1 || e === -1) throw new Error('No array found in response')
    items = JSON.parse(clean.slice(s, e + 1))
  } catch (parseErr) {
    console.error('[auto-describe] JSON parse failed:', parseErr.message)
    console.error('[auto-describe] Raw response:', rawResult.slice(0, 500))
    return res.status(500).json({ error: 'JSON parse failed', raw: rawResult.slice(0, 200) })
  }

  // Update each product in DB
  let updated = 0
  await Promise.all(items.map(async (item) => {
    const product = products[item.idx - 1]
    if (!product?.id) return
    const { error: upErr } = await admin.from('products').update({
      description: item.desc?.trim()  || null,
      features:    item.feat?.trim()  || null,
    }).eq('id', product.id)
    if (!upErr) updated++
    else console.warn('[auto-describe] update failed:', product.name, upErr.message)
  }))

  console.log(`[auto-describe] Done: ${updated} products updated`)
  return res.status(200).json({ ok: true, count: updated })
}
