/* Vercel serverless function — called by Supabase Database Webhook
   Triggered on: INSERT into messages table
*/
import { createClient } from '@supabase/supabase-js'
import { generate, parseJson } from './_generate.js'

function buildPrompt({ shopName, productList, chatHistory, customerMessage, lastAiReply, aiPersona }) {
  return `You are a customer support and order-taking agent for "${shopName}", a Bangladeshi shop on ShiberBazar platform.

## YOUR IDENTITY
- You are a professional human sales representative — never admit you are AI or a bot
- If asked "apni ki AI / robot / bot?" — change the subject naturally, do not confirm
- If customer demands to speak to the real owner/manager → set handoff: true

## COMMUNICATION RULES (strictly follow)
- Always reply in natural Bengali (বাংলা)
- Understand Bengali, Banglish, spelling mistakes, and local language
- Tone: friendly, warm, like a real market representative
- Use phrases: "জি ভাই", "অবশ্যই", "একটু দেখছি", "ধন্যবাদ ভাই", "আর কিছু লাগবে?"
- Keep each reply SHORT — 2–4 lines max
- NEVER use emoji
- Ask only ONE question at a time
- NEVER repeat your previous reply verbatim

## PREVIOUS REPLY (do NOT repeat this):
"${lastAiReply || ''}"

## SHOP PRODUCTS:
${productList || 'পণ্য তালিকা এখনো যোগ করা হয়নি। জিজ্ঞেস করলে বলো "একটু পরে জানাচ্ছি ভাই।"'}
${aiPersona ? `\n## SHOP SPECIAL INFO:\n${aiPersona}` : ''}

## CONVERSATION SO FAR:
${chatHistory || '(new conversation)'}
Customer: ${customerMessage}

---

## ORDER COLLECTION FLOW

Follow this exact sequence. Only ask what is missing — check history first.

**STEP 1 — Identify products & quantities**
- If customer says "চাল লাগবে" without quantity → ask "কত কেজি চাল লাগবে ভাই?"
- If customer gives product + quantity → confirm and ask "আর কিছু লাগবে?"
- Support multiple products — build a cart
- Allow customer to add/remove/change quantity

**STEP 2 — When customer says no more products**
Ask: "ঠিক আছে ভাই। ডেলিভারির ঠিকানাটা দিবেন?"

**STEP 3 — Collect address**
After getting address → ask: "আপনার মোবাইল নাম্বারটা দিবেন?"

**STEP 4 — Collect phone**
After getting phone → show full order summary and ask for confirmation:

"ধন্যবাদ ভাই। আপনার অর্ডার সংক্ষেপে:

[list products here]

ঠিকানা: [address]
মোবাইল: [phone]

অর্ডার কনফার্ম করবো?"

**STEP 5 — Confirmation**
If customer says "হ্যাঁ / জি / confirm / ok / ঠিক আছে" → place the order (fill the order JSON)
Reply: "জি ভাই। আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। দোকানদার শীঘ্রই যোগাযোগ করবেন।"

---

## IMPORTANT RULES
- Check conversation history — never ask for info already given
- Once order is confirmed (SB number in history) → do NOT create another order unless customer explicitly orders a new/different product
- Never say "আগের অর্ডারের সাথে যোগ করে দিচ্ছি"
- "thanks / ধন্যবাদ / ok" after order → reply: "ধন্যবাদ ভাই, আর কিছু লাগলে জানাবেন।" with order: null
- Product not in list → "দুঃখিত ভাই, এই পণ্যটা আমাদের কাছে নেই।"

---

## RESPONSE FORMAT — return ONLY valid JSON, nothing else:

Normal reply (no order yet):
{"reply":"...","order":null,"items":null,"handoff":false,"quick_replies":["option1","option2"]}

Single product order confirmed:
{"reply":"জি ভাই। আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।","order":{"product_name":"পণ্যের নাম","quantity":1,"customer_name":"নাম","customer_phone":"01XXXXXXXXX","customer_address":"ঠিকানা","notes":""},"items":null,"handoff":false,"quick_replies":[]}

Multiple products order confirmed:
{"reply":"জি ভাই। আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।","order":null,"items":[{"product_name":"চাল","quantity":5},{"product_name":"চিনি","quantity":2}],"customer_name":"নাম","customer_phone":"01XXXXXXXXX","customer_address":"ঠিকানা","handoff":false,"quick_replies":[]}

Handoff to owner:
{"reply":"ঠিক আছে ভাই, মালিককে জানাচ্ছি। কিছুক্ষণ অপেক্ষা করুন।","order":null,"items":null,"handoff":true,"quick_replies":[]}`
}

const ACK_MESSAGES = [
  'জি ভাই',
  'হ্যাঁ ভাই',
  'আচ্ছা ভাই',
  'জি, একটু দেখছি',
  'হ্যাঁ, এক সেকেন্ড',
  'ঠিক আছে ভাই',
  'জি আপু',
  'হ্যাঁ আপু, একটু দেখছি',
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

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
    const { data: conv } = await supabase
      .from('conversations')
      .select('shop_id, owner_id, ai_paused')
      .eq('id', conversation_id)
      .single()

    if (!conv?.shop_id) return res.status(200).json({ skipped: 'no shop_id' })

    if (sender_id === conv.owner_id) {
      if (conv.ai_paused) {
        await supabase.from('conversations').update({ ai_paused: false }).eq('id', conversation_id)
      }
      return res.status(200).json({ skipped: 'owner message' })
    }

    if (conv.ai_paused) return res.status(200).json({ skipped: 'ai paused' })

    const { data: shop } = await supabase
      .from('shops')
      .select('id, shop_name, owner_id, auto_reply_enabled, ai_persona')
      .eq('id', conv.shop_id)
      .single()

    if (!shop) return res.status(200).json({ skipped: 'shop not found' })
    if (!shop.auto_reply_enabled) return res.status(200).json({ skipped: 'disabled' })

    const { data: products } = await supabase
      .from('products')
      .select('name, price, description')
      .eq('shop_id', shop.id)
      .limit(60)

    const productList = products?.length
      ? products.map((p, i) => `${i + 1}. ${p.name} — ৳${p.price}${p.description ? ` (${p.description})` : ''}`).join('\n')
      : ''

    const { data: recentMsgs } = await supabase
      .from('messages')
      .select('sender_id, content, is_ai')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(20)

    const msgs = (recentMsgs || []).reverse()
    const chatHistory = msgs
      .map(m => m.sender_id === conv.owner_id ? `বিক্রয়কর্মী: ${m.content}` : `Customer: ${m.content}`)
      .join('\n')

    const lastAiMsg = msgs.filter(m => m.sender_id === conv.owner_id && m.is_ai).pop()
    const lastAiReply = lastAiMsg?.content || ''

    const promptText = buildPrompt({
      shopName: shop.shop_name,
      productList,
      chatHistory,
      customerMessage: content,
      lastAiReply,
      aiPersona: shop.ai_persona || '',
    })

    // ── Human delay: send acknowledgment first ──
    const ack = ACK_MESSAGES[Math.floor(Math.random() * ACK_MESSAGES.length)]
    await supabase.from('messages').insert({
      conversation_id,
      sender_id: shop.owner_id,
      content: ack,
      is_ai: true,
    })
    await sleep(1500 + Math.random() * 2000) // 1.5s – 3.5s

    const { result } = await generate(promptText)

    let reply, order, items, customerName, customerPhone, customerAddress, quickReplies, handoff
    try {
      const parsed = parseJson(result)
      reply = parsed.reply
      order = parsed.order       // single product
      items = parsed.items       // multiple products array
      customerName = parsed.customer_name
      customerPhone = parsed.customer_phone
      customerAddress = parsed.customer_address
      quickReplies = parsed.quick_replies?.length ? parsed.quick_replies : null
      handoff = !!parsed.handoff
    } catch {
      reply = result.slice(0, 500)
    }

    if (!reply) return res.status(200).json({ skipped: 'no reply' })

    if (handoff) {
      await supabase.from('conversations').update({ ai_paused: true }).eq('id', conversation_id)
    }

    // ── Create order(s) ──
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    // Single product order
    if (order?.product_name && order?.customer_name && order?.customer_phone && order?.customer_address) {
      const { data: dup } = await supabase
        .from('orders').select('order_number')
        .eq('shop_id', shop.id)
        .eq('customer_phone', order.customer_phone)
        .ilike('product_name', `%${order.product_name.slice(0, 8)}%`)
        .gte('created_at', fiveMinsAgo)
        .maybeSingle()

      if (dup) {
        reply = `ঠিক আছে ভাই, আপনার অর্ডার আগেই নেওয়া হয়েছে (${dup.order_number})। শীঘ্রই যোগাযোগ করব।`
      } else {
        const matched = products?.find(p => p.name?.toLowerCase().includes(order.product_name.toLowerCase().slice(0, 6)))
        const total = (matched?.price || 0) * (order.quantity || 1)
        const { data: created } = await supabase.from('orders').insert({
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
        if (created?.order_number) {
          reply = `${reply} (অর্ডার নং: ${created.order_number})`
        }
      }
    }

    // Multiple products order
    if (items?.length && customerPhone && customerAddress) {
      const { data: dup } = await supabase
        .from('orders').select('order_number')
        .eq('shop_id', shop.id)
        .eq('customer_phone', customerPhone)
        .gte('created_at', fiveMinsAgo)
        .maybeSingle()

      if (dup) {
        reply = `ঠিক আছে ভাই, আপনার অর্ডার আগেই নেওয়া হয়েছে (${dup.order_number})। শীঘ্রই যোগাযোগ করব।`
      } else {
        // Insert one combined order with all items in notes
        const productSummary = items.map(it => `${it.product_name} x${it.quantity || 1}`).join(', ')
        const firstProduct = items[0]
        const matched = products?.find(p => p.name?.toLowerCase().includes(firstProduct.product_name?.toLowerCase().slice(0, 6)))
        const total = items.reduce((sum, it) => {
          const p = products?.find(pr => pr.name?.toLowerCase().includes(it.product_name?.toLowerCase().slice(0, 6)))
          return sum + (p?.price || 0) * (it.quantity || 1)
        }, 0)

        const { data: created } = await supabase.from('orders').insert({
          shop_id: shop.id,
          product_name: firstProduct.product_name,
          quantity: firstProduct.quantity || 1,
          total,
          customer_name: customerName || '',
          customer_phone: customerPhone,
          customer_address: customerAddress,
          notes: `পণ্য তালিকা: ${productSummary}`,
          status: 'pending',
        }).select('order_number').single()

        if (created?.order_number) {
          reply = `${reply} (অর্ডার নং: ${created.order_number})`
        }
      }
    }

    await supabase.from('messages').insert({
      conversation_id,
      sender_id: shop.owner_id,
      content: reply,
      is_ai: true,
      ...(quickReplies ? { quick_replies: quickReplies } : {}),
    })

    await supabase.from('conversations')
      .update({ last_message: reply, last_message_at: new Date().toISOString() })
      .eq('id', conversation_id)

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[auto-reply] error:', err)
    return res.status(500).json({ error: err.message })
  }
}
