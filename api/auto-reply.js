/* Vercel serverless function — called by Supabase Database Webhook
   Triggered on: INSERT into messages table
   Flow: new customer message → fetch shop + products → AI → insert reply as owner
*/
import { createClient } from '@supabase/supabase-js'
import { generate, parseJson } from './_generate.js'

function smartReplyPrompt({ shopName, productList, chatHistory, customerMessage }) {
  return `তুমি "${shopName}" দোকানের মালিক। তুমি একজন বাস্তব বাংলাদেশী দোকানদার হিসেবে কথা বলো — আন্তরিক, সহজ, এবং বিশ্বাসযোগ্য। তুমি AI বা bot নও।

কথা বলার ধরন:
- একদম সাধারণ বাংলায় কথা বলো যেভাবে একজন দোকানদার বলে
- "জী ভাই", "জী আপু", "ঠিক আছে ভাই", "আচ্ছা" — এই ধরনের স্বাভাবিক শব্দ ব্যবহার করো
- Banglish বুঝলে বাংলায় উত্তর দাও
- reply ছোট রাখো, এক-দুই লাইনের বেশি না
- কোনো formal বা robotic ভাষা ব্যবহার করবে না
- Customer-কে "ভাই/আপু" বলে সম্বোধন করো
- Emoji একদম ব্যবহার করবে না

${productList
  ? `আমাদের দোকানের পণ্য:\n${productList}`
  : `দোকানের পণ্য তালিকা এখনো দেওয়া হয়নি। Customer কিছু জিজ্ঞেস করলে বলবে "একটু পরে জানাচ্ছি" বা "সরাসরি ফোন করুন।"`
}

--- এখন পর্যন্ত কথোপকথন ---
${chatHistory}
Customer: ${customerMessage}
---

গুরুত্বপূর্ণ:
- আগের কথোপকথন মনে রেখো — যা আগে জানা গেছে তা আর জিজ্ঞেস করবে না
- শুধু তালিকার পণ্য নিয়ে কথা বলো
- Customer order দিতে চাইলে এক এক করে নাম, মোবাইল, ঠিকানা চাও
- কথোপকথনে যদি ইতিমধ্যে "অর্ডার নেওয়া হয়েছে" বা অর্ডার নম্বর (SB...) থাকে — order আর নতুন করে দিও না, "order": null দাও
- Customer "thanks", "ধন্যবাদ", "ok thanks", "আচ্ছা", "okay" বললে — "ধন্যবাদ ভাই, ভালো থাকবেন!" বা "জী ভাই, আর কিছু লাগলে জানাবেন।" — আগের কথা repeat করবে না, "order": null দাও
- Conversation শেষ মনে হলে বিদায়সূচক ছোট একটা কথা বলো
- Customer যদি বলে "মালিকের সাথে কথা বলতে চাই", "owner এর সাথে কথা বলব", "আপনি কি মালিক?", "real person চাই", "human চাই" বা এই ধরনের কিছু — তাহলে "handoff": true দাও এবং reply-এ বলো "ঠিক আছে ভাই, আপনাকে এখন দোকান মালিকের কাছে পাঠানো হচ্ছে। কিছুক্ষণ অপেক্ষা করুন, তিনি অনলাইন আসলেই reply দেবেন।"

অর্ডার নেওয়ার সময় (প্রথমবার, যদি আগে confirm না হয়ে থাকে):
{"reply":"...","order":{"product_name":"...","quantity":1,"price":0,"customer_name":"...","customer_phone":"...","customer_address":"...","notes":""},"handoff":false,"quick_replies":[]}

অর্ডার না হলে বা আগেই হয়ে গেলে:
{"reply":"...","order":null,"handoff":false,"quick_replies":["বিকল্প ১","বিকল্প ২"]}

Customer মালিকের সাথে কথা বলতে চাইলে:
{"reply":"ঠিক আছে ভাই, আপনাকে এখন দোকান মালিকের কাছে পাঠানো হচ্ছে। কিছুক্ষণ অপেক্ষা করুন, তিনি অনলাইন আসলেই reply দেবেন।","order":null,"handoff":true,"quick_replies":[]}

শুধু JSON দাও।`
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
      .select('shop_id, owner_id, ai_paused')
      .eq('id', conversation_id)
      .single()

    if (!conv?.shop_id) return res.status(200).json({ skipped: 'no shop_id' })

    // Skip if message is from the owner (owner replying re-enables AI)
    if (sender_id === conv.owner_id) {
      // If owner manually replied, unpause AI for this conversation
      if (conv.ai_paused) {
        await supabase.from('conversations').update({ ai_paused: false }).eq('id', conversation_id)
      }
      return res.status(200).json({ skipped: 'owner message' })
    }

    // Skip if AI is paused for this conversation (customer requested human)
    if (conv.ai_paused) return res.status(200).json({ skipped: 'ai paused for this conversation' })

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

    let reply, order, quickReplies, handoff
    try {
      const parsed = parseJson(result)
      reply = parsed.reply
      order = parsed.order
      quickReplies = parsed.quick_replies?.length ? parsed.quick_replies : null
      handoff = !!parsed.handoff
    } catch {
      reply = result.slice(0, 500)
    }

    if (!reply) return res.status(200).json({ skipped: 'no reply generated' })

    // If customer wants to talk to owner — pause AI for this conversation
    if (handoff) {
      await supabase.from('conversations').update({ ai_paused: true }).eq('id', conversation_id)
    }

    // If AI detected a complete order — create it in DB (only if no recent order exists for this conversation)
    if (order?.product_name && order?.customer_name && order?.customer_phone && order?.customer_address) {
      // Duplicate guard: check if an order was already created in the last 10 minutes for same phone+shop
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('order_number')
        .eq('shop_id', shop.id)
        .eq('customer_phone', order.customer_phone)
        .gte('created_at', tenMinsAgo)
        .maybeSingle()

      if (existingOrder) {
        // Order already exists — don't duplicate, just mention existing order number
        console.log('[auto-reply] duplicate order skipped, existing:', existingOrder.order_number)
      } else {
        // Calculate total from product list
        const matchedProduct = products?.find(p => p.name?.toLowerCase().includes(order.product_name?.toLowerCase()))
        const unitPrice = matchedProduct?.price || order.price || 0
        const total = unitPrice * (order.quantity || 1)

        const { data: createdOrder } = await supabase.from('orders').insert({
          shop_id: shop.id,
          product_name: order.product_name,
          quantity: order.quantity || 1,
          total,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          notes: order.notes || '',
          status: 'pending',
        }).select('order_number').single()

        if (createdOrder?.order_number) {
          reply = `${reply} (অর্ডার নং: ${createdOrder.order_number})`
        }
      }
    }

    // Insert reply as shop owner
    await supabase.from('messages').insert({
      conversation_id,
      sender_id: shop.owner_id,
      content: reply,
      is_ai: true,
      ...(quickReplies ? { quick_replies: quickReplies } : {}),
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
