import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const WHATSAPP_NUMBER = '8801310012276'

const plans = [
  {
    id: 'free',
    name: 'ফ্রি',
    price: '৳০',
    period: '',
    sub: 'শুরু করার জন্য',
    cta: 'এখনই শুরু করুন',
    ctaTo: '/register',
    ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    features: [
      { text: '১টি দোকান', ok: true },
      { text: 'Unlimited পণ্য', ok: true },
      { text: 'AI chat — মাসে ১০০টি reply', ok: true },
      { text: 'AI product description — মাসে ১০টি', ok: true },
      { text: 'WhatsApp-এ order notification', ok: true },
      { text: 'QR কোড', ok: true },
      { text: 'Basic analytics', ok: true },
      { text: 'মাসে ২টি broadcast', ok: true },
      { text: 'Landing page builder', ok: true },
      { text: 'হিসাবের খাতা (basic)', ok: true },
      { text: 'Featured listing', ok: false },
      { text: 'Verified badge', ok: false },
      { text: 'Invoice PDF', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'প্রো',
    price: '৳৪৯৯',
    period: '/ মাস',
    sub: 'ব্যবসা বাড়াতে',
    cta: 'প্রো শুরু করুন',
    ctaModal: true,
    ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700',
    badge: 'সবচেয়ে জনপ্রিয়',
    features: [
      { text: '৩টি দোকান', ok: true },
      { text: 'Unlimited পণ্য', ok: true },
      { text: 'Unlimited AI chat', ok: true },
      { text: 'Unlimited AI product description', ok: true },
      { text: 'WhatsApp-এ order notification', ok: true },
      { text: 'QR কোড', ok: true },
      { text: 'Advanced analytics', ok: true },
      { text: 'Unlimited broadcast', ok: true },
      { text: 'Landing page builder', ok: true },
      { text: 'হিসাবের খাতা + Excel export', ok: true },
      { text: 'Featured listing (home + search)', ok: true },
      { text: 'Verified badge ✓', ok: true },
      { text: 'Invoice PDF', ok: true },
    ],
  },
  {
    id: 'business',
    name: 'বিজনেস',
    price: '৳৯৯৯',
    period: '/ মাস',
    sub: 'বড় ব্যবসার জন্য',
    cta: 'বিজনেস শুরু করুন',
    ctaModal: true,
    ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    features: [
      { text: '১০টি দোকান', ok: true },
      { text: 'প্রো-এর সব কিছু', ok: true },
      { text: 'Custom shop URL', ok: true },
      { text: 'AI conversation analytics', ok: true },
      { text: 'Bulk product import (Excel)', ok: true },
      { text: 'Priority support', ok: true },
      { text: 'SMS order notification', ok: true },
    ],
  },
]

const faqs = [
  {
    q: 'ফ্রি plan কতদিন ব্যবহার করা যাবে?',
    a: 'সীমাহীন সময়ের জন্য। ফ্রি plan-এ কোনো মেয়াদ নেই।',
  },
  {
    q: 'AI chat limit মাসে রিসেট হয়?',
    a: 'হ্যাঁ, প্রতি মাসের ১ তারিখে AI reply count শূন্য থেকে শুরু হয়।',
  },
  {
    q: 'Verified badge কীভাবে পাবো?',
    a: 'NID বা Trade License upload করুন। আমাদের টিম ২৪ ঘণ্টার মধ্যে verify করবে।',
  },
  {
    q: 'Payment কীভাবে করব?',
    a: 'bKash, Nagad, বা ব্যাংক ট্রান্সফারে payment নেওয়া হয়। Payment করার পর আমাদের সাথে যোগাযোগ করুন।',
  },
  {
    q: 'plan upgrade করলে পুরোনো data থাকবে?',
    a: 'হ্যাঁ, সব data সুরক্ষিত থাকবে। Upgrade বা downgrade যেকোনো সময় করা যাবে।',
  },
]

function Check() {
  return (
    <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Cross() {
  return (
    <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function UpgradeModal({ plan, onClose }) {
  const msg = encodeURIComponent(
    `আসসালামু আলাইকুম! আমি শিবের বাজারে *${plan?.name}* Plan নিতে চাই (${plan?.price}${plan?.period})। আমার সাথে যোগাযোগ করুন।`
  )
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet — slides up on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden animate-slideUp">

        {/* Green header */}
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
          {/* Price chip */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{plan?.price}</span>
            <span className="text-sm text-gray-400">{plan?.period}</span>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded-full ml-1">/ প্রতি মাস</span>
          </div>

          {/* Steps */}
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

          {/* WhatsApp CTA */}
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

          <button onClick={onClose}
            className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            পরে করব
          </button>
        </div>
      </div>
    </div>
  )
}

function CellValue({ val, highlight }) {
  const base = `px-4 py-3 text-center text-sm flex items-center justify-center ${highlight ? 'bg-blue-50/60' : ''}`
  if (val === true) return (
    <div className={base}>
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
  if (val === false) return (
    <div className={base}>
      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  )
  return <div className={`${base} font-medium text-gray-700`}>{val}</div>
}

export default function PricingPage() {
  const [upgradeModal, setUpgradeModal] = useState(null) // plan object

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

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id}
              className={`bg-white rounded-2xl overflow-hidden flex flex-col ${plan.badge ? 'ring-2 ring-blue-500 shadow-lg' : 'border border-gray-200'}`}>
              {plan.badge ? (
                <div className="bg-blue-600 text-white text-xs font-semibold text-center py-1.5">{plan.badge}</div>
              ) : (
                <div className="h-[30px]" />
              )}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-sm font-semibold text-gray-500 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm text-gray-400">{plan.period}</span>}
                </div>
                <p className="text-xs text-gray-400 mb-6">{plan.sub}</p>

                {plan.ctaModal ? (
                  <button
                    onClick={() => setUpgradeModal(plan)}
                    className={`w-full text-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors mb-6 ${plan.ctaStyle}`}>
                    {plan.cta}
                  </button>
                ) : (
                  <Link to={plan.ctaTo}
                    className={`block text-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors mb-6 ${plan.ctaStyle}`}>
                    {plan.cta}
                  </Link>
                )}

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      {f.ok ? <Check /> : <Cross />}
                      <span className={`text-sm ${f.ok ? 'text-gray-700' : 'text-gray-400'}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">সব features তুলনা করুন</h2>
          <p className="text-sm text-gray-400 text-center mb-8">কোন plan-এ কী আছে — বিস্তারিত</p>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Sticky header */}
            <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50">
              <div className="p-4" />
              <div className="p-4 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ফ্রি</p>
                <p className="text-lg font-bold text-gray-900">৳০</p>
              </div>
              <div className="p-4 text-center bg-blue-50">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">প্রো</p>
                <p className="text-lg font-bold text-blue-700">৳৪৯৯</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">বিজনেস</p>
                <p className="text-lg font-bold text-gray-900">৳৯৯৯</p>
              </div>
            </div>

            {[
              {
                section: 'দোকান ও পণ্য',
                rows: [
                  { label: 'দোকানের সংখ্যা',           free: '১টি',        pro: '৩টি',        biz: '১০টি' },
                  { label: 'পণ্যের সংখ্যা',             free: 'Unlimited',  pro: 'Unlimited',  biz: 'Unlimited' },
                  { label: 'Bulk product import (Excel)', free: false,       pro: false,        biz: true },
                  { label: 'Verified badge',             free: false,        pro: true,         biz: true },
                  { label: 'Featured listing',           free: false,        pro: true,         biz: true },
                  { label: 'Custom shop URL',            free: false,        pro: false,        biz: true },
                ],
              },
              {
                section: 'AI সুবিধা',
                rows: [
                  { label: 'AI chat reply',              free: 'মাসে ১০০টি', pro: 'Unlimited',  biz: 'Unlimited' },
                  { label: 'AI product description',     free: 'মাসে ১০টি', pro: 'Unlimited',  biz: 'Unlimited' },
                  { label: 'AI landing page content',    free: 'মাসে ৫টি',  pro: 'Unlimited',  biz: 'Unlimited' },
                  { label: 'AI conversation analytics',  free: false,        pro: false,        biz: true },
                ],
              },
              {
                section: 'অর্ডার ও নোটিফিকেশন',
                rows: [
                  { label: 'WhatsApp order notification', free: true,        pro: true,         biz: true },
                  { label: 'SMS order notification',     free: false,        pro: false,        biz: true },
                  { label: 'Invoice PDF',                free: false,        pro: true,         biz: true },
                  { label: 'Order tracking',             free: true,         pro: true,         biz: true },
                ],
              },
              {
                section: 'মার্কেটিং ও Analytics',
                rows: [
                  { label: 'Broadcast',                  free: 'মাসে ২টি',  pro: 'Unlimited',  biz: 'Unlimited' },
                  { label: 'Analytics',                  free: 'Basic',     pro: 'Advanced',   biz: 'Advanced' },
                  { label: 'Landing page builder',       free: true,        pro: true,         biz: true },
                  { label: 'QR কোড',                    free: true,        pro: true,         biz: true },
                ],
              },
              {
                section: 'অ্যাকাউন্টিং',
                rows: [
                  { label: 'হিসাবের খাতা',              free: 'Basic',     pro: 'Full',       biz: 'Full' },
                  { label: 'Excel export',               free: false,       pro: true,         biz: true },
                  { label: 'Monthly report',             free: false,       pro: true,         biz: true },
                ],
              },
              {
                section: 'সাপোর্ট',
                rows: [
                  { label: 'Customer support',           free: 'Community', pro: 'Email',      biz: 'Priority' },
                ],
              },
            ].map(group => (
              <div key={group.section}>
                {/* Section header */}
                <div className="grid grid-cols-4 bg-gray-50 border-t border-gray-100">
                  <div className="col-span-4 px-4 py-2.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.section}</span>
                  </div>
                </div>
                {/* Rows */}
                {group.rows.map((row, i) => (
                  <div key={i} className="grid grid-cols-4 border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <div className="px-4 py-3 text-sm text-gray-700">{row.label}</div>
                    <CellValue val={row.free} />
                    <CellValue val={row.pro} highlight />
                    <CellValue val={row.biz} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Contact note */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
          <p className="text-sm text-blue-800 font-medium mb-1">আপগ্রেড করতে বা প্রশ্ন থাকলে</p>
          <p className="text-xs text-blue-600 mb-3">Payment করার পর আমাদের সাথে যোগাযোগ করুন — ২৪ ঘণ্টার মধ্যে activate হবে।</p>
          <Link to="/contact" className="inline-block text-xs font-semibold bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors">
            যোগাযোগ করুন
          </Link>
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
