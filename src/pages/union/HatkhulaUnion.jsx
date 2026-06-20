import SEO from '../../components/SEO'
import { useSiteSettings } from '../../hooks/useSettings'

// Fallback constants — used when CMS row is empty
const CHAIRMAN = {
  name: 'মাওলানা কে এম রফিকুজ্জামান',
  title: 'ইউপি চেয়ারম্যান',
  phone: '01714508159',
  email: 'hatkhulaunion@gmail.com',
  edu: 'এইচএসসি/সমমান',
  district: 'সিলেট',
}

const MEMBERS = [
  { name: 'মো: সুরুজ আলী',            ward: '১', phone: '01726499044' },
  { name: 'মোঃ আব্দুল জব্বার (এলাই)', ward: '২', phone: '01712913752' },
  { name: 'বদর উদ্দিন',               ward: '৩', phone: '01748003460' },
  { name: 'কামরান আহমদ',              ward: '৪', phone: '01785918330' },
  { name: 'মোঃ তবারক আলী',           ward: '৫', phone: '01785671122' },
  { name: 'আলকাছ মিয়া',              ward: '৬', phone: '01793519833' },
  { name: 'মোঃ মনোয়ার হোসেন লিটু',  ward: '৭', phone: '01719743562' },
  { name: 'মো: মবশ্বির আলী',          ward: '৮', phone: '01719233327' },
  { name: 'আব্দুল আহাদ',              ward: '৯', phone: '01322591132' },
]

const WOMEN_MEMBERS = [
  { name: 'সাবিত্রী রানী শর্ম্মা', wards: '১, ২, ৩',     phone: '01723413175' },
  { name: 'নেহারুন নেছা',          wards: '৪, ৫, ৬',     phone: '01720165627' },
  { name: 'রোকিয়া বেগম',           wards: '৭, ৮, ৯',     phone: '01783731553' },
]

const STAFF = [
  { name: 'মকসুদ আলী',       title: 'ইউনিয়ন পরিষদ সচিব',       phone: '01712964794' },
  { name: 'তারেক আহমেদ',     title: 'গ্রাম পুলিশ',               phone: '01738620577' },
  { name: 'মোঃ আমির আলী',    title: 'গ্রাম পুলিশ',               phone: '01744848742' },
  { name: 'আবুল হুসেন',      title: 'গ্রাম পুলিশ',               phone: '01772429744' },
  { name: 'সাহাব উদ্দিন',    title: 'গ্রাম পুলিশ',               phone: '01314773473' },
  { name: 'সাজিদ আলী',       title: 'গ্রাম পুলিশ',               phone: '01773363480' },
  { name: 'নমিতা পুরকায়স্থ', title: 'উপ-সহকারী কৃষি কর্মকর্তা', phone: '01728456787' },
]

const SERVICES = [
  { icon: '👶', name: 'জন্ম নিবন্ধন সনদ',   fee: 'বিনামূল্যে' },
  { icon: '🕊️', name: 'মৃত্যু নিবন্ধন সনদ',  fee: 'বিনামূল্যে' },
  { icon: '📄', name: 'নাগরিক সনদ',           fee: '৳ ৫০' },
  { icon: '✅', name: 'চারিত্রিক সনদ',         fee: '৳ ৫০' },
  { icon: '👨‍👩‍👧', name: 'ওয়ারিশ সনদ',         fee: '৳ ১০০' },
  { icon: '🏠', name: 'ভূমিহীন সনদ',           fee: 'বিনামূল্যে' },
  { icon: '🏪', name: 'ট্রেড লাইসেন্স',        fee: '৳ ৫০০+' },
  { icon: '💔', name: 'তালাকনামা প্রত্যয়ন',   fee: '৳ ১০০' },
]

const MARKETS = [
  { name: 'শিবের বাজার',      area: '৩ একর',  stalls: '১৫০ টি' },
  { name: 'পিঠারগঞ্জ বাজার', area: '১ একর',  stalls: '৪০ টি'  },
]

const POLICE = [
  { name: 'জালালাবাদ থানা', phone: '01320067594', note: 'হাটখোলা ইউনিয়নের আওতাভুক্ত' },
]

const HOTLINES = [
  { label: 'জরুরি সেবা',                  number: '999' },
  { label: 'সরকারি তথ্য ও সেবা',          number: '333' },
  { label: 'ফায়ার সার্ভিস',              number: '102' },
  { label: 'নারী ও শিশু নির্যাতন',       number: '109' },
  { label: 'শিশু সহায়তা',                number: '1098' },
  { label: 'স্মার্ট ভূমি সেবা',           number: '16122' },
  { label: 'পাসপোর্ট বাতায়ন',            number: '16445' },
  { label: 'বিদ্যুৎ বিভাগ',              number: '16999' },
  { label: 'লিগ্যাল এইড',                number: '16430' },
  { label: 'দুদক হটলাইন',               number: '106' },
]

function PhoneLink({ phone }) {
  return (
    <a href={`tel:${phone}`}
      className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm hover:underline">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
      </svg>
      {phone}
    </a>
  )
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
    </div>
  )
}

function ucms(settings, key, fallback) {
  const v = settings[key]
  return (v !== undefined && v !== null && v !== '') ? v : fallback
}

export default function HatkhulaUnion() {
  const { data: u = {} } = useSiteSettings()

  // CMS values with hardcoded fallbacks
  const unionName    = ucms(u, 'union_name',  '২নং হাটখোলা ইউনিয়ন পরিষদ')
  const unionArea    = ucms(u, 'union_area',  'সিলেট সদর উপজেলা, সিলেট জেলা')
  const unionEmail   = ucms(u, 'union_email', CHAIRMAN.email)
  const chairName    = ucms(u, 'union_chairman_name',  CHAIRMAN.name)
  const chairPhone   = ucms(u, 'union_chairman_phone', CHAIRMAN.phone)
  const chairTitle   = ucms(u, 'union_chairman_title', CHAIRMAN.title)
  const secName      = ucms(u, 'union_secretary_name',  STAFF[0].name)
  const secPhone     = ucms(u, 'union_secretary_phone', STAFF[0].phone)
  const krishiName   = ucms(u, 'union_krishi_name',  STAFF[STAFF.length - 1].name)
  const krishiPhone  = ucms(u, 'union_krishi_phone', STAFF[STAFF.length - 1].phone)
  const policeName   = ucms(u, 'union_police_name',  POLICE[0].name)
  const policePhone  = ucms(u, 'union_police_phone', POLICE[0].phone)

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #eff6ff 50%, #f8fafc 100%)' }}>
      <SEO
        title={unionName}
        description={`${unionName} — চেয়ারম্যান, সদস্য, কর্মচারী ও জরুরি যোগাযোগ নম্বর।`}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-4">

        {/* Header */}
        <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white">{unionName}</h1>
          <p className="text-xs text-emerald-100 mt-1">{unionArea}</p>
          <a href={`mailto:${unionEmail}`}
            className="inline-flex items-center gap-1 text-xs text-white/80 mt-2 hover:text-white transition-colors">
            ✉️ {unionEmail}
          </a>
        </div>

        {/* পুলিশ */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-5">
          <SectionTitle icon="👮" title="পুলিশ" />
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-800">{policeName}</p>
                <p className="text-xs text-gray-400">{POLICE[0].note}</p>
              </div>
              <PhoneLink phone={policePhone} />
            </div>
          </div>
        </div>

        {/* Chairman + Secretary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Chairman */}
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">চেয়ারম্যান</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-bold text-base flex items-center justify-center flex-shrink-0">
                  {chairName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{chairName}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{chairTitle}</p>
                  <PhoneLink phone={chairPhone} />
                </div>
              </div>
            </div>
            {/* Secretary */}
            <div className="border-l border-gray-100 pl-4">
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-2">পরিষদ সচিব</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold text-base flex items-center justify-center flex-shrink-0">
                  {secName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{secName}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">সচিব</p>
                  <PhoneLink phone={secPhone} />
                </div>
              </div>
            </div>
          </div>
          {/* Krishi Officer */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col items-center text-center">
            <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-2">কৃষি কর্মকর্তা</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 font-bold text-base flex items-center justify-center flex-shrink-0">
                {krishiName[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900 leading-tight">{krishiName}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{STAFF[STAFF.length - 1].title}</p>
                <PhoneLink phone={krishiPhone} />
              </div>
            </div>
          </div>
        </div>

        {/* সাধারণ সদস্য */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-5">
          <SectionTitle icon="🧑‍💼" title="ওয়ার্ড সদস্য" />
          <div className="divide-y divide-gray-50">
            {MEMBERS.map(m => (
              <div key={m.ward} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {m.ward}
                  </span>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                </div>
                <PhoneLink phone={m.phone} />
              </div>
            ))}
          </div>
        </div>

        {/* সংরক্ষিত মহিলা সদস্য */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-5">
          <SectionTitle icon="👩" title="সংরক্ষিত মহিলা সদস্য" />
          <div className="divide-y divide-gray-50">
            {WOMEN_MEMBERS.map(m => (
              <div key={m.phone} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400">ওয়ার্ড {m.wards}</p>
                </div>
                <PhoneLink phone={m.phone} />
              </div>
            ))}
          </div>
        </div>

        {/* কর্মচারী */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-5">
          <SectionTitle icon="🗂️" title="কর্মকর্তা ও কর্মচারী" />
          <div className="divide-y divide-gray-50">
            {STAFF.map(s => (
              <div key={s.phone} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.title}</p>
                </div>
                <PhoneLink phone={s.phone} />
              </div>
            ))}
          </div>
        </div>

        {/* সেবাসমূহ */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-5">
          <SectionTitle icon="📋" title="ইউনিয়ন পরিষদের সেবাসমূহ" />
          <div className="divide-y divide-gray-50">
            {SERVICES.map(s => (
              <div key={s.name} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{s.icon}</span>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  s.fee === 'বিনামূল্যে'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-blue-50 text-blue-600'
                }`}>{s.fee}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-300 mt-3">* ফি পরিবর্তনযোগ্য, অফিসে যাচাই করুন</p>
        </div>

        {/* হাট-বাজার */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-5">
          <SectionTitle icon="🏪" title="হাট-বাজার" />
          <div className="divide-y divide-gray-50">
            {MARKETS.map(m => (
              <div key={m.name} className="flex items-center justify-between py-2.5">
                <p className="text-sm font-medium text-gray-800">{m.name}</p>
                <div className="text-right">
                  <p className="text-xs text-gray-500">আয়তন: {m.area}</p>
                  <p className="text-xs text-gray-400">চান্দিনা ভিটি: {m.stalls}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* জাতীয় জরুরি নম্বর */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-5">
          <SectionTitle icon="☎️" title="জাতীয় জরুরি নম্বর" />
          <div className="grid grid-cols-2 gap-2">
            {HOTLINES.map(h => (
              <a key={h.number} href={`tel:${h.number}`}
                className="flex items-center justify-between bg-gray-50/80 hover:bg-emerald-50 rounded-xl px-3 py-2.5 transition-colors">
                <span className="text-xs text-gray-600 font-medium">{h.label}</span>
                <span className="text-sm font-bold text-emerald-600">{h.number}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Source */}
        <p className="text-center text-xs text-gray-300">
          তথ্যসূত্র: hatkhulaup.sylhet.gov.bd
        </p>

      </div>
    </div>
  )
}
