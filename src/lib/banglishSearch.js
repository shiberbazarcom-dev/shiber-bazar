/* ─────────────────────────────────────────────────────────
   BANGLISH → BENGALI keyword map + product search matcher
   (shared by ShopDetail product search & OrderModal picker)
───────────────────────────────────────────────────────── */
export const BANGLISH_MAP = {
  shirt: ['শার্ট','সার্ট'], jama: ['জামা'], panjabi: ['পাঞ্জাবি'], punjabi: ['পাঞ্জাবি'],
  lungi: ['লুঙ্গি'], saree: ['শাড়ি'], sari: ['শাড়ি'], salwar: ['সালোয়ার'],
  kamiz: ['কামিজ'], kameez: ['কামিজ'], pant: ['প্যান্ট'], trouser: ['ট্রাউজার'],
  jacket: ['জ্যাকেট'], sweater: ['সোয়েটার','সুয়েটার'], coat: ['কোট'],
  cap: ['টুপি'], topi: ['টুপি'], juta: ['জুতা'], shoe: ['জুতা','স্যান্ডেল'],
  sandal: ['স্যান্ডেল'], belt: ['বেল্ট'], bag: ['ব্যাগ'], moja: ['মোজা'], socks: ['মোজা'],
  rice: ['চাল','ভাত'], chal: ['চাল'], dal: ['ডাল'], daal: ['ডাল'],
  tel: ['তেল'], oil: ['তেল'], fish: ['মাছ'], maach: ['মাছ'], murgi: ['মুরগি'], chicken: ['মুরগি'],
  egg: ['ডিম'], dim: ['ডিম'], milk: ['দুধ'], dudh: ['দুধ'],
  alu: ['আলু'], potato: ['আলু'], onion: ['পেঁয়াজ'], peyaj: ['পেঁয়াজ'],
  sugar: ['চিনি'], chini: ['চিনি'], salt: ['লবণ'], lobon: ['লবণ'],
  phone: ['ফোন','মোবাইল'], mobile: ['মোবাইল','ফোন'], tv: ['টিভি'],
  fan: ['ফ্যান'], fridge: ['ফ্রিজ'], laptop: ['ল্যাপটপ'],
  sabun: ['সাবান'], soap: ['সাবান'], shampoo: ['শ্যাম্পু'],
  cream: ['ক্রিম'], lotion: ['লোশন'], powder: ['পাউডার'],
  chair: ['চেয়ার'], table: ['টেবিল'], bed: ['বিছানা','বেড'], sofa: ['সোফা'],
  medicine: ['ওষুধ'], oshud: ['ওষুধ'],
  pen: ['কলম','পেন'], pencil: ['পেন্সিল'], khata: ['খাতা'], book: ['বই'], boi: ['বই'],
  clock: ['ঘড়ি'], ghori: ['ঘড়ি'], watch: ['ঘড়ি'], toy: ['খেলনা'],
}

export function productMatchesSearch(product, query) {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const name = (product.name || '').toLowerCase()
  const desc = (product.description || '').toLowerCase()
  if (name.includes(q) || desc.includes(q)) return true
  const words = q.split(/\s+/)
  for (const word of words) {
    const mapped = BANGLISH_MAP[word]
    if (mapped) {
      for (const bn of mapped) {
        if (name.includes(bn) || desc.includes(bn)) return true
      }
    }
  }
  for (const [key, bns] of Object.entries(BANGLISH_MAP)) {
    if (key.includes(q) || q.includes(key)) {
      for (const bn of bns) {
        if (name.includes(bn) || desc.includes(bn)) return true
      }
    }
  }
  return false
}
