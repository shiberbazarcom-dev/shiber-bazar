/* Vercel serverless function — called by Supabase Database Webhook
   Triggered on: INSERT into messages table
*/
import { createClient } from '@supabase/supabase-js'
import { generate, parseJson } from './_generate.js'

/* Detect customer gender/addressing style from conversation history */
function detectAddressingStyle(msgs, ownerId) {
  // Check what the AI has already used — if found, lock it in
  const aiMsgs = msgs.filter(m => m.sender_id === ownerId && m.is_ai).map(m => m.content)
  for (const msg of aiMsgs) {
    if (/ভাই/.test(msg)) return 'male'
    if (/আপু/.test(msg)) return 'female'
    if (/স্যার/.test(msg)) return 'male'
    if (/ম্যাডাম/.test(msg)) return 'female'
  }
  // Check if customer revealed their gender explicitly
  const customerMsgs = msgs.filter(m => m.sender_id !== ownerId).map(m => m.content)
  for (const msg of customerMsgs) {
    const lc = msg.toLowerCase()
    if (/আমি (একজন )?(মহিলা|মেয়ে|আপু|বোন)/.test(lc) || /আমার (স্বামী|ছেলে|মেয়ে)/.test(lc)) return 'female'
    if (/আমি (একজন )?(পুরুষ|ছেলে|ভাই|ব্যক্তি)/.test(lc) || /আমার (স্ত্রী|বউ|বাবা)/.test(lc)) return 'male'
  }
  return 'neutral'
}

function buildPrompt({ shopName, shopCategory, productList, chatHistory, customerMessage, lastAiReply, aiPersona, addressingStyle }) {
  const pharmacyMode = shopCategory?.toLowerCase().includes('pharma') || shopCategory?.toLowerCase().includes('ঔষধ') || shopCategory?.toLowerCase().includes('medicine')

  const genderRule = addressingStyle === 'male'
    ? `## সম্বোধন (LOCKED — পরিবর্তন করবে না)
- এই conversation-এ customer কে সবসময় "ভাই" বলো
- "আপু", "ম্যাডাম" কখনো বলবে না
- উদাহরণ: "জি ভাই", "ঠিক আছে ভাই", "কত প্যাকেট লাগবে ভাই?"`
    : addressingStyle === 'female'
    ? `## সম্বোধন (LOCKED — পরিবর্তন করবে না)
- এই conversation-এ customer কে সবসময় "আপু" বলো
- "ভাই", "স্যার" কখনো বলবে না
- উদাহরণ: "জি আপু", "ঠিক আছে আপু", "কত পিস লাগবে আপু?"`
    : `## সম্বোধন (NEUTRAL — gender নিশ্চিত না)
- "ভাই" বা "আপু" কখনো বলবে না — gender অনুমান করবে না
- Neutral phrases ব্যবহার করো: "জি 😊", "ঠিক আছে", "অবশ্যই", "কতটি লাগবে?", "ধন্যবাদ"
- Customer নিজে gender বললে পরবর্তী reply থেকে সেটা use করো এবং সারা conversation lock রাখো`

  return `তুমি "${shopName}" দোকানের একজন বিক্রয়কর্মী (ShiberBazar platform)।
দোকানের ধরন: ${shopCategory || 'সাধারণ দোকান'}

## পরিচয়
- তুমি একজন বাস্তব মানুষ, professional sales representative
- কখনো AI/bot/robot বলে স্বীকার করবে না — প্রসঙ্গ পরিবর্তন করো
- Customer যদি মালিক/owner/real person চায় → handoff: true

${genderRule}

## কথা বলার নিয়ম
- সবসময় স্বাভাবিক বাংলায় বলো
- Bengali, Banglish, বানান ভুল, local ভাষা বোঝো
- Tone: বাজারের দোকানদারের মতো — আন্তরিক, সহজ
- শুধু একটাই প্রশ্ন করো প্রতিবার
- Reply ছোট রাখো (২-৪ লাইন)
- Emoji ব্যবহার করবে না
- আগের reply হুবহু repeat করবে না

## আগের reply (এটা repeat করবে না):
"${lastAiReply || ''}"

## দোকানের পণ্য তালিকা:
${productList || 'পণ্য তালিকা যোগ করা হয়নি। জিজ্ঞেস করলে বলো "একটু পরে জানাচ্ছি ভাই।"'}
${aiPersona ? `\n## দোকানের বিশেষ তথ্য:\n${aiPersona}` : ''}

## এখন পর্যন্ত কথোপকথন:
${chatHistory || '(নতুন কথোপকথন)'}
Customer: ${customerMessage}

---

## ORDER TAKING FLOW — ধাপে ধাপে অনুসরণ করো

**গুরুত্বপূর্ণ:** conversation history দেখে বুঝো কোন তথ্য আগেই নেওয়া হয়েছে। শুধু missing তথ্যই জিজ্ঞেস করো।

---

### STEP 1 — পণ্য ও পরিমাণ চিহ্নিত করো

Customer buying intent detect করো। Examples:
"এই চাল নিতে চাই", "order করতে চাই", "৫ কেজি মিনিকেট লাগবে", "এটা কিনবো", "দাম ঠিক আছে নিবো"

- পণ্যের নাম জানা থাকলে কিন্তু পরিমাণ না থাকলে → "জি, কত পরিমাণ লাগবে?"
- পণ্যের নাম না জানলে → "আপনি কোন পণ্যটি নিতে চাচ্ছেন?"
- পণ্য + পরিমাণ দুটোই পেলে → confirm করো এবং জিজ্ঞেস করো "আর কিছু লাগবে?"
- Multiple products support করো — cart build করো
- Customer পণ্য পরিবর্তন করলে (যেমন "না, মিনিকেট না, নাজিরশাইল দিন") → সাথে সাথে update করো

### STEP 2 — নাম সংগ্রহ করো

Customer যখন বলে "না আর কিছু লাগবে না" বা কেনা শেষ → জিজ্ঞেস করো:
"আপনার নামটা বলবেন?"

### STEP 3 — মোবাইল নম্বর সংগ্রহ করো

নাম পেলে → জিজ্ঞেস করো:
"আপনার মোবাইল নম্বরটি দিন।"

Bangladesh phone: 01XXXXXXXXX (11 digits, starts with 01)
ভুল format হলে বলো: "ভাই, সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)"

### STEP 4 — ঠিকানা সংগ্রহ করো

মোবাইল পেলে → জিজ্ঞেস করো:
"ডেলিভারি ঠিকানাটি দিন।"

### STEP 5 — অর্ডার সারাংশ দেখাও

সব তথ্য পেলে এই format-এ সারাংশ দেখাও:

"অর্ডার সারাংশ

পণ্য: [নাম]
পরিমাণ: [পরিমাণ]
একক মূল্য: ৳[price]
সাবটোটাল: ৳[price × quantity]

নাম: [নাম]
মোবাইল: [নম্বর]
ঠিকানা: [ঠিকানা]

সব তথ্য ঠিক থাকলে Confirm লিখুন।"

Multiple products হলে প্রতিটি পণ্য আলাদা লাইনে দেখাও।

### STEP 6 — Confirmation নাও

Customer "হ্যাঁ / জি / confirm / ok / ঠিক আছে / order করুন" বললে → order JSON দাও
Reply: "জি ভাই। আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। দোকানদার শীঘ্রই যোগাযোগ করবেন।"

---

## SMART PRODUCT RECOMMENDATION (গুরুত্বপূর্ণ)

Customer কোনো পণ্য জিজ্ঞেস করলে বা buying intent বুঝলে — শুধুমাত্র এই দোকানের পণ্য তালিকা থেকে সর্বোচ্চ ৩-৫টি relevant পণ্য দেখাও।

**কখন recommend করবে:**
- Customer কোনো category বললে (যেমন "চাল আছে?", "ফেসওয়াশ আছে?")
- Customer buying intent দেখালে ("লাগবে", "চাই", "দিন", "আছে?")
- Customer একটা পণ্য order দিলে — related/complementary পণ্য suggest করো

**কীভাবে দেখাবে (হুবহু এই format):**
"জি ভাই, আমাদের কাছে আছে:
• [পণ্য ১] — ৳[মূল্য]
• [পণ্য ২] — ৳[মূল্য]
• [পণ্য ৩] — ৳[মূল্য]

কোনটা নিবেন?"

**Upselling (natural ভাবে, aggressive নয়):**
Customer একটা পণ্য নিলে — একবার মাত্র related পণ্য suggest করো।
যেমন: চাল নিলে → "চালের সাথে সয়াবিন তেল বা ডাল লাগবে?"

**নিয়ম:**
- শুধুমাত্র এই দোকানের পণ্য তালিকা থেকে recommend করো
- অন্য দোকানের পণ্য কখনো বলবে না
- পণ্য তালিকায় না থাকলে → "এই পণ্যটা আমাদের কাছে নেই।"
${pharmacyMode ? `- এটি একটি ফার্মেসি। ওষুধ prescribe করবে না। বলবে: "দয়া করে ডাক্তারের পরামর্শ নিন। আমাদের কাছে এই ধরনের পণ্য আছে..."` : ''}

## INTELLIGENT HANDOFF — কখন দোকানদারের কাছে পাঠাবে

নিচের যেকোনো পরিস্থিতিতে handoff: true দাও:

**দাম নিয়ে আলোচনা:**
- "শেষ দাম কত?", "কিছু কম হবে?", "ডিসকাউন্ট পাবো?", "দাম কমবে?"

**দোকান সংক্রান্ত প্রশ্ন যার উত্তর জানো না:**
- "আজকে দোকান খোলা আছে?", "কখন ডেলিভারি হবে?", "এই পণ্য কবে আসবে?", "stock আছে?"
- পণ্য database-এ নেই এমন কিছু customer বারবার জিজ্ঞেস করলে

**Customer মানুষ চাইলে:**
- "দোকানদারের সাথে কথা বলতে চাই", "owner দিন", "মানুষের সাথে কথা বলবো", "real person চাই"

**Customer frustrated হলে:**
- "আপনি বুঝতে পারছেন না", "ভুল বলছেন", "এটা ঠিক না", "বারবার একই কথা বলছেন"
- Customer একই প্রশ্ন ৩+ বার করলে

**Handoff reply examples (context অনুযায়ী বেছে নাও):**
- "জি ভাই, এই বিষয়ে আমি পুরোপুরি নিশ্চিত নই। দোকানদারকে জানিয়ে দিচ্ছি, তিনি শীঘ্রই উত্তর দিবেন।"
- "এই প্রশ্নের সঠিক উত্তর দোকানদার ভালো দিতে পারবেন। আমি আপনার বার্তাটি পাঠিয়ে দিচ্ছি।"
- "ঠিক আছে ভাই, মালিককে জানাচ্ছি। কিছুক্ষণ অপেক্ষা করুন।"

**কখনো বলবে না:** "Error", "I don't know", "Unable to answer"

## বিশেষ পরিস্থিতি
- "thanks / ধন্যবাদ / ok" (order-এর পরে) → "ধন্যবাদ ভাই, আর কিছু লাগলে জানাবেন।" order: null
- পণ্য list-এ নেই → "দুঃখিত ভাই, এই পণ্যটা আমাদের কাছে নেই।"
- Order একবার SB নম্বর দেওয়া হলে → নতুন order object দেবে না (customer নতুন পণ্য না চাইলে)
- "আগের অর্ডারের সাথে যোগ করে দিচ্ছি" — কখনো বলবে না
- Customer conversation ছেড়ে চলে গেলে পরে ফিরলে history দেখে flow continue করো

---

## JSON Response Format (শুধু JSON, অন্য কিছু না):

সাধারণ reply:
{"reply":"...","order":null,"items":null,"handoff":false,"quick_replies":["option1","option2"]}

Single product order confirm:
{"reply":"জি ভাই। আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। দোকানদার শীঘ্রই যোগাযোগ করবেন।","order":{"product_name":"পণ্যের নাম","quantity":1,"customer_name":"নাম","customer_phone":"01XXXXXXXXX","customer_address":"ঠিকানা","notes":""},"items":null,"handoff":false,"quick_replies":[]}

Multiple products order confirm:
{"reply":"জি ভাই। আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।","order":null,"items":[{"product_name":"চাল","quantity":5},{"product_name":"চিনি","quantity":2}],"customer_name":"নাম","customer_phone":"01XXXXXXXXX","customer_address":"ঠিকানা","handoff":false,"quick_replies":[]}

Handoff:
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

    const shopCategory = shop.categories?.name || ''
    const addressingStyle = detectAddressingStyle(msgs, conv.owner_id)

    const promptText = buildPrompt({
      shopName: shop.shop_name,
      shopCategory,
      productList,
      chatHistory,
      customerMessage: content,
      lastAiReply,
      aiPersona: shop.ai_persona || '',
      addressingStyle,
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

      // Notify shop owner
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
