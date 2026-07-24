/* Vercel serverless function — AI-generated starter products for a category
   that has no hardcoded template in src/data/categoryProductTemplates.js.

   getTemplateProducts() covers ~17 known category names (মুদি, ফার্মেসি,
   ইলেকট্রনিক্স ...) via keyword matching. A newly created category (e.g.
   "সুপার শপ") matches none of them and silently returns []. Rather than
   hand-editing that file for every new category, AddShop.tsx falls back to
   this endpoint so any category the admin adds gets a product list without
   a code change.
*/
import { generate } from './_generate.js'

const MAX_ITEMS = 15

function buildPrompt(categoryName) {
  return `তুমি একজন বাংলাদেশী দোকান পরামর্শক। "${categoryName}" ধরনের একটি দোকানে সাধারণত যেসব পণ্য পাওয়া যায়, তেমন ${MAX_ITEMS}টি বাস্তবসম্মত পণ্যের তালিকা তৈরি করো।

প্রতিটি পণ্যের নাম বাংলায়, বাংলাদেশের বাজারের বাস্তবসম্মত দাম (টাকায়, সংখ্যা হিসেবে) ও মজুদের পরিমাণ দাও।

শুধু এই JSON array ফরম্যাটে দাও, অন্য কোনো লেখা দিও না। price ও stock অবশ্যই ইংরেজি (Arabic) সংখ্যায় দিতে হবে, বাংলা সংখ্যায় নয়:
[{"name":"পণ্যের নাম","price":123,"stock":30}, ...]`
}

function parseArray(text) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const s = clean.indexOf('['), e = clean.lastIndexOf(']')
  if (s === -1 || e === -1) throw new Error('No JSON array found')
  return JSON.parse(clean.slice(s, e + 1))
}

// Defense in depth: the prompt asks for Arabic numerals, but if the model
// slips and returns Bangla digits (১২৩) anyway, Number() would silently
// yield NaN and every price/stock would fall back to the default.
const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
function toArabicDigits(value) {
  return String(value).replace(/[০-৯]/g, d => BN_DIGITS.indexOf(d))
}

function sanitize(items) {
  if (!Array.isArray(items)) return []
  return items
    .map(it => {
      const name = String(it?.name || '').trim().slice(0, 80)
      const price = Number(toArabicDigits(it?.price))
      const stock = Number(toArabicDigits(it?.stock))
      if (!name) return null
      return {
        name,
        price: Number.isFinite(price) && price > 0 ? Math.round(price) : 100,
        stock: Number.isFinite(stock) && stock >= 0 ? Math.round(stock) : 20,
      }
    })
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { categoryName } = req.body || {}
  if (!categoryName || !String(categoryName).trim()) {
    return res.status(400).json({ error: 'categoryName required' })
  }

  try {
    const { result, provider } = await generate(buildPrompt(String(categoryName).trim()))
    console.log(`[generate-category-products] provider: ${provider}`)
    const products = sanitize(parseArray(result))
    return res.status(200).json({ ok: true, products })
  } catch (err) {
    console.error('[generate-category-products] failed:', err.message)
    // Non-fatal for the caller — shop creation should still succeed with no products
    return res.status(200).json({ ok: false, products: [], error: err.message })
  }
}
