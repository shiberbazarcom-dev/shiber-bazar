/* Vercel serverless function — called by Supabase Database Webhook
   Triggered on: INSERT into messages table
   Flow: new customer message → fetch shop + products → AI → insert reply as owner
*/
import { createClient } from '@supabase/supabase-js'
import { generate, parseJson } from './_generate.js'

function smartReplyPrompt({ shopName, productList, chatHistory, customerMessage }) {
  return `তুমি "${shopName}" দোকানের একজন স্মার্ট AI বিক্রয়কর্মী।

${productList
  ? `✅ দোকানের পণ্য তালিকা:\n${productList}`
  : `⚠️ পণ্য তালিকা আপডেট হয়নি। বলবে: "সরাসরি যোগাযোগ করুন।"`
}

--- কথোপকথন ---
${chatHistory}
Customer: ${customerMessage}
---

নিয়ম:
- আগের কথোপকথন মনে রেখে reply দাও — আগে যা জানা গেছে তা আর জিজ্ঞেস করবে না
- শুধু তালিকার পণ্য নিয়ে কথা বলবে
- Customer বাংলা বা banglish যেভাবেই লিখুক, বাংলায় reply দেবে
- ছোট ও স্বাভাবিক reply দেবে

অর্ডার সংক্রান্ত নিয়ম:
- Customer যদি order confirm করে এবং কথোপকথনে নাম + মোবাইল নম্বর + ঠিকানা পাওয়া যায় → order field পূরণ করবে
- যদি কোনো তথ্য বাকি থাকে → reply-তে শুধু সেই তথ্যটা চাইবে
- Order confirm হলে reply-তে order number উল্লেখ করবে (order number জানা না থাকলে "অর্ডার নিবন্ধন হয়েছে" বলবে)

JSON format এ return করো:
{
  "reply": "reply এখানে",
  "order": null
}

অথবা অর্ডার ready হলে:
{
  "reply": "আপনার অর্ডার নিবন্ধন হয়েছে! শীঘ্রই যোগাযোগ করা হবে।",
  "order": {
    "product_name": "পণ্যের নাম",
    "quantity": 1,
    "customer_name": "নাম",
    "customer_phone": "01XXXXXXXXX",
    "customer_address": "ঠিকানা",
    "notes": ""
  }
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
      ? products.map((p, i) => `${i + 1}. ${p.name} — ৳${p.price}${p.description ? ` (${p.description})` : ''}`).join('\n')
      : ''

    // Fetch recent conversation history (last 14 messages for memory)
    const { data: recentMsgs } = await supabase
      .from('messages')
      .select('sender_id, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(14)

    const chatHistory = (recentMsgs || [])
      .reverse()
      .map(m => m.sender_id === conv.owner_id ? `বিক্রয়কর্মী: ${m.content}` : `Customer: ${m.content}`)
      .join('\n')

    // Generate AI reply
    const prompt = smartReplyPrompt({ shopName: shop.shop_name, productList, chatHistory, customerMessage: content })
    const { result } = await generate(prompt)

    let reply, order
    try {
      const parsed = parseJson(result)
      reply = parsed.reply
      order = parsed.order
    } catch {
      reply = result.slice(0, 500)
    }

    if (!reply) return res.status(200).json({ skipped: 'no reply generated' })

    // If AI detected a complete order — create it in DB
    if (order?.product_name && order?.customer_name && order?.customer_phone && order?.customer_address) {
      const { data: createdOrder } = await supabase.from('orders').insert({
        shop_id: shop.id,
        product_name: order.product_name,
        quantity: order.quantity || 1,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        notes: order.notes || '',
        status: 'pending',
      }).select('order_number').single()

      if (createdOrder?.order_number) {
        reply = reply.replace('অর্ডার নিবন্ধন হয়েছে', `অর্ডার নিবন্ধন হয়েছে (${createdOrder.order_number})`)
      }
    }

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
