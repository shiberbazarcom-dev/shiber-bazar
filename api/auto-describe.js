/* Vercel serverless function — AI product description generation
   Uses Fireworks AI (primary), fallback to DeepSeek/Gemini via _generate.js
*/
import { createClient } from '@supabase/supabase-js'
import { generateForDescriptions } from './_generate.js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const FREE_LIMIT   = 5

function buildPrompt(products, categoryName) {
  const list = products.map((p, i) => `${i + 1}|${p.name}|${p.price}`).join('\n')
  return `তুমি একজন বাংলাদেশী e-commerce কপিরাইটার। দোকানের ধরন: ${categoryName || 'সাধারণ'}

নিচের ${products.length}টি পণ্যের জন্য বাংলায় সংক্ষিপ্ত description ও features লেখো।
ফরম্যাট: idx|name|price
${list}

JSON array return করো (সব ${products.length}টি item):
[{"idx":1,"desc":"১ বাক্যে বিবরণ","feat":"বৈশিষ্ট্য ১\\nবৈশিষ্ট্য ২"},{"idx":2,"desc":"...","feat":"..."}]

শুধু JSON array দাও।`
}

function parseArray(text) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const s = clean.indexOf('['), e = clean.lastIndexOf(']')
  if (s === -1 || e === -1) throw new Error('No JSON array found')
  return JSON.parse(clean.slice(s, e + 1))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { shopId, categoryName } = req.body || {}
  if (!shopId) return res.status(400).json({ error: 'shopId required' })

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: shop } = await admin.from('shops').select('id').eq('id', shopId).single()
  if (!shop) return res.status(404).json({ error: 'Shop not found' })

  // Count already AI-described products (free limit check)
  const { count: alreadyDescribed } = await admin
    .from('products').select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId).not('description', 'is', null)

  if ((alreadyDescribed ?? 0) >= FREE_LIMIT) {
    return res.status(200).json({ ok: false, limitReached: true, freeLimit: FREE_LIMIT })
  }

  // Count total missing
  const { count: totalMissing } = await admin
    .from('products').select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId).is('description', null)

  // Fetch free limit products
  const { data: products, error: fetchErr } = await admin
    .from('products').select('id, name, price')
    .eq('shop_id', shopId).is('description', null)
    .limit(FREE_LIMIT)

  if (fetchErr) return res.status(500).json({ error: fetchErr.message })
  if (!products?.length) return res.status(200).json({ ok: true, count: 0, totalMissing: 0 })

  console.log(`[auto-describe] ${products.length} products, shop: ${shopId}`)

  let rawResult
  try {
    const { result, provider } = await generateForDescriptions(buildPrompt(products, categoryName))
    rawResult = result
    console.log(`[auto-describe] Got response from ${provider}`)
  } catch (err) {
    console.error('[auto-describe] AI call failed:', err.message)
    return res.status(500).json({ error: 'AI call failed: ' + err.message })
  }

  let items
  try {
    items = parseArray(rawResult)
  } catch (err) {
    console.error('[auto-describe] Parse failed:', err.message, rawResult.slice(0, 200))
    return res.status(500).json({ error: 'JSON parse failed', raw: rawResult.slice(0, 200) })
  }

  let updated = 0
  await Promise.all(items.map(async (item) => {
    const product = products[item.idx - 1]
    if (!product?.id) return
    const { error } = await admin.from('products').update({
      description: item.desc?.trim() || null,
      features:    item.feat?.trim() || null,
    }).eq('id', product.id)
    if (!error) updated++
  }))

  console.log(`[auto-describe] Done: ${updated} updated`)
  return res.status(200).json({
    ok: true,
    count: updated,
    totalMissing: totalMissing ?? 0,
    freeLimit: FREE_LIMIT,
    hasMore: (totalMissing ?? 0) > FREE_LIMIT,
  })
}
