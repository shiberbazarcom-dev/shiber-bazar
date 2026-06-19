import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import OrderModal from '../components/order/OrderModal'
import SEO from '../components/SEO'

/* ─── helpers ─── */
const fmt = (n) => '৳' + Number(n || 0).toLocaleString('bn-BD')
const wa = (phone, msg) => `https://wa.me/88${phone.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`

const TEMPLATE_COLORS = {
  1: { primary: '#16a34a', light: '#f0fdf4', text: '#14532d' },
  2: { primary: '#2563eb', light: '#eff6ff', text: '#1e3a8a' },
  3: { primary: '#dc2626', light: '#fef2f2', text: '#7f1d1d' },
  4: { primary: '#374151', light: '#f9fafb', text: '#111827' },
  5: { primary: '#b45309', light: '#fffbeb', text: '#78350f' },
  6: { primary: '#f5c518', light: '#fff8e1', text: '#1a1a1a' },
}

/* ── countdown ── */
function Countdown({ end }) {
  const calc = () => {
    const diff = new Date(end) - new Date()
    if (diff <= 0) return { h: 0, m: 0, s: 0 }
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }
  const [t, setT] = useState(calc())
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id) }, [end])
  const pad = n => String(n).padStart(2, '0')
  return (
    <div className="flex items-center justify-center gap-2 my-4">
      {[['ঘণ্টা', t.h], ['মিনিট', t.m], ['সেকেন্ড', t.s]].map(([label, val]) => (
        <div key={label} className="text-center">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white bg-black/30">
            {pad(val)}
          </div>
          <p className="text-xs mt-1 opacity-70">{label}</p>
        </div>
      ))}
    </div>
  )
}

/* ── FAQ accordion ── */
function Faq({ faqs, color }) {
  const [open, setOpen] = useState(null)
  if (!faqs?.length) return null
  return (
    <div className="space-y-2">
      {faqs.map((f, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-4 py-3.5 flex items-center justify-between font-semibold text-sm text-gray-800">
            {f.q}
            <svg className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${open === i ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
              {f.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════
   TEMPLATES
══════════════════════════════════════════════ */

/* Template 1 — Classic Green (Facebook ad style) */
function T1({ lp, color, onOrder }) {
  return (
    <div className="min-h-screen" style={{ background: color.primary }}>
      {/* hero */}
      <div className="text-center px-5 pt-10 pb-8">
        {lp.badge_text && (
          <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
            {lp.badge_text}
          </span>
        )}
        <h1 className="text-white text-2xl sm:text-3xl font-extrabold leading-tight mb-3 drop-shadow">
          {lp.headline}
        </h1>
        {lp.subheadline && (
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">{lp.subheadline}</p>
        )}
        {lp.countdown_end && <Countdown end={lp.countdown_end} />}
        <button onClick={onOrder}
          className="mt-6 w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-extrabold text-white shadow-lg active:scale-95 transition-all"
          style={{ background: 'rgba(0,0,0,0.25)' }}>
          🛒 {lp.cta_text}
        </button>
      </div>

      {/* product image */}
      {lp.hero_image_url && (
        <div className="px-5 pb-6">
          <img src={lp.hero_image_url} alt={lp.product_name}
            className="w-full max-w-sm mx-auto rounded-3xl shadow-2xl object-cover" style={{ maxHeight: 320 }} />
        </div>
      )}

      {/* white card body */}
      <div className="bg-white rounded-t-3xl px-5 pt-6 pb-20 space-y-8">
        {/* price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold" style={{ color: color.primary }}>{fmt(lp.product_price)}</p>
            {lp.product_original_price && (
              <p className="text-sm text-gray-400 line-through">{fmt(lp.product_original_price)}</p>
            )}
          </div>
          {lp.product_original_price && lp.product_price && (
            <div className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
              {Math.round((1 - lp.product_price / lp.product_original_price) * 100)}% ছাড়
            </div>
          )}
        </div>

        {lp.product_description && (
          <p className="text-gray-600 text-sm leading-relaxed">{lp.product_description}</p>
        )}

        {/* features */}
        {lp.features?.length > 0 && (
          <div>
            <h3 className="font-extrabold text-gray-800 mb-3">✅ কেন কিনবেন?</h3>
            <ul className="space-y-2">
              {lp.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-base" style={{ color: color.primary }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FAQs */}
        {lp.faqs?.length > 0 && (
          <div>
            <h3 className="font-extrabold text-gray-800 mb-3">❓ প্রশ্ন ও উত্তর</h3>
            <Faq faqs={lp.faqs} color={color} />
          </div>
        )}

        {/* order CTA */}
        <div className="space-y-3">
          <button onClick={onOrder}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-base shadow-lg active:scale-95 transition-all"
            style={{ background: color.primary }}>
            🛒 {lp.cta_text}
          </button>
          {lp.show_whatsapp && lp.phone && (
            <a href={wa(lp.phone, lp.whatsapp_message || `${lp.product_name} অর্ডার করতে চাই`)}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm"
              style={{ background: '#25d366' }}>
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp এ অর্ডার করুন
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* Template 2 — Bold Blue (split layout) */
function T2({ lp, color, onOrder }) {
  return (
    <div className="min-h-screen bg-white">
      {/* blue top half */}
      <div className="px-5 pt-10 pb-6 text-white" style={{ background: `linear-gradient(135deg, ${color.text}, ${color.primary})` }}>
        {lp.badge_text && (
          <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 backdrop-blur">
            {lp.badge_text}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">{lp.headline}</h1>
        {lp.subheadline && <p className="text-white/80 text-sm">{lp.subheadline}</p>}
        {lp.countdown_end && <Countdown end={lp.countdown_end} />}
      </div>

      {/* image + price card */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-4 flex gap-4 items-center">
          {lp.hero_image_url
            ? <img src={lp.hero_image_url} alt="" className="w-28 h-28 rounded-2xl object-cover flex-shrink-0" />
            : <div className="w-28 h-28 rounded-2xl bg-gray-100 flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm mb-1">{lp.product_name}</p>
            <p className="text-2xl font-extrabold" style={{ color: color.primary }}>{fmt(lp.product_price)}</p>
            {lp.product_original_price && (
              <p className="text-xs text-gray-400 line-through">{fmt(lp.product_original_price)}</p>
            )}
            <button onClick={onOrder}
              className="mt-3 w-full py-2.5 rounded-xl text-white text-sm font-bold active:scale-95"
              style={{ background: color.primary }}>
              🛒 {lp.cta_text}
            </button>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="px-5 pt-6 pb-24 space-y-6">
        {lp.product_description && (
          <p className="text-gray-600 text-sm leading-relaxed">{lp.product_description}</p>
        )}
        {lp.features?.length > 0 && (
          <div>
            <h3 className="font-extrabold text-gray-800 mb-3">✅ সুবিধাসমূহ</h3>
            <div className="grid grid-cols-1 gap-2">
              {lp.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: color.primary }}>{i + 1}</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
        {lp.faqs?.length > 0 && (
          <div>
            <h3 className="font-extrabold text-gray-800 mb-3">❓ প্রশ্ন ও উত্তর</h3>
            <Faq faqs={lp.faqs} color={color} />
          </div>
        )}
      </div>

      {/* sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
        <button onClick={onOrder}
          className="flex-1 py-3.5 rounded-2xl text-white font-extrabold text-sm active:scale-95"
          style={{ background: color.primary }}>
          🛒 {lp.cta_text}
        </button>
        {lp.show_whatsapp && lp.phone && (
          <a href={wa(lp.phone, lp.whatsapp_message || `${lp.product_name} অর্ডার করতে চাই`)}
            target="_blank" rel="noreferrer"
            className="w-14 flex items-center justify-center rounded-2xl text-white"
            style={{ background: '#25d366' }}>
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
        )}
      </div>
    </div>
  )
}

/* Template 3 — Red Offer (urgency + big discount) */
function T3({ lp, color, onOrder }) {
  const disc = lp.product_original_price && lp.product_price
    ? Math.round((1 - lp.product_price / lp.product_original_price) * 100) : 0
  return (
    <div className="min-h-screen bg-gray-50">
      {/* red banner */}
      <div className="text-white text-center px-5 py-8" style={{ background: color.primary }}>
        {disc > 0 && (
          <div className="inline-block bg-yellow-400 text-red-900 font-extrabold text-4xl w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            -{disc}%
          </div>
        )}
        {lp.badge_text && <p className="text-yellow-300 font-bold text-sm mb-2">{lp.badge_text}</p>}
        <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">{lp.headline}</h1>
        {lp.countdown_end && <Countdown end={lp.countdown_end} />}
      </div>

      {/* product */}
      <div className="px-5 py-6 space-y-5">
        {lp.hero_image_url && (
          <img src={lp.hero_image_url} alt="" className="w-full rounded-2xl object-cover shadow-md" style={{ maxHeight: 280 }} />
        )}

        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="font-bold text-gray-700 mb-1">{lp.product_name}</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-extrabold" style={{ color: color.primary }}>{fmt(lp.product_price)}</span>
            {lp.product_original_price && (
              <span className="text-gray-400 line-through text-lg">{fmt(lp.product_original_price)}</span>
            )}
          </div>
        </div>

        {lp.product_description && (
          <p className="text-gray-600 text-sm leading-relaxed">{lp.product_description}</p>
        )}

        {lp.features?.length > 0 && (
          <div className="bg-white rounded-2xl p-4 space-y-2 shadow-sm">
            {lp.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 font-bold">✓</span> {f}
              </div>
            ))}
          </div>
        )}

        {lp.faqs?.length > 0 && (
          <div>
            <h3 className="font-extrabold text-gray-800 mb-3">❓ প্রশ্ন ও উত্তর</h3>
            <Faq faqs={lp.faqs} color={color} />
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button onClick={onOrder}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-lg shadow-lg active:scale-95"
            style={{ background: color.primary }}>
            🛒 {lp.cta_text}
          </button>
          {lp.show_whatsapp && lp.phone && (
            <a href={wa(lp.phone, lp.whatsapp_message || `${lp.product_name} অর্ডার করতে চাই`)}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold"
              style={{ background: '#25d366' }}>
              WhatsApp এ অর্ডার করুন
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* Template 4 — Minimal (clean, professional) */
function T4({ lp, color, onOrder }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 py-10 space-y-8">
        {/* badge */}
        {lp.badge_text && (
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{lp.badge_text}</span>
        )}

        {/* headline */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{lp.headline}</h1>
          {lp.subheadline && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{lp.subheadline}</p>}
        </div>

        {/* image */}
        {lp.hero_image_url && (
          <img src={lp.hero_image_url} alt="" className="w-full rounded-2xl object-cover" style={{ maxHeight: 300 }} />
        )}

        {/* price row */}
        <div className="flex items-center gap-4 border-y border-gray-100 py-5">
          <div>
            <p className="text-3xl font-extrabold text-gray-900">{fmt(lp.product_price)}</p>
            {lp.product_original_price && (
              <p className="text-sm text-gray-400 line-through">{fmt(lp.product_original_price)}</p>
            )}
          </div>
          {lp.product_original_price && lp.product_price && (
            <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-gray-900 text-white">
              -{Math.round((1 - lp.product_price / lp.product_original_price) * 100)}% ছাড়
            </span>
          )}
        </div>

        {lp.product_description && (
          <p className="text-gray-600 text-sm leading-relaxed">{lp.product_description}</p>
        )}

        {lp.features?.length > 0 && (
          <ul className="space-y-3">
            {lp.features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        )}

        {lp.faqs?.length > 0 && (
          <div>
            <h3 className="font-extrabold text-gray-800 mb-3 text-sm uppercase tracking-wide">প্রশ্ন ও উত্তর</h3>
            <Faq faqs={lp.faqs} color={color} />
          </div>
        )}

        <div className="space-y-3 pb-10">
          <button onClick={onOrder}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-base bg-gray-900 active:scale-95">
            {lp.cta_text} →
          </button>
          {lp.show_whatsapp && lp.phone && (
            <a href={wa(lp.phone, lp.whatsapp_message || `${lp.product_name} অর্ডার করতে চাই`)}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50">
              <svg className="w-4 h-4 fill-green-500" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp এ যোগাযোগ
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* Template 5 — Gold Premium */
function T5({ lp, color, onOrder }) {
  return (
    <div className="min-h-screen" style={{ background: '#1c1008' }}>
      {/* golden header */}
      <div className="text-center px-5 pt-12 pb-8">
        {lp.badge_text && (
          <span className="inline-block border border-yellow-600 text-yellow-400 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            {lp.badge_text}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3" style={{ color: '#fbbf24' }}>
          {lp.headline}
        </h1>
        {lp.subheadline && <p className="text-amber-200/70 text-sm leading-relaxed">{lp.subheadline}</p>}
        {lp.countdown_end && <Countdown end={lp.countdown_end} />}
      </div>

      {/* image */}
      {lp.hero_image_url && (
        <div className="px-6 pb-6">
          <img src={lp.hero_image_url} alt="" className="w-full max-w-sm mx-auto rounded-3xl object-cover shadow-2xl" style={{ maxHeight: 300, border: '2px solid #b45309' }} />
        </div>
      )}

      {/* cream card */}
      <div className="rounded-t-3xl px-5 pt-6 pb-24 space-y-6" style={{ background: '#fffbeb' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-amber-900">{lp.product_name}</p>
            <p className="text-2xl font-extrabold text-amber-800">{fmt(lp.product_price)}</p>
            {lp.product_original_price && (
              <p className="text-sm text-amber-400 line-through">{fmt(lp.product_original_price)}</p>
            )}
          </div>
          {lp.product_original_price && lp.product_price && (
            <div className="bg-amber-600 text-white text-sm font-bold px-3 py-1.5 rounded-full">
              -{Math.round((1 - lp.product_price / lp.product_original_price) * 100)}%
            </div>
          )}
        </div>

        {lp.product_description && (
          <p className="text-amber-900 text-sm leading-relaxed">{lp.product_description}</p>
        )}

        {lp.features?.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-extrabold text-amber-900 mb-3">✅ বিশেষত্ব</h3>
            {lp.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-100 rounded-xl p-3">
                <span className="text-amber-600 font-bold">★</span> {f}
              </div>
            ))}
          </div>
        )}

        {lp.faqs?.length > 0 && (
          <div>
            <h3 className="font-extrabold text-amber-900 mb-3">❓ প্রশ্ন ও উত্তর</h3>
            <Faq faqs={lp.faqs} color={color} />
          </div>
        )}

        <div className="space-y-3">
          <button onClick={onOrder}
            className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-lg active:scale-95"
            style={{ background: 'linear-gradient(135deg, #b45309, #d97706)' }}>
            🛒 {lp.cta_text}
          </button>
          {lp.show_whatsapp && lp.phone && (
            <a href={wa(lp.phone, lp.whatsapp_message || `${lp.product_name} অর্ডার করতে চাই`)}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold"
              style={{ background: '#25d366' }}>
              WhatsApp এ অর্ডার করুন
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* Template 6 — নাহাল স্টাইল (Yellow/Black + inline order form) */
function T6({ lp, color, onOrder }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', district: 'Dhaka' })
  const [qty, setQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const price = Number(lp.product_price || 0)
  const total = price * qty

  const DISTRICTS = ['Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh','Comilla','Narayanganj']

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) return
    setSubmitting(true)
    await supabase.from('orders').insert({
      shop_id: lp.shop_id,
      customer_name: form.name,
      customer_phone: form.phone,
      customer_address: `${form.address}, ${form.district}`,
      product_name: `${lp.product_name} ×${qty}`,
      total_amount: total,
      status: 'pending',
    })
    setSubmitting(false)
    setDone(true)
  }

  const YELLOW = '#f5c518'
  const BLACK = '#1a1a1a'

  if (done) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: YELLOW }}>
      <div className="text-center px-5">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-extrabold text-black mb-2">অর্ডার কনফার্ম হয়েছে!</h2>
        <p className="text-black/70 text-sm">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
        {lp.show_whatsapp && lp.phone && (
          <a href={wa(lp.phone, `আমার অর্ডার কনফার্ম হয়েছে। নাম: ${form.name}, ফোন: ${form.phone}`)}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl text-white font-bold"
            style={{ background: '#25d366' }}>
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp এ যোগাযোগ
          </a>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#fff8e1' }}>
      {/* top logo + offer strip */}
      <div style={{ background: YELLOW }} className="px-4 pt-5 pb-4 text-center">
        {lp.hero_image_url && (
          <img src={lp.hero_image_url} alt="logo"
            className="w-16 h-16 object-contain mx-auto mb-3 rounded-full bg-white p-1 shadow"
            onError={e => e.target.style.display='none'} />
        )}
        {/* offer strip */}
        {lp.badge_text && (
          <div className="flex items-center justify-between text-xs font-bold text-black/70 mb-3">
            <span>{lp.badge_text}</span>
            {lp.subheadline && <span>{lp.subheadline}</span>}
          </div>
        )}
        {/* big CTA */}
        <button onClick={() => document.getElementById('t6-order-form').scrollIntoView({ behavior: 'smooth' })}
          className="w-full max-w-xs mx-auto flex items-center justify-center py-4 rounded-xl text-white text-base font-extrabold shadow-lg"
          style={{ background: BLACK }}>
          {lp.cta_text}
        </button>
      </div>

      {/* main product image */}
      {lp.hero_image_url && (
        <div className="px-4 pt-4">
          <img src={lp.hero_image_url} alt={lp.product_name}
            className="w-full rounded-2xl object-cover shadow-md" style={{ maxHeight: 300 }} />
        </div>
      )}

      {/* features grid */}
      {lp.features?.length > 0 && (
        <div className="px-4 pt-5">
          <div className="border-2 border-black rounded-xl overflow-hidden">
            <div className="text-center font-extrabold text-sm py-2 text-white" style={{ background: BLACK }}>
              এই পণ্যের বৈশিষ্ট্য
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-200">
              {lp.features.map((f, i) => (
                <div key={i} className="p-3 text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="font-bold text-black flex-shrink-0">{i + 1}.</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* second CTA */}
      <div className="px-4 pt-5">
        <button onClick={() => document.getElementById('t6-order-form').scrollIntoView({ behavior: 'smooth' })}
          className="w-full py-4 rounded-xl text-white font-extrabold text-base"
          style={{ background: BLACK }}>
          {lp.cta_text}
        </button>
      </div>

      {/* product description */}
      {lp.product_description && (
        <div className="px-4 pt-5">
          <p className="text-sm text-gray-700 leading-relaxed">{lp.product_description}</p>
        </div>
      )}

      {/* FAQ */}
      {lp.faqs?.length > 0 && (
        <div className="px-4 pt-5">
          <h3 className="font-extrabold text-gray-800 mb-3 text-center">প্রশ্ন ও উত্তর</h3>
          <Faq faqs={lp.faqs} color={{ primary: BLACK }} />
        </div>
      )}

      {/* pricing box */}
      <div className="mx-4 mt-5 border-2 border-gray-200 rounded-xl p-4" style={{ background: '#fffde7' }}>
        <p className="text-center font-extrabold text-sm text-gray-700 mb-2">এই পণ্যের মূল্য</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-black">{fmt(lp.product_price)}</p>
            {lp.product_original_price && (
              <p className="text-sm text-gray-400 line-through">{fmt(lp.product_original_price)}</p>
            )}
          </div>
          {lp.product_original_price && lp.product_price && (
            <span className="text-green-600 font-bold text-sm">
              {fmt(Number(lp.product_original_price) - Number(lp.product_price))} সাশ্রয়!
            </span>
          )}
        </div>
      </div>

      {/* inline order form */}
      <div id="t6-order-form" className="mx-4 mt-5 mb-10 rounded-2xl overflow-hidden border-2 border-gray-200 bg-white">
        {/* form header */}
        <div className="text-center py-3 font-extrabold text-white text-sm" style={{ background: BLACK }}>
          অর্ডার করতে নিচের ফর্মটি সঠিকভাবে পূরণ করুন
        </div>

        {/* product row */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-3 border border-yellow-200">
            <div className="w-5 h-5 rounded-full border-2 border-yellow-500 flex items-center justify-center flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            </div>
            {lp.hero_image_url && (
              <img src={lp.hero_image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800 leading-snug">{lp.product_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{fmt(lp.product_price)} × {qty} = {fmt(price * qty)}</p>
            </div>
            {/* qty */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg bg-gray-100 font-bold text-gray-700 flex items-center justify-center">−</button>
              <span className="w-6 text-center font-bold text-sm">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="w-7 h-7 rounded-lg font-bold text-white flex items-center justify-center" style={{ background: YELLOW, color: BLACK }}>+</button>
            </div>
          </div>
        </div>

        {/* billing form */}
        <div className="p-4 space-y-3">
          <p className="font-bold text-sm text-gray-700">Billing & Shipping</p>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="পূরা নাম *" required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400" />
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="মোবাইল নম্বর *" required type="tel"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400" />
          <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="ঠিকানা"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400" />
          <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 bg-white">
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* order summary */}
        <div className="mx-4 mb-4 border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 font-bold text-xs text-gray-600 border-b border-gray-200">Your order</div>
          <div className="px-3 py-2 flex justify-between text-xs text-gray-600">
            <span>Product</span><span>Subtotal</span>
          </div>
          <div className="px-3 py-1 flex justify-between text-xs text-gray-700">
            <span className="truncate flex-1 mr-2">{lp.product_name} × {qty}</span>
            <span className="flex-shrink-0 font-bold">{fmt(price * qty)}</span>
          </div>
          <div className="px-3 py-2 flex justify-between text-xs font-bold text-gray-800 border-t border-gray-100">
            <span>Total</span><span>{fmt(total)}</span>
          </div>
        </div>

        {/* cash on delivery note */}
        <div className="mx-4 mb-4 rounded-xl p-3 border border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
          ক্যাশ অন ডেলিভারি — পণ্য পেয়ে পরিশোধ করবেন, আগে টাকা দিতে হবে না।
        </div>

        {/* submit */}
        <div className="px-4 pb-5">
          <button onClick={handleSubmit} disabled={submitting || !form.name || !form.phone}
            className="w-full py-4 rounded-xl font-extrabold text-base disabled:opacity-50 transition-all active:scale-95"
            style={{ background: YELLOW, color: BLACK }}>
            {submitting ? 'অর্ডার হচ্ছে...' : `Confirm Order  ${fmt(total)}`}
          </button>
        </div>
      </div>

      {/* footer */}
      <div className="text-center py-6 text-xs text-gray-400 border-t border-gray-200">
        © {new Date().getFullYear()} · {lp.product_name}
      </div>
    </div>
  )
}

const TEMPLATE_MAP = { 1: T1, 2: T2, 3: T3, 4: T4, 5: T5, 6: T6 }

/* ══════════════════════════════════════════════
   MAIN — public landing page
══════════════════════════════════════════════ */
export default function LandingPage() {
  const { slug } = useParams()
  const [lp, setLp] = useState(null)
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orderOpen, setOrderOpen] = useState(false)

  useEffect(() => {
    supabase.from('landing_pages').select('*').eq('slug', slug).eq('is_published', true).single()
      .then(async ({ data }) => {
        setLp(data)
        if (data?.shop_id) {
          const { data: shopData } = await supabase.from('shops').select('*').eq('id', data.shop_id).single()
          setShop(shopData)
        }
        setLoading(false)
      })
  }, [slug])

  const handleOrder = () => setOrderOpen(true)

  const orderProduct = lp ? {
    id: lp.product_id,
    name: lp.product_name,
    price: lp.product_price,
    image_url: lp.hero_image_url,
  } : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (!lp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="font-bold text-gray-700 text-xl mb-2">পেজটি পাওয়া যায়নি</h1>
          <p className="text-gray-400 text-sm">এই লিঙ্কটি সঠিক নয় অথবা পেজটি এখনো পাবলিশ হয়নি।</p>
        </div>
      </div>
    )
  }

  const color = TEMPLATE_COLORS[lp.template_id] || TEMPLATE_COLORS[1]
  const TemplateComponent = TEMPLATE_MAP[lp.template_id] || T1

  return (
    <>
      <SEO title={lp.title || lp.product_name} description={lp.subheadline || lp.product_description} image={lp.hero_image_url} />
      <TemplateComponent lp={lp} color={color} onOrder={handleOrder} />
      {orderOpen && shop && (
        <OrderModal
          open={orderOpen}
          onClose={() => setOrderOpen(false)}
          shop={shop}
          product={orderProduct}
        />
      )}
    </>
  )
}
