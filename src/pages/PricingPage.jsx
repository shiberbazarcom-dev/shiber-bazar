import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

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
    ctaTo: '/register',
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
    ctaTo: '/register',
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

export default function PricingPage() {
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

                <Link to={plan.ctaTo}
                  className={`block text-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors mb-6 ${plan.ctaStyle}`}>
                  {plan.cta}
                </Link>

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
    </div>
  )
}
