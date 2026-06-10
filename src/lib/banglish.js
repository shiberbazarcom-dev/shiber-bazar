/**
 * ══════════════════════════════════════════════════════════════════
 * banglish.js — Banglish → Bengali Search Engine
 * ══════════════════════════════════════════════════════════════════
 *
 * Supports:
 *   • Exact Banglish word lookup    ("murgi" → "মুরগি")
 *   • Fuzzy matching for typos      ("morog" → "মুরগি", "caal" → "চাল")
 *   • Multi-word queries            ("murgi mangsho" → "মুরগি মাংস")
 *   • Pure Bengali passthrough      ("চাল" → "চাল")
 *   • Case-insensitive matching
 *
 * To add new terms: append to WORD_MAP below.
 * Format: 'banglish': 'বাংলা'
 * ══════════════════════════════════════════════════════════════════
 */

/* ═══════════════════════════════════════════════════════════════════
   WORD MAP — Banglish romanization → Bengali Unicode
   ─────────────────────────────────────────────────────────────────
   Keys are lowercase; add variants for common alternate spellings.
═══════════════════════════════════════════════════════════════════ */
export const WORD_MAP = {

  /* ── GRAINS & STAPLES ─────────────────────────────────────── */
  'chal':         'চাল',     'chaal':        'চাল',     'rice':        'চাল',
  'ata':          'আটা',     'atta':         'আটা',     'flour':       'আটা',
  'maida':        'ময়দা',    'suji':         'সুজি',    'semolina':    'সুজি',
  'dal':          'ডাল',     'daal':         'ডাল',     'lentil':      'ডাল',
  'chini':        'চিনি',    'sugar':        'চিনি',
  'laban':        'লবণ',     'noon':         'নুন',     'salt':        'লবণ',
  'sorishar tel': 'সরিষার তেল', 'mustard oil': 'সরিষার তেল',
  'sorishar':     'সরিষা',   'mustard':      'সরিষা',
  'narikel':      'নারিকেল', 'coconut':      'নারিকেল',
  'chira':        'চিড়া',   'muri':         'মুড়ি',   'khoi':        'খই',
  'sago':         'সাবুদানা','sago dana':    'সাবুদানা',

  /* ── VEGETABLES ───────────────────────────────────────────── */
  'sabji':        'সবজি',    'shobji':       'সবজি',    'sobji':       'সবজি',
  'sabzee':       'সবজি',    'vegetable':    'সবজি',    'vegetables':  'সবজি',
  'shak':         'শাক',
  'alu':          'আলু',     'aloo':         'আলু',     'potato':      'আলু',
  'begun':        'বেগুন',   'brinjal':      'বেগুন',   'eggplant':    'বেগুন',
  'tomato':       'টমেটো',   'tomatoo':      'টমেটো',
  'piyaj':        'পেঁয়াজ', 'peyaj':        'পেঁয়াজ', 'piaz':        'পেঁয়াজ',
  'onion':        'পেঁয়াজ',
  'rosun':        'রসুন',    'roshun':       'রসুন',    'garlic':      'রসুন',
  'ada':          'আদা',     'aada':         'আদা',     'ginger':      'আদা',
  'morich':       'মরিচ',    'moricha':      'মরিচ',    'chili':       'মরিচ',
  'mirch':        'মরিচ',    'pepper':       'মরিচ',    'jolmorich':   'জলমরিচ',
  'lau':          'লাউ',     'gourd':        'লাউ',
  'kumra':        'কুমড়া',  'pumpkin':      'কুমড়া',
  'fulkopi':      'ফুলকপি',  'cauliflower':  'ফুলকপি',  'ful kopi':    'ফুলকপি',
  'bandakopi':    'বাঁধাকপি','cabbage':      'বাঁধাকপি','bada kopi':   'বাঁধাকপি',
  'sim':          'শিম',     'beans':        'শিম',     'shimul':      'শিম',
  'patol':        'পটল',     'pointed gourd':'পটল',
  'korola':       'করলা',    'bitter gourd': 'করলা',    'kerela':      'করলা',
  'dhonia':       'ধনেপাতা', 'coriander':    'ধনেপাতা', 'dhone':       'ধনেপাতা',
  'palang shak':  'পালং শাক','spinach':      'পালং শাক','palang':      'পালং শাক',
  'methi':        'মেথি',    'fenugreek':    'মেথি',
  'kachkola':     'কাঁচকলা', 'green banana': 'কাঁচকলা',
  'jhinga':       'ঝিঙ্গা',  'ridge gourd':  'ঝিঙ্গা',
  'chichinga':    'চিচিঙ্গা','snake gourd':  'চিচিঙ্গা',

  /* ── FRUITS ───────────────────────────────────────────────── */
  'kola':         'কলা',     'banana':       'কলা',
  'aam':          'আম',      'mango':        'আম',      'aaam':        'আম',
  'kathal':       'কাঁঠাল',  'jackfruit':    'কাঁঠাল',  'kaathal':     'কাঁঠাল',
  'papaya':       'পেঁপে',   'pepe':         'পেঁপে',   'papaye':      'পেঁপে',
  'lichu':        'লিচু',    'lychee':       'লিচু',    'litchi':      'লিচু',
  'komla':        'কমলা',    'orange':       'কমলা',
  'ananas':       'আনারস',   'pineapple':    'আনারস',
  'peyara':       'পেয়ারা',  'guava':        'পেয়ারা',  'peara':       'পেয়ারা',
  'tormuj':       'তরমুজ',   'watermelon':   'তরমুজ',
  'khejur':       'খেজুর',   'date':         'খেজুর',   'dates':       'খেজুর',
  'biribe':       'বেরি',    'berry':        'বেরি',
  'amloki':       'আমলকি',   'amla':         'আমলকি',
  'jambura':      'জাম্বুরা', 'pomelo':      'জাম্বুরা',

  /* ── FISH ─────────────────────────────────────────────────── */
  'mach':         'মাছ',     'maach':        'মাছ',     'fish':        'মাছ',
  'ilish':        'ইলিশ',    'hilsa':        'ইলিশ',    'hilsha':      'ইলিশ',
  'rui':          'রুই',     'rohu':         'রুই',
  'katla':        'কাতলা',   'katol':        'কাতলা',
  'pangash':      'পাঙ্গাশ', 'pangas':       'পাঙ্গাশ',
  'pabda':        'পাবদা',   'shol':         'শোল',     'shoal':       'শোল',
  'chingri':      'চিংড়ি',  'prawn':        'চিংড়ি',  'shrimp':      'চিংড়ি',
  'shutki':       'শুঁটকি',  'dried fish':   'শুঁটকি',  'shuntki':     'শুঁটকি',
  'koi':          'কই',      'taki':         'টাকি',    'boal':        'বোয়াল',
  'telapia':      'তেলাপিয়া','tilapia':     'তেলাপিয়া',
  'tengra':       'টেংরা',   'bata':         'বাটা',    'khalisha':    'খলিসা',
  'air':          'আইড়',

  /* ── MEAT & POULTRY ───────────────────────────────────────── */
  'mangsho':      'মাংস',    'mangshe':      'মাংস',    'meat':        'মাংস',
  'murgi':        'মুরগি',   'chicken':      'মুরগি',   'morog':       'মুরগি',
  'murgi mangsho':'মুরগির মাংস','chicken meat':'মুরগির মাংস',
  'goru':         'গরু',     'beef':         'গরু',     'gorur mangsho':'গরুর মাংস',
  'khasi':        'খাসি',    'mutton':       'খাসি',    'lamb':        'খাসি',
  'khasir mangsho':'খাসির মাংস',
  'has':          'হাঁস',    'duck':         'হাঁস',    'hans':        'হাঁস',
  'pigeon':       'কবুতর',   'kobuto':       'কবুতর',   'quail':       'কোয়েল',
  'dim':          'ডিম',     'egg':          'ডিম',     'eggs':        'ডিম',
  'murgi dim':    'মুরগির ডিম','chicken egg': 'মুরগির ডিম',

  /* ── DAIRY ────────────────────────────────────────────────── */
  'dudh':         'দুধ',     'milk':         'দুধ',     'doodh':       'দুধ',
  'doi':          'দই',      'yogurt':       'দই',      'dahi':        'দই',
  'makhon':       'মাখন',    'butter':       'মাখন',
  'ghee':         'ঘি',      'ghi':          'ঘি',
  'cheese':       'পনির',    'paneer':       'পনির',    'chiz':        'পনির',
  'cream':        'ক্রিম',   'kheer':        'ক্ষীর',

  /* ── FOOD, DRINKS & RESTAURANTS ──────────────────────────── */
  'bhat':         'ভাত',     'bhaat':        'ভাত',     'cooked rice': 'ভাত',
  'roti':         'রুটি',    'bread':        'রুটি',    'paratha':     'পরোটা',
  'porota':       'পরোটা',   'parata':       'পরোটা',
  'tarkari':      'তরকারি',  'curry':        'তরকারি',  'tarri':       'তরকারি',
  'biriyani':     'বিরিয়ানি','biryani':     'বিরিয়ানি','biriani':    'বিরিয়ানি',
  'khichuri':     'খিচুড়ি', 'khichri':      'খিচুড়ি', 'khichdi':     'খিচুড়ি',
  'halwa':        'হালুয়া',  'halua':        'হালুয়া',
  'misti':        'মিষ্টি',  'mishti':       'মিষ্টি',  'sweet':       'মিষ্টি',
  'sweets':       'মিষ্টি',  'mishti doi':   'মিষ্টি দই',
  'sandesh':      'সন্দেশ',  'rasgulla':     'রসগোল্লা','chomchom':   'চমচম',
  'laddu':        'লাড্ডু',  'barfi':        'বরফি',
  'cha':          'চা',      'chai':         'চা',      'tea':         'চা',
  'coffee':       'কফি',     'juice':        'জুস',     'sherbet':     'শরবত',
  'lassi':        'লাচ্ছি',  'water':        'পানি',    'pani':        'পানি',
  'ice cream':    'আইসক্রিম','icecream':     'আইসক্রিম',
  'cake':         'কেক',     'biscuit':      'বিস্কুট', 'cookie':      'কুকি',
  'chips':        'চিপস',    'noodles':      'নুডলস',   'pasta':       'পাস্তা',
  'hotel':        'হোটেল',   'restaurant':   'রেস্টুরেন্ট','bakery':   'বেকারি',

  /* ── OIL, SPICES & CONDIMENTS ─────────────────────────────── */
  'tel':          'তেল',     'oil':          'তেল',
  'halud':        'হলুদ',    'turmeric':     'হলুদ',    'haldi':       'হলুদ',
  'jira':         'জিরা',    'cumin':        'জিরা',    'jeera':       'জিরা',
  'dhoniya':      'ধনিয়া',   'coriander seed':'ধনিয়া',
  'elach':        'এলাচ',    'cardamom':     'এলাচ',    'elaichi':     'এলাচ',
  'dalchini':     'দারচিনি',  'cinnamon':     'দারচিনি',
  'laung':        'লবঙ্গ',   'clove':        'লবঙ্গ',
  'bay leaf':     'তেজপাতা', 'tejpata':      'তেজপাতা',
  'soy sauce':    'সয়া সস',  'vinegar':      'ভিনেগার',

  /* ── PHARMACY & HEALTH ─────────────────────────────────────── */
  'osud':         'ওষুধ',    'oshud':        'ওষুধ',    'medicine':    'ওষুধ',
  'dawai':        'ওষুধ',    'dawa':         'ওষুধ',
  'pharmacy':     'ফার্মেসি','vitamin':      'ভিটামিন', 'mineral':     'মিনারেল',
  'mask':         'মাস্ক',   'sanitizer':    'স্যানিটাইজার','gloves':   'গ্লাভস',
  'thermometer':  'থার্মোমিটার','syringe':   'সিরিঞ্জ',

  /* ── CLOTHING & FASHION ───────────────────────────────────── */
  'kapor':        'কাপড়',   'kapd':         'কাপড়',   'cloth':       'কাপড়',
  'clothing':     'পোশাক',   'dress':        'পোশাক',   'jama':        'জামা',
  'shari':        'শাড়ি',   'saree':        'শাড়ি',   'sari':        'শাড়ি',
  'panjabi':      'পাঞ্জাবি','punjabi':      'পাঞ্জাবি','fatua':       'ফতুয়া',
  'lungi':        'লুঙ্গি',  'dhuti':        'ধুতি',    'dhoti':       'ধুতি',
  'shirt':        'শার্ট',   'pant':         'প্যান্ট', 'pants':       'প্যান্ট',
  'jeans':        'জিন্স',   'trouser':      'ট্রাউজার',
  'frock':        'ফ্রক',    'skirt':        'স্কার্ট',
  'kamiz':        'কামিজ',   'churidar':     'চুড়িদার', 'salwar':      'সালোয়ার',
  'orna':         'ওড়না',   'dupatta':      'দুপাট্টা','hijab':       'হিজাব',
  'scarf':        'স্কার্ফ', 'jacket':       'জ্যাকেট', 'coat':        'কোট',
  'sweater':      'সোয়েটার','soyeter':      'সোয়েটার','woolen':      'উলের',
  'shoe':         'জুতা',    'juta':         'জুতা',    'joota':       'জুতা',
  'sandal':       'স্যান্ডেল','chappal':     'চপ্পল',   'boots':       'বুট',
  'bag':          'ব্যাগ',   'purse':        'পার্স',   'wallet':      'মানিব্যাগ',
  'belt':         'বেল্ট',   'tie':          'টাই',     'socks':       'মোজা',
  'moja':         'মোজা',    'underwear':    'আন্ডারওয়্যার',
  'bra':          'ব্রা',

  /* ── ELECTRONICS ──────────────────────────────────────────── */
  'mobile':       'মোবাইল',  'phone':        'ফোন',     'smartphone':  'স্মার্টফোন',
  'tv':           'টিভি',    'television':   'টেলিভিশন',
  'fridge':       'ফ্রিজ',   'freeze':       'ফ্রিজ',   'refrigerator':'ফ্রিজ',
  'ac':           'এসি',     'air conditioner':'এয়ার কন্ডিশনার',
  'fan':          'ফ্যান',   'ceiling fan':  'সিলিং ফ্যান',
  'bulb':         'বাল্ব',   'led':          'এলইডি',   'tube light':  'টিউব লাইট',
  'charger':      'চার্জার', 'earphone':     'ইয়ারফোন',
  'headphone':    'হেডফোন',  'speaker':      'স্পিকার',
  'laptop':       'ল্যাপটপ', 'computer':     'কম্পিউটার','desktop':    'ডেস্কটপ',
  'printer':      'প্রিন্টার','scanner':     'স্ক্যানার',
  'camera':       'ক্যামেরা', 'cctv':         'সিসিটিভি',
  'battery':      'ব্যাটারি','ups':          'ইউপিএস',   'ips':         'আইপিএস',
  'router':       'রাউটার',  'modem':        'মডেম',    'wifi':        'ওয়াইফাই',

  /* ── ELECTRICAL & HARDWARE ────────────────────────────────── */
  'tar':          'তার',     'cable':        'তার',     'wire':        'তার',
  'switch':       'সুইচ',    'socket':       'সকেট',    'plug':        'প্লাগ',
  'circuit breaker':'সার্কিট ব্রেকার',
  'pipe':         'পাইপ',    'valve':        'ভাল্ব',   'tap':         'কল',
  'kol':          'কল',      'basin':        'বেসিন',   'shower':      'শাওয়ার',
  'lock':         'তালা',    'tala':         'তালা',    'key':         'চাবি',
  'chabi':        'চাবি',    'paint':        'পেইন্ট',  'cement':      'সিমেন্ট',
  'rod':          'রড',      'iron rod':     'লোহার রড',
  'nail':         'পেরেক',   'perek':        'পেরেক',   'screw':       'স্ক্রু',
  'hammer':       'হাতুড়ি', 'drill':        'ড্রিল',   'plier':       'প্লায়ার',
  'saw':          'করাত',    'korat':        'করাত',

  /* ── HOUSEHOLD ────────────────────────────────────────────── */
  'soap':         'সাবান',   'saban':        'সাবান',   'detergent':   'ডিটারজেন্ট',
  'shampoo':      'শ্যাম্পু','conditioner':  'কন্ডিশনার',
  'toothpaste':   'টুথপেস্ট','paste':        'পেস্ট',   'toothbrush':  'টুথব্রাশ',
  'broom':        'ঝাড়ু',   'jharu':        'ঝাড়ু',   'mop':         'মপ',
  'bucket':       'বালতি',   'balti':        'বালতি',   'mug':         'মগ',
  'plate':        'থালা',    'thala':        'থালা',    'bowl':        'বাটি',
  'bati':         'বাটি',    'glass':        'গ্লাস',   'cup':         'কাপ',
  'pot':          'হাঁড়ি',  'handi':        'হাঁড়ি',  'karahi':      'কড়াই',
  'frying pan':   'ফ্রাইপ্যান','tawa':       'তাওয়া',
  'mosquito net': 'মশারি',   'moshari':      'মশারি',   'blanket':     'কম্বল',
  'kombol':       'কম্বল',   'pillow':       'বালিশ',   'balish':      'বালিশ',
  'mattress':     'ম্যাট্রেস','chadar':       'চাদর',

  /* ── FURNITURE ────────────────────────────────────────────── */
  'chair':        'চেয়ার',   'table':        'টেবিল',
  'bed':          'বিছানা',  'bichana':      'বিছানা',  'khaat':       'খাট',
  'almirah':      'আলমারি',  'almari':       'আলমারি',  'wardrobe':    'আলমারি',
  'sofa':         'সোফা',    'shelf':        'শেলফ',    'rack':        'র‌্যাক',
  'cupboard':     'কাপবোর্ড','door':         'দরজা',    'dorja':       'দরজা',
  'window':       'জানালা',  'janala':       'জানালা',

  /* ── BEAUTY & COSMETICS ───────────────────────────────────── */
  'cream':        'ক্রিম',   'lotion':       'লোশন',    'moisturizer': 'ময়েশ্চারাইজার',
  'lipstick':     'লিপস্টিক','powder':       'পাউডার',  'foundation':  'ফাউন্ডেশন',
  'nail polish':  'নেলপলিশ', 'eyeliner':     'আইলাইনার','mascara':     'মাসকারা',
  'perfume':      'পারফিউম', 'attar':        'আতর',     'deodorant':   'ডিওডোরেন্ট',
  'kajal':        'কাজল',    'mehendi':      'মেহেদি',  'henna':       'মেহেদি',
  'sunscreen':    'সানস্ক্রিন','facewash':    'ফেসওয়াশ','toner':       'টোনার',

  /* ── BOOKS & STATIONERY ───────────────────────────────────── */
  'boi':          'বই',      'book':         'বই',      'books':       'বই',
  'khata':        'খাতা',    'notebook':     'নোটবুক',  'diary':       'ডায়েরি',
  'pen':          'কলম',     'kolom':        'কলম',     'pencil':      'পেন্সিল',
  'rubber':       'রাবার',   'eraser':       'ইরেজার',  'scale':       'স্কেল',
  'sharpener':    'শার্পনার', 'marker':       'মার্কার',
  'school bag':   'স্কুল ব্যাগ','textbook':  'পাঠ্যপুস্তক',
  'atlas':        'মানচিত্র','magazine':     'ম্যাগাজিন',

  /* ── CATEGORIES (for shop/category search) ────────────────── */
  'grocery':      'মুদি',    'mudi':         'মুদি',    'super shop':  'সুপার শপ',
  'fish market':  'মাছের বাজার','veggie':    'সবজি',
  'medicine':     'ওষুধ',    'chemist':      'ফার্মেসি',
  'jewelry':      'গহনা',    'jewel':        'গহনা',    'jewellery':   'গহনা',
  'gold':         'সোনা',    'silver':       'রূপা',    'diamond':     'হীরা',
  'salon':        'সেলুন',   'parlor':       'পার্লার', 'beauty parlor':'বিউটি পার্লার',
  'hardware':     'হার্ডওয়্যার',
  'furniture shop':'আসবাবপত্র',
  'electronics shop':'ইলেকট্রনিক্স',
  'sanitary':     'স্যানিটারি','plumbing':   'পাইপলাইন',
  'cosmetics':    'প্রসাধনী', 'beauty':      'সৌন্দর্য',
  'electrical':   'বৈদ্যুতিক','electric':    'বৈদ্যুতিক',
  'mobile service':'মোবাইল সেবা','mobile shop':'মোবাইল শপ',
  'clothing store':'পোশাকের দোকান',

  /* ── SHOP NAME FRAGMENTS ──────────────────────────────────── */
  'dokan':        'দোকান',   'shop':         'দোকান',   'bazar':       'বাজার',
  'bazaar':       'বাজার',   'market':       'বাজার',   'store':       'স্টোর',
}

/* ═══════════════════════════════════════════════════════════════════
   LEVENSHTEIN EDIT DISTANCE
   Capped at `cap` for performance — returns cap+1 if impossible.
═══════════════════════════════════════════════════════════════════ */
function levenshtein(a, b, cap = 3) {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > cap) return cap + 1

  const m = a.length
  const n = b.length
  // Use two-row rolling array for memory efficiency
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array(n + 1)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    let rowMin = i
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1]
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1])
      }
      if (curr[j] < rowMin) rowMin = curr[j]
    }
    // Early termination — whole row exceeds cap
    if (rowMin > cap) return cap + 1
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

/* ═══════════════════════════════════════════════════════════════════
   FUZZY LOOKUP
   Finds the Bengali translation of a Banglish word,
   tolerating small spelling errors.
═══════════════════════════════════════════════════════════════════ */
function fuzzyLookup(word) {
  const lower = word.toLowerCase().trim()
  if (!lower) return null

  // Exact hit first (fastest path)
  if (WORD_MAP[lower]) return WORD_MAP[lower]

  // Fuzzy threshold: 1 edit for ≤4 chars, 2 for 5–7, 3 for longer words
  const threshold = lower.length <= 4 ? 1 : lower.length <= 7 ? 2 : 3

  let bestVal  = null
  let bestDist = Infinity

  for (const [key, val] of Object.entries(WORD_MAP)) {
    // Skip keys with very different lengths (faster)
    if (Math.abs(key.length - lower.length) > threshold) continue
    const dist = levenshtein(lower, key, threshold)
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist
      bestVal  = val
    }
  }
  return bestVal
}

/* ═══════════════════════════════════════════════════════════════════
   expandQuery  ← main export
   ─────────────────────────────────────────────────────────────────
   Input : user search string (any language / Banglish)
   Output: unique array of search terms to pass to the database

   Examples:
     expandQuery("murgi")   → ["murgi", "মুরগি"]
     expandQuery("morog")   → ["morog", "মুরগি"]   (fuzzy)
     expandQuery("caal")    → ["caal",  "চাল"]     (fuzzy)
     expandQuery("চাল")     → ["চাল"]              (Bengali passthrough)
     expandQuery("murgi dal")→ ["murgi dal", "মুরগি", "ডাল", "মুরগি ডাল"]
═══════════════════════════════════════════════════════════════════ */
export function expandQuery(input) {
  if (!input?.trim()) return []
  const q = input.trim()

  // ── Bengali passthrough — no conversion needed ───────────────
  if (/[ঀ-৿]/.test(q)) return [q]

  const lower  = q.toLowerCase()
  const terms  = new Set([lower])

  // ── Single-word query ─────────────────────────────────────────
  const words = lower.split(/\s+/)

  if (words.length === 1) {
    const match = fuzzyLookup(lower)
    if (match) terms.add(match)
  } else {
    // ── Multi-word query ─────────────────────────────────────────
    // Convert each word individually
    const benParts = words.map(w => {
      const match = fuzzyLookup(w)
      return match || w        // keep original if no match
    })

    // Add each successfully converted Bengali word
    benParts.forEach((p, i) => {
      if (/[ঀ-৿]/.test(p)) terms.add(p)
      else terms.add(words[i]) // keep Banglish if no conversion
    })

    // Also add the full converted Bengali phrase
    const bengaliPhrase = benParts.join(' ')
    if (bengaliPhrase !== lower) terms.add(bengaliPhrase)

    // Try full phrase as a WORD_MAP key too (e.g. "murgi mangsho")
    const phraseMatch = WORD_MAP[lower]
    if (phraseMatch) terms.add(phraseMatch)
  }

  return [...terms].filter(Boolean)
}

/* ═══════════════════════════════════════════════════════════════════
   buildOrFilter
   ─────────────────────────────────────────────────────────────────
   Builds a Supabase .or() filter string from expanded terms.

   buildOrFilter(['chal', 'চাল'], ['name'])
     → "name.ilike.%chal%,name.ilike.%চাল%"

   buildOrFilter(['murgi', 'মুরগি'], ['shop_name', 'description'])
     → "shop_name.ilike.%murgi%,...,description.ilike.%মুরগি%"
═══════════════════════════════════════════════════════════════════ */
export function buildOrFilter(terms, fields = ['name']) {
  const parts = []
  for (const field of fields) {
    for (const term of terms) {
      if (term) parts.push(`${field}.ilike.%${term}%`)
    }
  }
  return parts.join(',')
}

/* ═══════════════════════════════════════════════════════════════════
   getBengaliMatch
   Returns the first Bengali term from expandQuery results,
   useful for showing "Searching for: মুরগি" UI hints.
═══════════════════════════════════════════════════════════════════ */
export function getBengaliMatch(input) {
  if (!input?.trim()) return null
  if (/[ঀ-৿]/.test(input)) return null   // already Bengali
  const terms = expandQuery(input)
  return terms.find(t => /[ঀ-৿]/.test(t)) ?? null
}
