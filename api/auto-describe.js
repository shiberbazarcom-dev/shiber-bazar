/* Vercel serverless function — bulk AI product description generation
   Called after shop creation to enrich template products with Gemini-generated
   descriptions and features. Uses user JWT auth (no shared secret needed).
*/
import { createClient } from '@supabase/supabase-js'
import { generateGemini, generate, parseJson } from './_generate.js'

const SUPABASE_URL           = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY      = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY

const BATCH_SIZE = 50   // products per Gemini call

function buildBulkPrompt(products, categoryName) {
  const list = products.map((p, i) => `${i + 1}. ${p.name} — ৳${p.price}`).join('\n')

  return `তুমি একজন বাংলাদেশী e-commerce কপিরাইটার।
দোকানের ধরন: ${categoryName || 'সাধারণ দোকান'}

নিচের প্রতিটি পণ্যের জন্য সংক্ষিপ্ত বাংলা বিবরণ ও বৈশিষ্ট্য লেখো।

পণ্য তালিকা:
${list}

JSON array return করো (index অনুযায়ী, তালিকার সব পণ্য):
[
  {
    "idx": 1,
    "description": "১-২ বাক্যের আকর্ষণীয় বিবরণ",
    "features": "মূল বৈশিষ্ট্য, প্রতিটি লাইনে একটি করে (সর্বোচ্চ ৩ লাইন)"
  }
]

শুধু JSON array দাও, আর কিছু না।`
}

function parseArrayJson(text) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const start = clean.indexOf('[')
  const end   = clean.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No array found')
  return JSON.parse(clean.slice(start, end + 1))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Auth: validate user JWT
  const authHeader = req.headers['authorization']
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { shopId, categoryName } = req.body
  if (!shopId) return res.status(400).json({ error: 'shopId required' })

  // Verify shop belongs to this user
  const { data: shop } = await admin.from('shops').select('id').eq('id', shopId).eq('owner_id', user.id).single()
  if (!shop) return res.status(403).json({ error: 'Forbidden' })

  // Fetch products that have no description yet
  const { data: products } = await admin
    .from('products')
    .select('id, name, price')
    .eq('shop_id', shopId)
    .is('description', null)
    .limit(100)

  if (!products?.length) return res.status(200).json({ ok: true, count: 0 })

  let totalUpdated = 0

  // Process in batches to stay within timeout
  for (let offset = 0; offset < products.length; offset += BATCH_SIZE) {
    const batch = products.slice(offset, offset + BATCH_SIZE)
    const prompt = buildBulkPrompt(batch, categoryName)

    try {
      const { result } = await generateGemini(prompt).catch(() => generate(prompt))
      let items
      try { items = parseArrayJson(result) } catch { continue }

      const updates = items.map(async (item) => {
        const product = batch[item.idx - 1]
        if (!product?.id) return
        await admin.from('products').update({
          description: item.description?.trim() || null,
          features:    item.features?.trim()    || null,
        }).eq('id', product.id)
      })
      await Promise.all(updates)
      totalUpdated += items.length
    } catch (err) {
      console.error('[auto-describe] batch failed:', err.message)
    }
  }

  return res.status(200).json({ ok: true, count: totalUpdated })
}
