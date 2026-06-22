/* Vercel serverless function — bulk AI product description generation
   Called after shop creation to enrich template products with Gemini-generated
   descriptions and features.
*/
import { createClient } from '@supabase/supabase-js'
import { generateGemini, generate, parseJson } from './_generate.js'

const SUPABASE_URL         = process.env.SUPABASE_URL         || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const BATCH_SIZE = 40

function buildBulkPrompt(products, categoryName) {
  const list = products.map((p, i) => `${i + 1}. ${p.name} — ৳${p.price}`).join('\n')
  return `তুমি একজন বাংলাদেশী e-commerce কপিরাইটার।
দোকানের ধরন: ${categoryName || 'সাধারণ দোকান'}

নিচের প্রতিটি পণ্যের জন্য সংক্ষিপ্ত বাংলা বিবরণ ও বৈশিষ্ট্য লেখো।

পণ্য তালিকা:
${list}

JSON array return করো (ঠিক ${products.length}টি item, index 1 থেকে শুরু):
[
  {
    "idx": 1,
    "description": "১-২ বাক্যের আকর্ষণীয় বিবরণ",
    "features": "মূল বৈশিষ্ট্য (সর্বোচ্চ ৩ লাইন)"
  }
]

শুধু JSON array দাও, আর কিছু না।`
}

function parseArrayResult(text) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const start = clean.indexOf('[')
  const end   = clean.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array in response')
  return JSON.parse(clean.slice(start, end + 1))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { shopId, categoryName } = req.body
  if (!shopId) return res.status(400).json({ error: 'shopId required' })

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[auto-describe] Missing Supabase env vars')
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verify shop exists (simple existence check, no user auth needed — low risk write-only operation)
  const { data: shop } = await admin.from('shops').select('id').eq('id', shopId).single()
  if (!shop) return res.status(404).json({ error: 'Shop not found' })

  // Fetch products without descriptions
  const { data: products, error: fetchErr } = await admin
    .from('products')
    .select('id, name, price')
    .eq('shop_id', shopId)
    .is('description', null)
    .limit(120)

  if (fetchErr) {
    console.error('[auto-describe] fetch error:', fetchErr.message)
    return res.status(500).json({ error: fetchErr.message })
  }

  if (!products?.length) {
    return res.status(200).json({ ok: true, count: 0, message: 'No products need descriptions' })
  }

  console.log(`[auto-describe] Generating descriptions for ${products.length} products in shop ${shopId}`)

  let totalUpdated = 0

  for (let offset = 0; offset < products.length; offset += BATCH_SIZE) {
    const batch = products.slice(offset, offset + BATCH_SIZE)
    const prompt = buildBulkPrompt(batch, categoryName)

    try {
      const { result, provider } = await generateGemini(prompt).catch(async (err) => {
        console.warn('[auto-describe] Gemini failed, trying fallback:', err.message)
        return generate(prompt)
      })

      console.log(`[auto-describe] AI response from ${provider}, batch ${offset / BATCH_SIZE + 1}`)

      let items
      try {
        items = parseArrayResult(result)
      } catch (parseErr) {
        console.error('[auto-describe] JSON parse failed:', parseErr.message, '— raw:', result.slice(0, 200))
        continue
      }

      const updates = items
        .filter(item => item && item.idx >= 1 && item.idx <= batch.length)
        .map(async (item) => {
          const product = batch[item.idx - 1]
          if (!product?.id) return
          const { error: updateErr } = await admin.from('products').update({
            description: item.description?.trim() || null,
            features:    item.features?.trim()    || null,
          }).eq('id', product.id)
          if (updateErr) console.warn('[auto-describe] update failed for', product.name, updateErr.message)
        })

      await Promise.all(updates)
      totalUpdated += items.length
      console.log(`[auto-describe] Batch done: ${items.length} products updated`)
    } catch (err) {
      console.error('[auto-describe] Batch error:', err.message)
    }
  }

  return res.status(200).json({ ok: true, count: totalUpdated })
}
