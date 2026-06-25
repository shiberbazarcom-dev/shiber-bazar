/* Vercel serverless function — called by Supabase Database Webhook
   Triggered on: INSERT into messages table
*/
import { createClient } from '@supabase/supabase-js'
import { generateDeepSeek, parseJson } from './_generate.js'
import { sendPushToUser } from './_webpush.js'

/* ── Sanitize ai_persona before prompt injection (H3) ───────────────────────
   Strips prompt-injection patterns while preserving normal business text.
   Max 500 chars — sufficient for any legitimate shop description.
──────────────────────────────────────────────────────────────────────────── */
function sanitizePersona(text) {
  if (!text) return ''
  return text
    .slice(0, 500)
    .replace(/ignore\s+(all\s+)?(previous|above|prior|earlier)\s+(rules?|instructions?|prompts?|context)/gi, '')
    .replace(/you\s+are\s+now\s+/gi, '')
    .replace(/forget\s+(everything|all|previous|above)/gi, '')
    .replace(/\b(system|assistant|user)\s*:/gi, '')
    .replace(/new\s+instructions?\s*(override|replace|supersede)?/gi, '')
    .replace(/override\s+(all\s+)?(previous|above|prior)?/gi, '')
    .replace(/disregard\s+(all\s+)?(previous|above|prior)?/gi, '')
    .replace(/^#{1,6}\s/gm, '')
    .replace(/^-{3,}$/gm, '')
    .replace(/^={3,}$/gm, '')
    .trim()
}

/* ── Gender detection: ONLY from explicit customer statement ── */
function detectAddressingStyle(msgs, ownerId) {
  const customerMsgs = msgs.filter(m => m.sender_id !== ownerId).map(m => m.content)
  for (const msg of customerMsgs) {
    const lc = msg
    if (/আমি\s*(একজন\s*)?(মহিলা|মেয়ে|আপু|বোন)|আমার\s*(স্বামী|ছেলে সন্তান)/.test(lc)) return 'female'
    if (/আমি\s*(একজন\s*)?(পুরুষ|ছেলে|ভাই মানুষ)|আমার\s*(স্ত্রী|বউ)/.test(lc)) return 'male'
  }
  return 'neutral'
}

/* ── Server-side intent detection ── */
function detectIntent(content) {
  const t = content.trim().toLowerCase()

  if (/^(hi|hello|হ্যালো|হেলো|হাই|সালাম|আসসালামু|hy|hey|hlw|হ্যা|ola)\b/i.test(t)) return 'greeting'

  if (/মালিক|real person|আসল মানুষ|মানুষের সাথে|owner|দোকানদার|ম্যানেজার/.test(t)) return 'handoff_request'

  if (/কত\s*(দাম|টাকা|মূল্য|price)|দাম\s*(কত|জানতে|বলুন|কি)|মূল্য\s*(কত|জানতে|তালিকা)|price\s*(list|কত)|কত\s*(করে|পড়বে)|rate\s*কত/.test(t)) return 'price_inquiry'

  if (/কী?\s*আছে|কি\s*আছে|কি\s*কি\s*আছে|কী\s*কী\s*আছে|সব\s*পণ্য|পণ্য\s*(দেখ|লিস্ট|তালিকা|দেখান)|product\s*list|কি\s*পাওয়া\s*যায়|কি\s*পাই|কি\s*নিতে\s*পারি|কী\s*নিতে\s*পারি/.test(t)) return 'product_list'

  if (/^(confirm|confirmed|হ্যাঁ|yes|ok|ঠিক আছে|order করুন|অর্ডার করুন|jee|জি|দিন|করুন)\s*$/i.test(t)) return 'confirm'

  if (/অভিযোগ|সমস্যা|নষ্ট|ভুল|রাগ|ক্ষতি|ফেরত|refund|complaint|problem|wrong|damaged/.test(t)) return 'complaint'

  if (/কখন\s*(পাব|আসবে|ডেলিভারি)|delivery\s*(কত|দিন|কবে)|কতদিন|কত\s*দিনে|পৌঁছাবে/.test(t)) return 'delivery_question'

  return 'general'
}

/* ── Extract order context with SB order number boundary reset ── */
function extractOrderContext(msgs, ownerId) {
  // Find the LAST SB order number — everything before it is a completed order session
  let lastSBIndex = -1
  let lastOrderNumber = null
  msgs.forEach((m, i) => {
    const sbMatch = m.content.match(/\b(SB\d+)\b/)
    if (sbMatch) { lastSBIndex = i; lastOrderNumber = sbMatch[1] }
  })

  const hasConfirmedBefore = lastSBIndex >= 0
  // Only look at messages AFTER the last SB confirmation for new order info
  const searchMsgs = hasConfirmedBefore ? msgs.slice(lastSBIndex + 1) : msgs
  const customerMsgs = searchMsgs.filter(m => m.sender_id !== ownerId)
  const aiMsgs = searchMsgs.filter(m => m.sender_id === ownerId && m.is_ai)

  // New order session = there are customer messages after the last SB confirmation
  const isNewOrderSession = hasConfirmedBefore && customerMsgs.length > 0

  let name = null, phone = null, address = null

  // Extract phone from customer messages (in current session only)
  for (const msg of customerMsgs) {
    const phoneMatch = msg.content.match(/01[3-9]\d{8}/)
    if (phoneMatch) { phone = phoneMatch[0]; break }
  }

  // Extract name: AI asked for name → next customer reply
  for (let i = 0; i < aiMsgs.length; i++) {
    if (/নামটা|আপনার নাম|নাম\s*(বলুন|দিন)/i.test(aiMsgs[i].content)) {
      const aiTime = new Date(aiMsgs[i].created_at).getTime()
      const nameMsg = customerMsgs.find(m => new Date(m.created_at).getTime() > aiTime)
      if (nameMsg && nameMsg.content.trim().length <= 30) {
        name = nameMsg.content.trim()
        break
      }
    }
  }

  // Extract address: AI asked for address → next customer reply
  for (let i = 0; i < aiMsgs.length; i++) {
    if (/ঠিকানা\s*(দিন|বলুন)|ডেলিভারি ঠিকানা/i.test(aiMsgs[i].content)) {
      const aiTime = new Date(aiMsgs[i].created_at).getTime()
      const addrMsg = customerMsgs.find(m => new Date(m.created_at).getTime() > aiTime)
      if (addrMsg) { address = addrMsg.content.trim(); break }
    }
  }

  return { name, phone, address, hasConfirmedBefore, isNewOrderSession, lastOrderNumber }
}

/* ── 30+ varied ACK messages — no gender, no repetitive "জি" ── */
const ACK_MESSAGES = [
  'ঠিক আছে, একটু দেখছি',
  'বুঝতে পেরেছি',
  'অবশ্যই, এক মুহূর্ত',
  'আচ্ছা, একটু সময় দিন',
  'নিশ্চয়ই, দেখছি',
  'হ্যাঁ, এক সেকেন্ড',
  'চমৎকার, দেখছি',
  'ঠিক আছে, এক মুহূর্ত',
  'বুঝলাম, দেখছি',
  'আচ্ছা, বুঝতে পেরেছি',
  'ঠিক আছে, নোট করলাম',
  'অবশ্যই, দেখছি',
  'এক মুহূর্ত দিন',
  'আচ্ছা, ঠিক আছে',
  'বুঝেছি, একটু দেখি',
  'ঠিক আছে, চেক করছি',
  'হ্যাঁ, দেখছি',
  'আচ্ছা, এক সেকেন্ড',
  'ঠিক আছে, প্রসেস করছি',
  'বুঝতে পারলাম',
  'অবশ্যই, এক মিনিট',
  'হ্যাঁ, বুঝেছি',
  'আচ্ছা, দেখছি',
  'ঠিক আছে, একটু অপেক্ষা করুন',
  'নিশ্চয়ই, এক মুহূর্ত',
  'বুঝলাম, একটু দেখি',
  'হ্যাঁ, এক মুহূর্ত',
  'আচ্ছা, একটু সময়',
  'ঠিক আছে, দেখছি',
  'অবশ্যই, দেখি',
  'বুঝেছি, দেখছি',
  'হ্যাঁ, দেখি',
]

/* ── Pick ACK avoiding same first word as last AI reply ── */
function pickAck(lastAiReply) {
  const lastFirst = (lastAiReply || '').split(/[\s।,।]/)[0].trim()
  const pool = lastFirst
    ? ACK_MESSAGES.filter(a => a.split(/[\s।,।]/)[0].trim() !== lastFirst)
    : ACK_MESSAGES
  const src = pool.length ? pool : ACK_MESSAGES
  return src[Math.floor(Math.random() * src.length)]
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/* ── Robust product name matching (handles spelling variations) ── */
function findProduct(products, orderProductName) {
  if (!products?.length || !orderProductName) return null
  const norm = s => s?.toLowerCase().replace(/[^ঀ-৿A-za-z0-9]/g, '').trim()
  const target = norm(orderProductName)
  if (!target) return null

  let match = products.find(p => norm(p.name) === target)
  if (match) return match

  const prefix8 = target.slice(0, 8)
  if (prefix8.length >= 4) {
    match = products.find(p => norm(p.name)?.includes(prefix8))
    if (match) return match
  }

  match = products.find(p => {
    const pn = norm(p.name)
    return pn?.length >= 4 && target.includes(pn.slice(0, 8))
  })
  if (match) return match

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

function buildPrompt({ shopName, shopCategory, productList, chatHistory, customerMessage, lastAiReply, aiPersona, addressingStyle, ctx, intent }) {
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

আগের reply যদি "${(lastAiReply || '').split(/[\s।,]/)[0].trim()}" দিয়ে শুরু হয় → পরেরটা ভিন্ন opener দাও।`

  const alreadyHave = []
  if (ctx.name)    alreadyHave.push(`নাম: ${ctx.name}`)
  if (ctx.phone)   alreadyHave.push(`ফোন: ${ctx.phone}`)
  if (ctx.address) alreadyHave.push(`ঠিকানা: ${ctx.address}`)

  const prevOrderNote = ctx.hasConfirmedBefore && ctx.isNewOrderSession
    ? `\n## পূর্ববর্তী অর্ডার\nআগের অর্ডার (${ctx.lastOrderNumber}) সম্পন্ন হয়েছে। এটি একটি নতুন অর্ডার session — নতুনভাবে তথ্য সংগ্রহ করো।\n`
    : ctx.hasConfirmedBefore
    ? `\n## পূর্ববর্তী অর্ডার\nএই কথোপকথনে আগে একটি অর্ডার (${ctx.lastOrderNumber}) নেওয়া হয়েছে। Customer নতুন পণ্য চাইলেই নতুন অর্ডার নাও।\n`
    : ''

  const intentSection = intent === 'greeting'
    ? `## GREETING — এটি একটি সাধারণ অভিবাদন
- Casual, সংক্ষিপ্ত reply দাও (১ লাইন)
- যেমন: "hlw, কী দরকার?" বা "হ্যালো, বলুন কী লাগবে?" বা "হ্যা, কীভাবে সাহায্য করতে পারি?"
- ACK বা "এক সেকেন্ড" টাইপ কিছু বলবে না`
    : intent === 'price_inquiry'
    ? `## PRICE INQUIRY — শুধু দাম জিজ্ঞেস করছে
- শুধু পণ্যের দাম জানাও, order flow শুরু করবে না
- Customer নিজে কিনতে চাইলে তখন STEP 1 শুরু করো
- order: null রাখো`
    : intent === 'complaint'
    ? `## COMPLAINT — Customer সমস্যায় আছেন
- সহানুভূতিশীল হও, প্রথমে apologize করো
- সমস্যাটি বোঝার চেষ্টা করো
- দরকার হলে handoff: true দাও`
    : intent === 'delivery_question'
    ? `## DELIVERY QUESTION — ডেলিভারি সম্পর্কে প্রশ্ন
- যদি জানো তাহলে বলো, না জানলে handoff: true দাও`
    : intent === 'product_list'
    ? `## PRODUCT LIST REQUEST — Customer সব পণ্য দেখতে চাইছে
- সরাসরি পণ্য তালিকা দেখাও, অন্য কোনো প্রশ্ন করবে না
- Format:
"আমাদের কাছে আছে:
• [পণ্য ১] — ৳[মূল্য]
• [পণ্য ২] — ৳[মূল্য]
...
কোনটা নেবেন?"
- order: null রাখো, order flow শুরু করবে না`
    : variedStarters

  return `তুমি "${shopName}" দোকানের একজন বিক্রয়কর্মী।
দোকানের ধরন: ${shopCategory || 'সাধারণ দোকান'}

## পরিচয়
- তুমি একজন বাস্তব মানুষ — কখনো AI/bot বলে স্বীকার করবে না
- Customer মালিক/real person চাইলে → handoff: true

## সম্বোধন নিয়ম
${addressRule}

${intentSection}

## কথা বলার নিয়ম
- সহজ স্বাভাবিক বাংলায় কথা বলো
- Bengali, Banglish, বানান ভুল সব বোঝো
- Reply ছোট রাখো (২-৪ লাইন), শুধু একটা প্রশ্ন করো
- Emoji ব্যবহার করবে না
- আগের reply হুবহু repeat করবে না
- রং, সাইজ, ভেরিয়েন্ট জিজ্ঞেস করবে না — customer নিজে না বললে এগুলো নিয়ে প্রশ্ন করবে না
- পণ্যের নাম ও পরিমাণ পেলেই সরাসরি নাম জিজ্ঞেস করো, অতিরিক্ত প্রশ্ন নয়

## আগের reply (এটা repeat করবে না):
"${lastAiReply || ''}"

${alreadyHave.length ? `## ইতিমধ্যে সংগ্রহ করা তথ্য:\n${alreadyHave.join('\n')}` : ''}
${prevOrderNote}
## দোকানের পণ্য তালিকা:
${productList || 'পণ্য তালিকা পাওয়া যায়নি। জিজ্ঞেস করলে বলো "একটু পরে জানাচ্ছি।"'}
${aiPersona ? `\n## দোকানের বিশেষ তথ্য:\n${sanitizePersona(aiPersona)}` : ''}

## কথোপকথনের ইতিহাস:
${chatHistory || '(নতুন কথোপকথন)'}
Customer: ${customerMessage}

---

## ORDER FLOW — ধাপ অনুসরণ করো

conversation history দেখো — কোন তথ্য আগেই আছে তা আর জিজ্ঞেস করবে না।

### STEP 1 — পণ্য চেক করো (MANDATORY PRICE SHOW)
Customer কোনো পণ্য চাইলে বা কিনতে চাইলে:

**পণ্য list-এ পাওয়া গেলে → সাথে সাথে দাম দেখাও:**
পণ্য: [পণ্যের নাম]
দাম: ৳[মূল্য] (প্রতি [পিস/কপি/কেজি])

আর কতটি লাগবে?

⚠️ এই step-এ নাম, মোবাইল, বা ঠিকানা জিজ্ঞেস করবে না।
⚠️ দাম SKIP করা যাবে না — পণ্য থাকলে দাম সবসময় দেখাতে হবে।

**পণ্য list-এ না পাওয়া গেলে:**
"দুঃখিত, এই পণ্যটি বর্তমানে দোকানের তালিকায় পাচ্ছি না।"
→ order flow বন্ধ করো, পরিমাণ বা customer details জিজ্ঞেস করবে না।

### STEP 2 — পরিমাণ পেলে মোট দেখাও + আরও চাই কিনা জিজ্ঞেস করো
Customer পরিমাণ বললে:
[পণ্যের নাম]

প্রতি [পিস/কপি]: ৳[মূল্য]

[পরিমাণ] টি নিলে: ৳[মূল্য × পরিমাণ]

আর কিছু লাগবে?

→ Customer "হ্যাঁ" / নতুন পণ্যের নাম বললে → STEP 1 এ ফিরে যাও (নতুন পণ্যের দাম দেখাও)
→ Customer "না" / "এটাই" / "bas" / "আর না" / "শেষ" বললে → STEP 3 এ যাও

### STEP 2b — একাধিক পণ্য একসাথে চাইলে
Customer একসাথে দুই বা বেশি পণ্য বললে (যেমন: "Vitamin C আর Paracetamol দুটোই লাগবে"):
প্রতিটি পণ্যের দাম আলাদাভাবে দেখাও:

পণ্য ১: [নাম] — ৳[মূল্য]
পণ্য ২: [নাম] — ৳[মূল্য]

প্রতিটির পরিমাণ জিজ্ঞেস করো: "[পণ্য ১] কতটি আর [পণ্য ২] কতটি লাগবে?"

পরিমাণ পেলে সব পণ্যের total দেখাও:
পণ্য ১: [নাম] × [পরিমাণ] = ৳[subtotal]
পণ্য ২: [নাম] × [পরিমাণ] = ৳[subtotal]
মোট: ৳[grand total]

আর কিছু লাগবে?

### STEP 3 — দাম জিজ্ঞেস করলে উত্তর দাও
"দাম কত?", "5 ta nile koto?", "2 copy nile koto?" → সরাসরি calculation দাও, অন্য প্রশ্ন করবে না।

### STEP 4 — নাম
Customer কেনা শেষ বললে ("না", "এটাই হবে", "bas", "আর না", "শেষ") → "আপনার নামটা বলবেন?"

### STEP 5 — মোবাইল
নাম পেলে → "মোবাইল নম্বরটা দিন।"
Valid: 01XXXXXXXXX (11 digits, 01 দিয়ে শুরু)
Invalid হলে → "সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)"

### STEP 6 — ঠিকানা ⚠️ IMPORTANT
মোবাইল পেলে → "ডেলিভারি ঠিকানা দিন।"

**যেকোনো location text গ্রহণ করো — কোনো strict format নেই:**
✅ "শিবের বাজার" → accept
✅ "shiber bazar sylhet" → accept
✅ "হাটফলা ইউনিয়ন" → accept
✅ "দক্ষিণ সুরমা" → accept
✅ "ঢাকা" → accept
✅ "mirpur 10" → accept

Customer যা বলুক — একটি word-ও address হিসেবে গ্রহণ করো।
**আর ঠিকানা জিজ্ঞেস করবে না।** একবার পেলেই STEP 7-এ যাও।

### STEP 7 — অর্ডার সারাংশ
⚠️ নাম + মোবাইল + ঠিকানা তিনটি না পেলে STEP 7-এ আসবে না। যেটা নেই সেটা আগে নাও।

সব তথ্য পেলে এই format দেখাও:

একটি পণ্য হলে:
"অর্ডার সারাংশ:

পণ্য: [নাম] × [পরিমাণ] = ৳[subtotal]
মোট: ৳[total]

নাম: [নাম]
মোবাইল: [নম্বর]
ঠিকানা: [ঠিকানা]

সব ঠিক থাকলে 'Confirm' লিখুন।"

একাধিক পণ্য হলে:
"অর্ডার সারাংশ:

পণ্য ১: [নাম] × [পরিমাণ] = ৳[subtotal]
পণ্য ২: [নাম] × [পরিমাণ] = ৳[subtotal]
মোট: ৳[grand total]

নাম: [নাম]
মোবাইল: [নম্বর]
ঠিকানা: [ঠিকানা]

সব ঠিক থাকলে 'Confirm' লিখুন।"

### STEP 8 — Confirmation
Customer "confirm / হ্যাঁ / জি / ok / ঠিক আছে / order করুন / yes" বললে → order JSON তৈরি করো।

⚠️ CRITICAL RULE — কোন format ব্যবহার করবে:
- conversation-এ মোট পণ্যের সংখ্যা গণনা করো
- **ঠিক ১টি পণ্য** → \`order\` object ব্যবহার করো, \`items: null\`
- **২টি বা বেশি পণ্য** → \`items\` array ব্যবহার করো, \`order: null\` — প্রতিটি পণ্য আলাদা object হিসেবে দাও
- ২+ পণ্যে কখনো \`order\` object ব্যবহার করবে না — করলে দ্বিতীয় পণ্য হারিয়ে যাবে

**সব field required:**
- প্রতিটি item-এ: product_name, quantity, unit_price, total_amount
- top-level-এ: customer_name, customer_phone, customer_address
- customer_phone বা customer_address missing থাকলে order JSON তৈরি করবে না, আগে সেটা জিজ্ঞেস করো

---

## পণ্য recommendation
Customer সব পণ্য জানতে চাইলে বা "কী আছে?" জিজ্ঞেস করলে list দেখাও:
"আমাদের কাছে আছে:
• [পণ্য ১] — ৳[মূল্য]
• [পণ্য ২] — ৳[মূল্য]

কোনটা নেবেন?"

Customer নির্দিষ্ট পণ্য চাইলে → সরাসরি STEP 1 অনুযায়ী দাম দেখাও, list দেখানোর দরকার নেই।
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

Single product (১টি পণ্য — order object, items: null):
{"reply":"ধন্যবাদ, অর্ডার নিশ্চিত হচ্ছে...","order":{"product_name":"পণ্যের নাম","quantity":2,"unit_price":180,"total_amount":360,"customer_name":"নাম","customer_phone":"01XXXXXXXXX","customer_address":"ঠিকানা","notes":""},"items":null,"handoff":false,"quick_replies":[]}

Multiple products (২+ পণ্য — items array, order: null — সব পণ্য অবশ্যই include করো):
{"reply":"ধন্যবাদ, অর্ডার নিশ্চিত হচ্ছে...","order":null,"items":[{"product_name":"জিংক ট্যাবলেট","quantity":2,"unit_price":35,"total_amount":70},{"product_name":"বেটনোভেট ক্রিম","quantity":2,"unit_price":60,"total_amount":120}],"customer_name":"নাম","customer_phone":"01XXXXXXXXX","customer_address":"ঠিকানা","handoff":false,"quick_replies":[]}

⚠️ unit_price এবং total_amount অবশ্যই দিতে হবে — conversation-এ যে দাম দেখানো হয়েছে সেটাই দাও।
⚠️ ২+ পণ্যে \`order\` object ব্যবহার করলে দ্বিতীয় পণ্য হারিয়ে যাবে — সবসময় \`items\` array ব্যবহার করো।

Handoff:
{"reply":"এই বিষয়ে দোকানদার ভালো বলতে পারবেন, এখনই জানাচ্ছি।","order":null,"items":null,"handoff":true,"quick_replies":[]}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = req.headers['x-webhook-secret'] || req.headers['authorization']
  if (!process.env.WEBHOOK_SECRET) {
    console.error('[auto-reply] SECURITY: WEBHOOK_SECRET env var is not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { record, type } = req.body
  if (type !== 'INSERT' || !record) return res.status(200).json({ skipped: 'not an insert' })

  const { conversation_id, sender_id, content } = record
  console.log(`[auto-reply] msg from sender=${sender_id} conv=${conversation_id}`)
  if (!conversation_id || !content) return res.status(200).json({ skipped: 'missing fields' })

  try {
    const { data: conv } = await supabase
      .from('conversations')
      .select('shop_id, owner_id, ai_paused')
      .eq('id', conversation_id)
      .single()

    if (!conv?.shop_id) { console.log('[auto-reply] SKIP: no shop_id'); return res.status(200).json({ skipped: 'no shop_id' }) }

    if (sender_id === conv.owner_id) {
      console.log('[auto-reply] SKIP: owner message')
      return res.status(200).json({ skipped: 'owner message' })
    }

    console.log(`[auto-reply] conv ai_paused=${conv.ai_paused}`)
    if (conv.ai_paused) { console.log('[auto-reply] SKIP: ai_paused=true'); return res.status(200).json({ skipped: 'ai paused' }) }

    const { data: shop } = await supabase
      .from('shops')
      .select('id, shop_name, owner_id, auto_reply_enabled, ai_persona, plan, plan_expires_at, categories(name)')
      .eq('id', conv.shop_id)
      .single()

    if (!shop) { console.log('[auto-reply] SKIP: shop not found'); return res.status(200).json({ skipped: 'shop not found' }) }
    console.log(`[auto-reply] shop=${shop.shop_name} auto_reply_enabled=${shop.auto_reply_enabled} plan=${shop.plan}`)

    // ── Push: notify shop owner of new customer message (fire-and-forget) ──
    sendPushToUser(shop.owner_id, {
      title: `💬 ${shop.shop_name}`,
      body:  content.slice(0, 100),
      url:   '/dashboard/chat',
      tag:   `chat-${conversation_id}`,
    }).catch(() => null)
    if (!shop.auto_reply_enabled) { console.log('[auto-reply] SKIP: auto_reply_enabled=false'); return res.status(200).json({ skipped: 'disabled' }) }

    // ── Free plan AI chat limit: 100/month ───────────────────────────────────
    const planActive = shop.plan && shop.plan !== 'free' &&
      (!shop.plan_expires_at || new Date(shop.plan_expires_at) > new Date())
    const isFreePlan = !planActive
    if (isFreePlan) {
      const monthStart = new Date()
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

      // Get all conversation ids for this shop
      const { data: shopConvs } = await supabase
        .from('conversations')
        .select('id')
        .eq('shop_id', shop.id)

      if (shopConvs?.length) {
        const convIds = shopConvs.map(c => c.id)
        const { count: aiCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .eq('is_ai', true)
          .gte('created_at', monthStart.toISOString())

        if ((aiCount || 0) >= 100) {
          console.log(`[auto-reply] SKIP: free plan AI limit reached (${aiCount})`)
          const limitMsg = 'এই মাসের AI reply limit শেষ হয়েছে। দোকানদার শীঘ্রই সাড়া দেবেন।'
          await supabase.from('messages').insert({ conversation_id, sender_id: shop.owner_id, content: limitMsg, is_ai: true })
          await supabase.from('conversations').update({ last_message: limitMsg, last_message_at: new Date().toISOString() }).eq('id', conversation_id)
          return res.status(200).json({ skipped: 'ai_limit_reached' })
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
    const ctx = extractOrderContext(msgs, conv.owner_id)
    const isAwaitingConfirmCheck = /confirm\s*লিখুন|confirm করুন|অর্ডার.*confirm/i.test(lastAiReply)
    const rawIntent = detectIntent(content)
    // "ok/জি/হ্যাঁ" should only be treated as confirm when AI was actually asking for it
    const intent = rawIntent === 'confirm' && !isAwaitingConfirmCheck ? 'general' : rawIntent

    console.log(`[auto-reply] intent=${intent} hasConfirmedBefore=${ctx.hasConfirmedBefore} isNewOrderSession=${ctx.isNewOrderSession}`)

    // ── Server-side guard: "confirm" with already-confirmed non-new-session ──
    const isConfirmAttempt = intent === 'confirm'
    if (isConfirmAttempt && ctx.hasConfirmedBefore && !ctx.isNewOrderSession) {
      const alreadyReply = 'আপনার অর্ডার আগেই নেওয়া হয়েছে। নতুন পণ্য অর্ডার করতে চাইলে বলুন।'
      await supabase.from('messages').insert({ conversation_id, sender_id: shop.owner_id, content: alreadyReply, is_ai: true })
      await supabase.from('conversations').update({ last_message: alreadyReply, last_message_at: new Date().toISOString() }).eq('id', conversation_id)
      return res.status(200).json({ ok: true, guarded: 'already_confirmed' })
    }
    if (isConfirmAttempt) {
      let guardReply = null
      if (!ctx.phone) {
        guardReply = 'অর্ডার নিশ্চিত করতে আপনার মোবাইল নম্বরটা দিন (যেমন: 01XXXXXXXXX)'
      } else if (!ctx.address) {
        guardReply = 'ডেলিভারি ঠিকানাটা বলুন।'
      }
      if (guardReply) {
        await supabase.from('messages').insert({ conversation_id, sender_id: shop.owner_id, content: guardReply, is_ai: true })
        await supabase.from('conversations').update({ last_message: guardReply, last_message_at: new Date().toISOString() }).eq('id', conversation_id)
        return res.status(200).json({ ok: true, guarded: 'missing_field' })
      }
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
      ctx,
      intent,
    })

    // ── Human delay: ACK first (skip for greetings and handoff requests) ──
    const skipAck = intent === 'greeting' || intent === 'handoff_request'
    if (!skipAck) {
      const ack = pickAck(lastAiReply)
      await supabase.from('messages').insert({
        conversation_id,
        sender_id: shop.owner_id,
        content: ack,
        is_ai: true,
      })
      await supabase.from('conversations')
        .update({ last_message: ack, last_message_at: new Date().toISOString() })
        .eq('id', conversation_id)
    }

    await sleep(skipAck ? 800 + Math.random() * 500 : 1500 + Math.random() * 2000)

    const { result } = await generateDeepSeek(promptText)

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
      try {
        const m = result.match(/"reply"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/)
        if (m) {
          reply = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t')
        } else {
          reply = result.replace(/^\s*\{.*$/ms, '').trim() || result.slice(0, 600)
        }
      } catch {
        reply = result.slice(0, 600)
      }
    }

    if (!reply) return res.status(200).json({ skipped: 'no reply' })

    // ── Handoff: customer wants to talk to real owner ──
    if (handoff) {
      await supabase.from('conversations')
        .update({ ai_paused: true })
        .eq('id', conversation_id)

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

      reply = 'অবশ্যই। আপনার বার্তাটি দোকানের মালিকের কাছে পাঠানো হয়েছে। তিনি উত্তর দিলে এখানে দেখতে পাবেন।'
      order = null
      items = null
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    // ── Guard: block new order only when confirmed before AND not a new session ──
    if (ctx.hasConfirmedBefore && !ctx.isNewOrderSession && (order || items?.length)) {
      reply = 'আপনার অর্ডার আগেই নেওয়া হয়েছে। নতুন পণ্য অর্ডার করতে চাইলে বলুন।'
      order = null
      items = null
    }

    // ── Block order creation when intent is price_inquiry ──
    if (intent === 'price_inquiry' && (order || items?.length)) {
      order = null
      items = null
    }

    // ── Safety: if AI sent single `order` but there are multiple distinct products
    //    in the conversation, convert to items array so nothing gets dropped ──
    if (order?.product_name && !items?.length) {
      const productMentions = chatHistory.match(/পণ্য(?:\s*\d+)?:\s*([^\n]+)/g) || []
      if (productMentions.length >= 2) {
        // AI under-reported — keep order as-is but log for debugging
        console.warn('[auto-reply] WARNING: possible multi-product order sent as single order', order.product_name)
      }
    }

    // ── Single product order ──
    if (order?.product_name && order?.customer_name && order?.customer_phone && order?.customer_address) {
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
        const qty = Number(order.quantity) || 1
        // Prefer matched product price, fall back to AI-calculated values from order JSON
        const unitPrice = matched?.price || Number(order.unit_price) || 0
        const total = unitPrice * qty || Number(order.total_amount) || 0

        const { data: created, error: insertError } = await supabase.from('orders').insert({
          shop_id: shop.id,
          product_name: order.product_name,
          quantity: qty,
          total_amount: total,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          notes: order.notes || '',
          status: 'pending',
        }).select('order_number, id').single()

        if (insertError || !created?.order_number) {
          console.error('[auto-reply] order insert failed:', insertError)
          reply = 'দুঃখিত, এই মুহূর্তে অর্ডার নেওয়া সম্ভব হচ্ছে না। একটু পরে আবার চেষ্টা করুন বা দোকানে সরাসরি যোগাযোগ করুন।'
        } else {
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
          await supabase.from('notifications').insert({
            user_id: shop.owner_id,
            type: 'new_order',
            title: `নতুন অর্ডার: ${created.order_number}`,
            message: `${order.customer_name} — ${order.product_name} × ${qty} — ৳${total}`,
            data: { conversation_id, order_id: created.id, order_number: created.order_number },
          })
          sendPushToUser(shop.owner_id, {
            title: `🛒 নতুন অর্ডার: ${created.order_number}`,
            body:  `${order.customer_name} — ${order.product_name} × ${qty} — ৳${total}`,
            url:   '/dashboard/orders',
            tag:   `order-${created.order_number}`,
          }).catch(() => null)
        }
      }
    }

    // ── Multiple products order ──
    if (!(ctx.hasConfirmedBefore && !ctx.isNewOrderSession) && items?.length && (customerPhone || order?.customer_phone) && (customerAddress || order?.customer_address)) {
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
          const linePrice = (p?.price || Number(it.unit_price) || 0) * (Number(it.quantity) || 1)
          return sum + (linePrice || Number(it.total_amount) || 0)
        }, 0)

        const { data: created, error: insertError } = await supabase.from('orders').insert({
          shop_id: shop.id,
          product_name: productSummary,
          quantity: totalQty,
          total_amount: total,
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          notes: '',
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
          sendPushToUser(shop.owner_id, {
            title: `🛒 নতুন অর্ডার: ${created.order_number}`,
            body:  `${name} — ${productSummary} — ৳${total}`,
            url:   '/dashboard/orders',
            tag:   `order-${created.order_number}`,
          }).catch(() => null)
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
