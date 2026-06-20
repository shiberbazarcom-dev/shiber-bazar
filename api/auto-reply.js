/* Vercel serverless function — called by Supabase Database Webhook
   Triggered on: INSERT into messages table
   Flow: new customer message → fetch shop + products → AI → insert reply as owner
*/
import { createClient } from '@supabase/supabase-js'
import { generate, parseJson } from './_generate.js'

function smartReplyPrompt({ customerMessage, shopName, productList }) {
  return `
তুমি "${shopName}" দোকানের একজন অভিজ্ঞ বিক্রয়কর্মী। তোমার কাজ হলো শুধুমাত্র এই দোকানের পণ্য বিক্রি করা।

🔴 কঠোর নিয়ম:
1. শুধুমাত্র নিচের "দোকানের পণ্য তালিকা" থেকে উত্তর দেবে।
2. তালিকায় নেই এমন কোনো পণ্যের কথা কখনো বলবে না, এমনকি অনুমান করেও না।
3. Customer যদি এমন কিছু জিজ্ঞেস করে যা তালিকায় নেই, বিনয়ের সাথে বলবে "দুঃখিত, এই পণ্যটি আমাদের দোকানে নেই।"
4. Customer বাংলা বা banglish যেভাবেই লিখুক, বুঝে বাংলায় reply দেবে।
5. Event বা উপলক্ষ (যেমন: রমজান, বিবাহ, ঈদ) এর জন্য পণ্য জানতে চাইলে — শুধু তালিকা থেকে সেই event এর জন্য প্রাসঙ্গিক পণ্যগুলো বাছাই করে দেখাবে।

${productList
  ? `✅ "${shopName}" দোকানের পণ্য তালিকা:\n${productList}`
  : `⚠️ এই দোকানের কোনো পণ্য তালিকা নেই। Customer যাই জিজ্ঞেস করুক, বলবে "আমাদের পণ্য তালিকা এখনো আপডেট হয়নি, অনুগ্রহ করে সরাসরি যোগাযোগ করুন।"`
}

Customer মেসেজ: "${customerMessage}"

উপরের তালিকা দেখে ১টি সেরা reply দাও। মানবিক, বিনয়ী ও সহায়ক হবে।
JSON format এ return করো:
{
  "replies": ["reply এখানে"]
}

শুধু JSON দাও, আর কিছু না।`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verify Supabase webhook secret
  const secret = req.headers['x-webhook-secret'] || req.headers['authorization']
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { record, type } = req.body
  if (type !== 'INSERT' || !record) return res.status(200).json({ skipped: 'not an insert' })

  const { conversation_id, sender_id, content } = record
  if (!conversation_id || !content) return res.status(200).json({ skipped: 'missing fields' })

  try {
    // Fetch conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('shop_id, owner_id')
      .eq('id', conversation_id)
      .single()

    if (!conv?.shop_id) return res.status(200).json({ skipped: 'no shop_id' })

    // Skip if message is from the owner
    if (sender_id === conv.owner_id) return res.status(200).json({ skipped: 'owner message' })

    // Fetch shop separately (avoids join dependency on FK setup)
    const { data: shop } = await supabase
      .from('shops')
      .select('id, shop_name, owner_id, auto_reply_enabled')
      .eq('id', conv.shop_id)
      .single()

    console.log('[auto-reply] shop:', JSON.stringify({ id: shop?.id, name: shop?.shop_name, auto_reply: shop?.auto_reply_enabled }))

    if (!shop) return res.status(200).json({ skipped: 'shop not found' })
    if (!shop.auto_reply_enabled) return res.status(200).json({ skipped: 'disabled' })

    // Fetch shop products (no is_active filter — fetch all and let AI decide)
    const { data: products } = await supabase
      .from('products')
      .select('name, price, description')
      .eq('shop_id', shop.id)
      .limit(50)

    const productList = products?.length
      ? products.map((p, i) => `${i + 1}. ${p.name} — ৳${p.price}${p.unit ? `/${p.unit}` : ''}${p.description ? ` (${p.description})` : ''}`).join('\n')
      : ''

    // Generate AI reply
    const prompt = smartReplyPrompt({ customerMessage: content, shopName: shop.shop_name, productList })
    const { result } = await generate(prompt)

    let reply
    try {
      const parsed = parseJson(result)
      reply = parsed.replies?.[0]
    } catch {
      reply = result.slice(0, 500) // fallback: use raw text
    }

    if (!reply) return res.status(200).json({ skipped: 'no reply generated' })

    // Insert reply as shop owner
    await supabase.from('messages').insert({
      conversation_id,
      sender_id: shop.owner_id,
      content: reply,
    })

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation_id)

    return res.status(200).json({ ok: true, provider: 'ai' })
  } catch (err) {
    console.error('Auto-reply error:', err)
    return res.status(500).json({ error: err.message })
  }
}
