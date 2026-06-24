import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const WHATSAPP_NUMBER = '8801310012276'

const SECTIONS = [
  {
    label: 'দোকান ও পণ্য',
    rows: [
      { text: 'দোকান তৈরি',          free: '১টি',       pro: '৩টি',        biz: '১০টি' },
      { text: 'পণ্য যোগ',            free: 'Unlimited', pro: 'Unlimited',  biz: 'Unlimited' },
      { text: 'WhatsApp অর্ডার',     free: true,        pro: true,         biz: true },
      { text: 'QR কোড',              free: true,        pro: true,         biz: true },
      { text: 'Verified badge ✓',    free: false,       pro: true,         biz: true },
      { text: 'Featured listing',    free: false,       pro: true,         biz: true },
      { text: 'Bulk import (Excel)', free: false,       pro: false,        biz: true },
      { text: 'Custom shop URL',     free: false,       pro: false,        biz: true },
    ],
  },
  {
    label: 'AI সুবিধা',
    rows: [
      { text: 'AI chat reply',         free: 'মাসে ১০০টি', pro: 'Unlimited',  biz: 'Unlimited' },
      { text: 'AI description',        free: 'মাসে ১০টি',  pro: 'Unlimited',  biz: 'Unlimited' },
      { text: 'Custom AI prompt',      free: false,         pro: true,         biz: true },
      { text: 'AI conversation stats', free: false,         pro: false,        biz: true },
    ],
  },
  {
    label: 'মার্কেটিং',
    rows: [
      { text: 'Broadcast message', free: 'মাসে ২টি', pro: 'Unlimited', biz: 'Unlimited' },
      { text: 'Analytics',         free: 'Basic',    pro: 'Advanced',  biz: 'Advanced' },
      { text: 'Landing page',      free: true,       pro: true,        biz: true },
    ],
  },
  {
    label: 'Business tools',
    rows: [
      { text: 'হিসাবের খাতা',   free: false, pro: true,  biz: true },
      { text: 'Invoice PDF',     free: false, pro: true,  biz: true },
      { text: 'Excel export',    free: false, pro: true,  biz: true },
      { text: 'Monthly report',  free: false, pro: true,  biz: true },
    ],
  },
  {
    label: 'সাপোর্ট',
    rows: [
      { text: 'Customer support', free: 'Community', pro: 'Email', biz: 'Priority' },
      { text: 'SMS notification', free: false,        pro: false,   biz: true },
    ],
  },
]

const plans = [
  {
    id: 'free', name: 'ফ্রি', price: '৳০', period: '',
    sub: 'শুরু করার জন্য', cta: 'এখনই শুরু করুন',
    ctaTo: '/register',
  },
  {
    id: 'pro', name: 'প্রো', price: '৳৪৯৯', period: '/ মাস',
    sub: 'ব্যবসা বাড়াতে', cta: 'প্রো শুরু করুন',
    ctaModal: true, badge: 'সবচেয়ে জনপ্রিয়',
  },
  {
    id: 'business', name: 'বিজনেস', price: '৳৯৯৯', period: '/ মাস',
    sub: 'বড় ব্যবসার জন্য', cta: 'বিজনেস শুরু করুন',
    ctaModal: true,
  },
]

const faqs = [
  { q: 'ফ্রি plan কতদিন ব্যবহার করা যাবে?', a: 'সীমাহীন সময়ের জন্য। ফ্রি plan-এ কোনো মেয়াদ নেই।' },
  { q: 'AI chat limit মাসে রিসেট হয়?', a: 'হ্যাঁ, প্রতি মাসের ১ তারিখে AI reply count শূন্য থেকে শুরু হয়।' },
  { q: 'Verified badge কীভাবে পাবো?', a: 'NID বা Trade License upload করুন। আমাদের টিম ২৪ ঘণ্টার মধ্যে verify করবে।' },
  { q: 'Payment কীভাবে করব?', a: 'bKash, Nagad, বা ব্যাংক ট্রান্সফারে payment নেওয়া হয়। Payment করার পর আমাদের সাথে যোগাযোগ করুন।' },
  { q: 'Plan upgrade করলে পুরোনো data থাকবে?', a: 'হ্যাঁ, সব data সুরক্ষিত থাকবে। Upgrade বা downgrade যেকোনো সময় করা যাবে।' },
]

function Dot({ type }) {
  if (type === 'ok')
    return <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
  if (type === 'lock')
    return <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">🔒</span>
  return <span className="w-5 h-5 rounded-full bg-red-100 text-red-400 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">✕</span>
}

function featVal(val) {
  if (val === true)  return { dot: 'ok',   text: null }
  if (val === false) return { dot: 'lock', text: null }
  return { dot: 'ok', text: val }
}

function PlanCard({ plan, onUpgrade }) {
  const isPro = plan.id === 'pro'
  const isBiz = plan.id === 'business'

  return (
    <div className={`bg-white rounded-2xl flex flex-col overflow-hidden ${
      isPro ? 'ring-2 ring-blue-500 shadow-xl' : 'border border-gray-200 shadow-sm'
    }`}>
      {isPro
        ? <div className="bg-blue-600 text-white text-xs font-semibold text-center py-1.5 tracking-wide">{plan.badge}</div>
        : <div className="h-[26px]" />
      }

      <div className="px-5 pt-5 pb-4">
        <p className={`text-sm font-semibold mb-1 ${isPro ? 'text-blue-600' : isBiz ? 'text-purple-600' : 'text-gray-500'}`}>
          {plan.name}
        </p>
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
          {plan.period && <span className="text-sm text-gray-400">{plan.period}</span>}
        </div>
        <p className="text-xs text-gray-400 mb-4">{plan.sub}</p>

        {plan.ctaModal ? (
          <button onClick={() => onUpgrade(plan)}
            className={`w-full text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 ${
              isPro ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}>
            {plan.cta}
          </button>
        ) : (
          <Link to={plan.ctaTo}
            className="block text-center text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            {plan.cta}
          </Link>
        )}
      </div>

      {/* Feature sections */}
      <div className="px-5 pb-6 flex-1 space-y-1">
        {SECTIONS.map(sec => {
          const key = plan.id === 'free' ? 'free' : plan.id === 'pro' ? 'pro' : 'biz'
          return (
            <div key={sec.label}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-4 mb-2 pb-1.5 border-b border-gray-100">
                {sec.label}
              </p>
              <ul className="space-y-2">
                {sec.rows.map((row, i) => {
                  const { dot, text } = featVal(row[key])
                  const isLocked = row[key] === false
                  return (
                    <li key={i} className={`flex items-start gap-2 text-sm ${isLocked ? 'opacity-40' : ''}`}>
                      <Dot type={dot} />
                      <span className={isLocked ? 'line-through text-gray-400' : 'text-gray-700'}>
                        {row.text}
                        {text && <span className="ml-1 text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{text}</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UpgradeModal({ plan, onClose }) {
  const msg = encodeURIComponent(
    `আসসালামু আলাইকুম! আমি শিবের বাজারে *${plan?.name}* Plan নিতে চাই (${plan?.price}${plan?.period})। আমার সাথে যোগাযোগ করুন।`
  )
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 pt-8 pb-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.533 5.855L.057 23.882a.5.5 0 0 0 .61.61l6.086-1.458A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.522-5.176-1.431l-.372-.22-3.853.923.941-3.786-.242-.388A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-1">{plan?.name} Plan</h2>
          <p className="text-white/80 text-sm">WhatsApp-এ যোগাযোগ করুন</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{plan?.price}</span>
            <span className="text-sm text-gray-400">{plan?.period}</span>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full ml-1">/ প্রতি মাস</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {[
              { n: '১', text: 'নিচের বাটনে click করুন' },
              { n: '২', text: 'WhatsApp-এ message পাঠান' },
              { n: '৩', text: 'bKash/Nagad-এ payment করুন' },
              { n: '৪', text: '২৪ ঘণ্টার মধ্যে plan active হবে' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</span>
                <span className="text-sm text-gray-700">{s.text}</span>
              </div>
            ))}
          </div>

          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.122 1.533 5.855L.057 23.882a.5.5 0 0 0 .61.61l6.086-1.458A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.522-5.176-1.431l-.372-.22-3.853.923.941-3.786-.242-.388A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            WhatsApp-এ যোগাযোগ করুন
          </a>

          <p className="text-center text-xs text-gray-400">
            অথবা সরাসরি call করুন:{' '}
            <a href="tel:+8801310012276" className="text-blue-600 font-semibold">01310-012276</a>
          </p>

          <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            পরে করব
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [upgradeModal, setUpgradeModal] = useState(null)

  return (
    <div className="min-h-screen pb-28 md:pb-16" style={{ background: '#f5f5f5' }}>
      <SEO title="মূল্য তালিকা — শিবের বাজার" description="শিবের বাজারের ফ্রি, প্রো ও বিজনেস প্ল্যানের বিস্তারিত মূল্য তালিকা।" />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <span className="inline-block text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full mb-4">মূল্য তালিকা</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">সহজ মূল্যে শক্তিশালী দোকান</h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
            ফ্রি plan দিয়ে শুরু করুন, প্রয়োজনে upgrade করুন। কোনো hidden charge নেই।
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onUpgrade={setUpgradeModal} />
          ))}
        </div>

        {/* Contact note */}
        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
          <p className="text-sm text-blue-800 font-medium mb-1">আপগ্রেড করতে বা প্রশ্ন থাকলে</p>
          <p className="text-xs text-blue-600 mb-3">Payment করার পর আমাদের সাথে যোগাযোগ করুন — ২৪ ঘণ্টার মধ্যে activate হবে।</p>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
            className="inline-block text-xs font-semibold bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors">
            WhatsApp করুন
          </a>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-gray-800 mb-5">সাধারণ প্রশ্ন</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">{faq.q}</p>
                <p className="text-sm text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {upgradeModal && (
        <UpgradeModal plan={upgradeModal} onClose={() => setUpgradeModal(null)} />
      )}
    </div>
  )
}
