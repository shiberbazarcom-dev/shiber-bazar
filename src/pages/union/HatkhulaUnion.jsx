import SEO from '../../components/SEO'

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

const MARKETS = [
  { name: 'শিবের বাজার',      area: '৩ একর',  stalls: '১৫০ টি' },
  { name: 'পিঠারগঞ্জ বাজার', area: '১ একর',  stalls: '৪০ টি'  },
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

export default function HatkhulaUnion() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO
        title="হাটখোলা ইউনিয়ন পরিষদ"
        description="২নং হাটখোলা ইউনিয়ন পরিষদ — চেয়ারম্যান, সদস্য, কর্মচারী ও জরুরি যোগাযোগ নম্বর।"
      />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <div className="text-3xl mb-2">🏛️</div>
          <h1 className="text-lg font-bold text-gray-900">২নং হাটখোলা ইউনিয়ন পরিষদ</h1>
          <p className="text-xs text-gray-400 mt-1">সিলেট সদর উপজেলা, সিলেট জেলা</p>
          <a href="mailto:hatkhulaunion@gmail.com"
            className="inline-flex items-center gap-1 text-xs text-blue-500 mt-2 hover:underline">
            ✉️ hatkhulaunion@gmail.com
          </a>
        </div>

        {/* Chairman */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <SectionTitle icon="👤" title="চেয়ারম্যান" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-700 font-bold text-xl flex items-center justify-center flex-shrink-0">
              {CHAIRMAN.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{CHAIRMAN.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{CHAIRMAN.title} • {CHAIRMAN.district}</p>
              <PhoneLink phone={CHAIRMAN.phone} />
            </div>
          </div>
        </div>

        {/* সাধারণ সদস্য */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <SectionTitle icon="🧑‍💼" title="ওয়ার্ড সদস্য" />
          <div className="divide-y divide-gray-50">
            {MEMBERS.map(m => (
              <div key={m.ward} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
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

        {/* হাট-বাজার */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <SectionTitle icon="☎️" title="জাতীয় জরুরি নম্বর" />
          <div className="grid grid-cols-2 gap-2">
            {HOTLINES.map(h => (
              <a key={h.number} href={`tel:${h.number}`}
                className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 transition-colors">
                <span className="text-xs text-gray-600 font-medium">{h.label}</span>
                <span className="text-sm font-bold text-blue-600">{h.number}</span>
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
