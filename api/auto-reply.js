/* Vercel serverless function — called by Supabase Database Webhook
   Triggered on: INSERT into messages table
*/
import { createClient } from '@supabase/supabase-js'
import { generate, parseJson } from './_generate.js'

/* ── Gender detection: ONLY from explicit customer statement ── */
function detectAddressingStyle(msgs, ownerId) {
  const customerMsgs = msgs.filter(m => m.sender_id !== ownerId).map(m => m.content)
  for (const msg of customerMsgs) {
    const lc = msg
    if (/আমি\s*(একজন\s*)?(মহিলা|মেয়ে|আপু|বোন)|আমার\s*(স্বামী|ছেলে সন্তান)/.test(lc)) return 'female'
    if (/আমি\s*(একজন\s*)?(পুরুষ|ছেলে|ভাই মানুষ)|আমার\s*(স্ত্রী|বউ)/.test(lc)) return 'male'
  }
  return 'neutral' // DEFAULT — never guess from name
}

/* ── Parse conversation to extract already-collected order info ── */
function extractCollectedInfo(msgs, ownerId) {
  const info = { name: null, phone: null, address: null, hasOrderConfirmed: false }
  const allText = msgs.map(m => m.content).join('\n')

  // If SB order number exists — order already placed
  if (/\bSB\d+\b/.test(allText)) {
    info.hasOrderConfirmed = true
    return info
  }

  // Extract phone from customer messages
  for (const msg of msgs.filter(m => m.sender_id !== ownerId)) {
    const phone = msg.content.match(/01[3-9]\d{8}/)
    if (phone) { info.phone = phone[0]; break }
  }

  return info
}

function buildPrompt({ shopName, shopCategory, productList, chatHistory, customerMessage, lastAiReply, aiPersona, addressingStyle, collectedInfo }) {
  const pharmacyMode = /pharma|ঔষধ|medicine|pharmacy/i.test(shopCategory || '')

  const addressRule = addressingStyle === 'male'
    ? '- এই conversation-এ customer কে "ভাই" বলো (customer নিজে male বলেছেন)'
    : addressingStyle === 'female'
    ? '- এই conversation-এ customer কে "আপু" বলো (customer নিজে female বলেছেন)'
    : `- কখনো "ভাই" বা "আপু" বলবে না — gender জানা নেই, guess করবে না
- Neutral শব্দ ব্যবহার করো: "জি", "ঠিক আছে", "বুঝতে পেরেছি", "অবশ্যই", "ধন্যবাদ", "নিশ্চয়ই"`

  const variedStarters = `
## NATURAL TRANSITIONS — প্রতিটি reply আলাদা
❌ কখনো শুধু "জি" দিয়ে reply শুরু করবে না
❌ একই opener দুইবার ব্যবহার করবে না

✅ Use these naturally based on context:
তথ্য পেলে: "বুঝতে পেরেছি।", "ধন্যবাদ, তথ্যটি নোট করলাম।", "চমৎকার।", "ঠিক আছে, নোট করলাম।"
পরের তথ্য চাইতে: "ঠিক আছে, পরের তথ্যটি দিন।", "এখন একটু বলুন —", "সব তথ্য প্রায় হয়ে এল।"
সব পেলে: "সব তথ্য পাওয়া গেছে।", "অর্ডারটি প্রস্তুত করছি।"
সাহায্যে: "অবশ্যই।", "নিশ্চয়ই।", "হ্যাঁ, বলুন।"

আগের reply যদি "বুঝতে পেরেছি" দিয়ে শুরু হয় → পরেরটা ভিন্ন opener দাও।`

  const alreadyHave = []
  if (collectedInfo.phone) alreadyHave.push(`ফোন: ${collectedInfo.phone}`)

  return `তুমি "${shopName}" দোকানের একজন বিক্রয়কর্মী।
দোকানের ধরন: ${shopCategory || 'সাধারণ দোকান'}

## পরিচয়
- তুমি একজন বাস্তব মানুষ — কখনো AI/bot বলে স্বীকার করবে না
- Customer মালিক/real person চাইলে → handoff: true

## সম্বোধন নিয়ম
${addressRule}

${variedStarters}

## কথা বলার নিয়ম
- সহজ স্বাভাবিক বাংলায় কথা বলো
- Bengali, Banglish, বানান ভুল সব বোঝো
- Reply ছোট রাখো (২-৪ লাইন), শুধু একটা প্রশ্ন করো
- Emoji ব্যবহার করবে না
- আগের reply হুবহু repeat করবে না

## আগের reply (এটা repeat করবে না):
"${lastAiReply || ''}"

${alreadyHave.length ? `## ইতিমধ্যে সংগ্রহ করা তথ্য:\n${alreadyHave.join('\n')}` : ''}

## দোকানের পণ্য তালিকা:
${productList || 'পণ্য তালিকা পাওয়া যায়নি। জিজ্ঞেস করলে বলো "একটু পরে জানাচ্ছি।"'}
${aiPersona ? `\n## দোকানের বিশেষ তথ্য:\n${aiPersona}` : ''}

## কথোপকথনের ইতিহাস:
${chatHistory || '(নতুন কথোপকথন)'}
Customer: ${customerMessage}

---

## ORDER FLOW — ধাপ অনুসরণ করো

conversation history দেখো — কোন তথ্য আগেই আছে তা আর জিজ্ঞেস করবে না।

### STEP 1 — পণ্য ও পরিমাণ
Customer কিনতে চাইলে detect করো।
- পরিমাণ না জানলে → "কত পরিমাণ লাগবে?"
- পণ্য না জানলে → "কোন পণ্যটি নিতে চাচ্ছেন?"
- পণ্য + পরিমাণ দুটোই জানলে → নিশ্চিত করো, "আর কিছু লাগবে?"

### STEP 2 — নাম
Customer কেনা শেষ বললে → "আপনার নামটা বলবেন?"

### STEP 3 — মোবাইল
নাম পেলে → "মোবাইল নম্বরটা দিন।"
Valid: 01XXXXXXXXX (11 digits, 01 দিয়ে শুরু)
Invalid হলে → "সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)"

### STEP 4 — ঠিকানা ⚠️ IMPORTANT
মোবাইল পেলে → "ডেলিভারি ঠিকানা দিন।"

**যেকোনো location text গ্রহণ করো — কোনো strict format নেই:**
✅ "শিবের বাজার" → accept
✅ "shiber bazar sylhet" → accept
✅ "হাটফলা ইউনিয়ন" → accept
✅ "দক্ষিণ সুরমা" → accept
✅ "ঢাকা" → accept
✅ "mirpur 10" → accept

Customer যা বলুক — একটি word-ও address হিসেবে গ্রহণ করো।
**আর ঠিকানা জিজ্ঞেস করবে না।** একবার পেলেই STEP 5-এ যাও।

### STEP 5 — অর্ডার সারাংশ
সব তথ্য পেলে এই format দেখাও:

"অর্ডার সারাংশ:

পণ্য: [নাম] × [পরিমাণ] = ৳[subtotal]
মোট: ৳[total]

নাম: [নাম]
মোবাইল: [নম্বর]
ঠিকানা: [ঠিকানা]

সব ঠিক থাকলে 'Confirm' লিখুন।"

### STEP 6 — Confirmation
Customer "confirm / হ্যাঁ / জি / ok / ঠিক আছে / order করুন / yes" বললে → order JSON তৈরি করো।

**CRITICAL:** order JSON-এ সব field অবশ্যই দিতে হবে:
- product_name, quantity, customer_name, customer_phone, customer_address সব required

---

## পণ্য recommendation
Customer পণ্য চাইলে শুধু এই দোকানের list থেকে দেখাও:
"আমাদের কাছে আছে:
• [পণ্য ১] — ৳[মূল্য]
• [পণ্য ২] — ৳[মূল্য]

কোনটা নেবেন?"
${pharmacyMode ? '\n⚠️ ফার্মেসি: ওষুধ prescribe করবে না। বলবে "দয়া করে ডাক্তারের পরামর্শ নিন।"' : ''}

## Handoff trigger
এই পরিস্থিতিতে handoff: true দাও:
- "দাম কমবে?", "ডিসকাউন্ট?", "শেষ দাম?"
- "দোকান কখন খোলা?", "stock আছে?", "কবে পাবো?"
- "মালিকের সাথে কথা বলবো", "real person চাই"
- Customer ৩+ বার একই প্রশ্ন করলে বা frustrated হলে

## বিশেষ নিয়ম
- Thanks/ধন্যবাদ (order-এর পরে) → "ধন্যবাদ, আর কিছু লাগলে জানাবেন।" order: null
- পণ্য list-এ নেই → "দুঃখিত, এই পণ্যটি আমাদের কাছে নেই।"
- History-তে SB নম্বর আছে → নতুন order JSON দেবে না (customer নতুন পণ্য না চাইলে)

---

## JSON Response Format (শুধু JSON দেবে):

সাধারণ reply:
{"reply":"...","order":null,"items":null,"handoff":false,"quick_replies":["option1","option2"]}

Single product order (সব field required):
{"reply":"ধন্যবাদ, অর্ডার নিশ্চিত হচ্ছে...","order":{"product_name":"পণ্যের নাম","quantity":2,"customer_name":"নাম","customer_phone":"01XXXXXXXXX","customer_address":"ঠিকানা","notes":""},"items":null,"handoff":false,"quick_replies":[]}

Multiple products:
{"reply":"ধন্যবাদ, অর্ডার নিশ্চিত হচ্ছে...","order":null,"items":[{"product_name":"চাল","quantity":5},{"product_name":"তেল","quantity":2}],"customer_name":"নাম","customer_phone":"01XXXXXXXXX","customer_address":"ঠিকানা","handoff":false,"quick_replies":[]}

Handoff:
{"reply":"এই বিষয়ে দোকানদার ভালো বলতে পারবেন, এখনই জানাচ্ছি।","order":null,"items":null,"handoff":true,"quick_replies":[]}`
}

/* ── Neutral acknowledgment messages — varied, no gender, no repetitive "জি" ── */
const ACK_MESSAGES = [
  'ঠিক আছে, একটু দেখছি',
  'বুঝতে পেরেছি',
  'অবশ্যই, এক মুহূর্ত',
  'আচ্ছা, একটু সময় দিন',
  'ধন্যবাদ জানানোর জন্য',
  'নিশ্চয়ই, দেখছি',
  'হ্যাঁ, এক সেকেন্ড',
  'চমৎকার, দেখছি',
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

/* ── Robust product name matching (handles spelling variations) ── */
function findProduct(products, orderProductName) {
  if (!products?.length || !orderProductName) return null
  const norm = s => s?.toLowerCase().replace(/[^ঀ-৿A-za-z0-9]/g, '').trim()
  const target = norm(orderProductName)
  if (!target) return null

  // 1. Exact normalized match
  let match = products.find(p => norm(p.name) === target)
  if (match) return match

  // 2. Product list name contains the order name (first 8 chars)
  const prefix8 = target.slice(0, 8)
  if (prefix8.length >= 4) {
    match = products.find(p => norm(p.name)?.includes(prefix8))
    if (match) return match
  }

  // 3. Order name contains product list name (first 8 chars)
  match = products.find(p => {
    const pn = norm(p.name)
    return pn?.length >= 4 && target.includes(pn.slice(0, 8))
  })
  if (match) return match

  // 4. First 4 characters match (loose fallback)
  const prefix4 = target.slice(0, 4)
  if (prefix4.length === 4) {
    match = products.find(p => norm(p.name)?.startsWith(prefix4))
  }
  return match || null
}

/* ── Format beautiful order confirmation message ── */
function formatOrderConfirmation({ orderNumber, shopName, productName, quantity, total, customerName, customerPhone, customerAddress }) {
  return `✅ অর্ডার সফলভাবে গ্রহণ করা হয়েছে

অর্ডার নং: ${orderNumber}
দোকান: ${shopName}

পণ্য: ${productName}
পরিমাণ: ${quantity}
মোট মূল্য: ৳${total}

নাম: ${customerName}
ফোন: ${customerPhone}
ঠিকানা: ${customerAddress}

স্ট্যাটাস: Pending ⏳
দোকানদার শীঘ্রই যোগাযোগ করবেন।`
}

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

    // Owner reply → resume AI if paused
    if (sender_id === conv.owner_id) {
      if (conv.ai_paused) {
        await supabase.from('conversations').update({ ai_paused: false }).eq('id', conversation_id)
      }
      return res.status(200).json({ skipped: 'owner message' })
    }

    if (conv.ai_paused) return res.status(200).json({ skipped: 'ai paused' })

    const { data: shop } = await supabase
      .from('shops')
      .select('id, shop_name, owner_id, auto_reply_enabled, ai_persona, categories(name)')
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
      .select('sender_id, content, is_ai, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(24)

    const msgs = (recentMsgs || []).reverse()

    const chatHistory = msgs
      .map(m => m.sender_id === conv.owner_id ? `বিক্রয়কর্মী: ${m.content}` : `Customer: ${m.content}`)
      .join('\n')

    const lastAiMsg = msgs.filter(m => m.sender_id === conv.owner_id && m.is_ai).pop()
    const lastAiReply = lastAiMsg?.content || ''

    const shopCategory = shop.categories?.name || ''
    const addressingStyle = detectAddressingStyle(msgs, conv.owner_id)
    const collectedInfo = extractCollectedInfo(msgs, conv.owner_id)

    // If order already confirmed in this conversation, skip
    if (collectedInfo.hasOrderConfirmed) {
      // Still reply, just don't create another order
    }

    const promptText = buildPrompt({
      shopName: shop.shop_name,
      shopCategory,
      productList,
      chatHistory,
      customerMessage: content,
      lastAiReply,
      aiPersona: shop.ai_persona || '',
      addressingStyle,
      collectedInfo,
    })

    // ── Human delay: ACK first ──
    const ack = ACK_MESSAGES[Math.floor(Math.random() * ACK_MESSAGES.length)]
    await supabase.from('messages').insert({
      conversation_id,
      sender_id: shop.owner_id,
      content: ack,
      is_ai: true,
    })
    await supabase.from('conversations')
      .update({ last_message: ack, last_message_at: new Date().toISOString() })
      .eq('id', conversation_id)

    await sleep(1500 + Math.random() * 2000)

    const { result } = await generate(promptText)

    let reply, order, items, customerName, customerPhone, customerAddress, quickReplies, handoff
    try {
      const parsed = parseJson(result)
      reply = parsed.reply
      order = parsed.order
      items = parsed.items
      customerName = parsed.customer_name
      customerPhone = parsed.customer_phone
      customerAddress = parsed.customer_address
      quickReplies = parsed.quick_replies?.length ? parsed.quick_replies : null
      handoff = !!parsed.handoff
    } catch {
      reply = result.slice(0, 600)
    }

    if (!reply) return res.status(200).json({ skipped: 'no reply' })

    // ── Handoff ──
    if (handoff) {
      await supabase.from('conversations').update({ ai_paused: true }).eq('id', conversation_id)
      const recentContext = msgs.slice(-4)
        .map(m => m.sender_id === conv.owner_id ? `দোকান: ${m.content}` : `Customer: ${m.content}`)
        .join('\n')
      await supabase.from('notifications').insert({
        user_id: shop.owner_id,
        type: 'customer_needs_help',
        title: 'একজন কাস্টমার সাহায্য চাইছেন',
        message: `"${content.slice(0, 120)}"`,
        data: { conversation_id, customer_message: content, context: recentContext },
      })
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    // ── Guard: if an order was already confirmed in this conversation, block new order ──
    if (collectedInfo.hasOrderConfirmed && (order || items?.length)) {
      reply = 'আপনার অর্ডার আগেই নেওয়া হয়েছে। নতুন পণ্য অর্ডার করতে চাইলে বলুন।'
      order = null
      items = null
    }

    // ── Single product order ──
    if (order?.product_name && order?.customer_name && order?.customer_phone && order?.customer_address) {
      // Duplicate check: same phone + similar product within 5 minutes
      const { data: dup } = await supabase
        .from('orders').select('order_number')
        .eq('shop_id', shop.id)
        .eq('customer_phone', order.customer_phone)
        .ilike('product_name', `%${order.product_name.slice(0, 8)}%`)
        .gte('created_at', fiveMinsAgo)
        .maybeSingle()

      if (dup) {
        reply = `আপনার অর্ডার আগেই নেওয়া হয়েছে (${dup.order_number})। দোকানদার শীঘ্রই যোগাযোগ করবেন।`
      } else {
        const matched = findProduct(products, order.product_name)
        const unitPrice = matched?.price || 0
        const qty = Number(order.quantity) || 1
        const total = unitPrice * qty

        const { data: created, error: insertError } = await supabase.from('orders').insert({
          shop_id: shop.id,
          product_name: order.product_name,
          quantity: qty,
          total,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          notes: order.notes || '',
          status: 'pending',   // admin/owner panels both filter by this
        }).select('order_number, id').single()

        if (insertError || !created?.order_number) {
          // DB insert failed — show error, NOT success
          console.error('[auto-reply] order insert failed:', insertError)
          reply = 'দুঃখিত, এই মুহূর্তে অর্ডার নেওয়া সম্ভব হচ্ছে না। একটু পরে আবার চেষ্টা করুন বা দোকানে সরাসরি যোগাযোগ করুন।'
        } else {
          // ✅ DB confirmed — now show success card
          reply = formatOrderConfirmation({
            orderNumber: created.order_number,
            shopName: shop.shop_name,
            productName: order.product_name,
            quantity: qty,
            total,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            customerAddress: order.customer_address,
          })
          // Notify shop owner of new order
          await supabase.from('notifications').insert({
            user_id: shop.owner_id,
            type: 'new_order',
            title: `নতুন অর্ডার: ${created.order_number}`,
            message: `${order.customer_name} — ${order.product_name} × ${qty} — ৳${total}`,
            data: { conversation_id, order_id: created.id, order_number: created.order_number },
          })
        }
      }
    }

    // ── Multiple products order ──
    if (!collectedInfo.hasOrderConfirmed && items?.length && (customerPhone || order?.customer_phone) && (customerAddress || order?.customer_address)) {
      const phone = customerPhone || order?.customer_phone
      const address = customerAddress || order?.customer_address
      const name = customerName || order?.customer_name || ''

      const { data: dup } = await supabase
        .from('orders').select('order_number')
        .eq('shop_id', shop.id)
        .eq('customer_phone', phone)
        .gte('created_at', fiveMinsAgo)
        .maybeSingle()

      if (dup) {
        reply = `আপনার অর্ডার আগেই নেওয়া হয়েছে (${dup.order_number})। দোকানদার শীঘ্রই যোগাযোগ করবেন।`
      } else {
        const productSummary = items.map(it => `${it.product_name} ×${it.quantity || 1}`).join(', ')
        const firstProduct = items[0]
        const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)
        const total = items.reduce((sum, it) => {
          const p = findProduct(products, it.product_name)
          return sum + (p?.price || 0) * (Number(it.quantity) || 1)
        }, 0)

        const { data: created, error: insertError } = await supabase.from('orders').insert({
          shop_id: shop.id,
          product_name: firstProduct.product_name,
          quantity: Number(firstProduct.quantity) || 1,
          total,
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          notes: `পণ্য: ${productSummary}`,
          status: 'pending',
        }).select('order_number, id').single()

        if (insertError || !created?.order_number) {
          console.error('[auto-reply] multi-order insert failed:', insertError)
          reply = 'দুঃখিত, এই মুহূর্তে অর্ডার নেওয়া সম্ভব হচ্ছে না। একটু পরে আবার চেষ্টা করুন।'
        } else {
          reply = formatOrderConfirmation({
            orderNumber: created.order_number,
            shopName: shop.shop_name,
            productName: productSummary,
            quantity: totalQty,
            total,
            customerName: name,
            customerPhone: phone,
            customerAddress: address,
          })
          await supabase.from('notifications').insert({
            user_id: shop.owner_id,
            type: 'new_order',
            title: `নতুন অর্ডার: ${created.order_number}`,
            message: `${name} — ${productSummary} — ৳${total}`,
            data: { conversation_id, order_id: created.id, order_number: created.order_number },
          })
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
      .update({ last_message: reply.slice(0, 200), last_message_at: new Date().toISOString() })
      .eq('id', conversation_id)

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[auto-reply] error:', err)
    return res.status(500).json({ error: err.message })
  }
}
