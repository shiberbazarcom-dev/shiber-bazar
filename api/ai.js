/* Vercel serverless function — AI content generation
   Primary: DeepSeek-V3  |  Fallback: Google Gemini 1.5 Flash
*/
import { generate, generateGemini, parseJson } from './_generate.js'

const PROMPTS = {
  landing_page: ({ productName, price, category }) => `
তুমি একজন বাংলাদেশী মার্কেটিং কপিরাইটার। নিচের পণ্যের জন্য Facebook landing page এর content তৈরি করো।

পণ্য: ${productName}
${price ? `মূল্য: ৳${price}` : ''}
${category ? `ক্যাটাগরি: ${category}` : ''}

সম্পূর্ণ বাংলায় লেখো। JSON format এ return করো:
{
  "headline": "আকর্ষণীয় বড় হেডলাইন (১৫-২০ শব্দ)",
  "subheadline": "সাবহেডলাইন (২০-৩০ শব্দ)",
  "badge_text": "ছোট অফার ব্যাজ (৫-৭ শব্দ, emoji সহ)",
  "features": ["ফিচার ১", "ফিচার ২", "ফিচার ৩", "ফিচার ৪", "ফিচার ৫"],
  "faqs": [
    {"q": "প্রশ্ন ১?", "a": "উত্তর ১"},
    {"q": "প্রশ্ন ২?", "a": "উত্তর ২"},
    {"q": "প্রশ্ন ৩?", "a": "উত্তর ৩"}
  ],
  "cta_text": "CTA বাটনের লেখা",
  "whatsapp_message": "WhatsApp অর্ডার মেসেজ"
}

শুধু JSON দাও, আর কিছু না।`,

  product_description: ({ productName, category, price }) => `
তুমি একজন বাংলাদেশী e-commerce কপিরাইটার। নিচের পণ্যের জন্য আকর্ষণীয় বিবরণ ও বৈশিষ্ট্য লেখো।

পণ্য: ${productName}
${category ? `ক্যাটাগরি: ${category}` : ''}
${price ? `মূল্য: ৳${price}` : ''}

সম্পূর্ণ বাংলায় লেখো। JSON format এ return করো:
{
  "description": "২-৩ বাক্যের আকর্ষণীয় বিবরণ, পণ্যের উপকারিতা তুলে ধরবে",
  "features": "প্রতিটি বৈশিষ্ট্য আলাদা লাইনে, যেমন:\nউপাদান: ...\nসাইজ: ...\nরং: ...\nওজন: ...\nবিশেষত্ব: ..."
}

শুধু JSON দাও, আর কিছু না।`,

  smart_reply: ({ customerMessage, shopName, productList }) => `
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

শুধু JSON দাও, আর কিছু না।`,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const { type, ...params } = req.body
  if (!type || !PROMPTS[type]) return res.status(400).json({ error: 'Invalid type' })

  try {
    const prompt = PROMPTS[type](params)
    // product_description always uses Gemini; everything else uses DeepSeek → Gemini fallback
    const { result, provider } = type === 'product_description'
      ? await generateGemini(prompt).catch(() => generate(prompt))
      : await generate(prompt)

    let parsed
    try {
      parsed = parseJson(result)
    } catch {
      return res.status(200).json({ raw: result, provider })
    }

    return res.status(200).json({ ...parsed, provider })
  } catch (err) {
    console.error('AI generation failed:', err)
    return res.status(500).json({ error: err.message })
  }
}
