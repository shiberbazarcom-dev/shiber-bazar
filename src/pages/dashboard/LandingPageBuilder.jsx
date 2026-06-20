import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useShopProducts } from '../../hooks/useProducts'
import toast from 'react-hot-toast'

async function aiGenerate(type, params) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...params }),
  })
  if (!res.ok) throw new Error('AI সার্ভার সাড়া দেয়নি')
  return res.json()
}

/* ── helpers ── */
const slugify = (text) =>
  text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) +
  '-' + Math.random().toString(36).slice(2, 6)

const TEMPLATES = [
  { id: 1, name: 'ক্লাসিক সবুজ', desc: 'সবুজ CTA, ফিচার লিস্ট', color: '#16a34a', preview: '🟢' },
  { id: 2, name: 'বোল্ড নীল', desc: 'নীল থিম, বড় হেডলাইন', color: '#2563eb', preview: '🔵' },
  { id: 3, name: 'লাল অফার', desc: 'ডিসকাউন্ট ফোকাস', color: '#dc2626', preview: '🔴' },
  { id: 4, name: 'মিনিমাল', desc: 'সাদামাটা, প্রোফেশনাল', color: '#374151', preview: '⚫' },
  { id: 5, name: 'গোল্ড প্রিমিয়াম', desc: 'প্রিমিয়াম প্রোডাক্ট', color: '#b45309', preview: '🟡' },
  { id: 6, name: 'নাহাল স্টাইল', desc: 'হলুদ/কালো + ইনলাইন অর্ডার ফর্ম', color: '#1a1a1a', preview: '🟨' },
]

/* ── sub-components ── */

function TemplateCard({ tpl, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(tpl.id)}
      className={`flex-shrink-0 w-28 rounded-2xl border-2 p-3 text-center transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="text-2xl mb-1">{tpl.preview}</div>
      <p className="text-xs font-bold text-gray-700">{tpl.name}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{tpl.desc}</p>
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white'

function FeaturesEditor({ features, onChange }) {
  const add = () => onChange([...features, ''])
  const update = (i, v) => { const a = [...features]; a[i] = v; onChange(a) }
  const remove = (i) => onChange(features.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div key={i} className="flex gap-2">
          <input value={f} onChange={e => update(i, e.target.value)}
            placeholder={`ফিচার ${i + 1}`}
            className={inp + ' flex-1'} />
          <button onClick={() => remove(i)}
            className="w-8 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-lg flex-shrink-0">
            ×
          </button>
        </div>
      ))}
      <button onClick={add}
        className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-500 text-sm hover:bg-blue-50">
        + ফিচার যোগ করুন
      </button>
    </div>
  )
}

function FaqEditor({ faqs, onChange }) {
  const add = () => onChange([...faqs, { q: '', a: '' }])
  const update = (i, key, v) => { const a = [...faqs]; a[i] = { ...a[i], [key]: v }; onChange(a) }
  const remove = (i) => onChange(faqs.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex gap-2">
            <input value={f.q} onChange={e => update(i, 'q', e.target.value)}
              placeholder="প্রশ্ন" className={inp + ' flex-1'} />
            <button onClick={() => remove(i)}
              className="w-8 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-lg flex-shrink-0">
              ×
            </button>
          </div>
          <textarea value={f.a} onChange={e => update(i, 'a', e.target.value)}
            placeholder="উত্তর" rows={2}
            className={inp + ' resize-none'} />
        </div>
      ))}
      <button onClick={add}
        className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-500 text-sm hover:bg-blue-50">
        + প্রশ্ন যোগ করুন
      </button>
    </div>
  )
}

function LpCard({ lp, onEdit, onDelete, onToggle }) {
  const tpl = TEMPLATES.find(t => t.id === lp.template_id) || TEMPLATES[0]
  const url = `/lp/${lp.slug}`
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{tpl.preview}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">{lp.title || '(শিরোনাম নেই)'}</p>
          <p className="text-xs text-gray-400 truncate">{lp.product_name || '—'}</p>
          <p className="text-xs text-blue-500 truncate mt-0.5">{url}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          lp.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {lp.is_published ? 'লাইভ' : 'ড্রাফট'}
        </span>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onEdit(lp)}
          className="flex-1 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100">
          ✏️ এডিট
        </button>
        <button onClick={() => onToggle(lp)}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold ${
            lp.is_published
              ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}>
          {lp.is_published ? '⏸ আনপাবলিশ' : '🚀 পাবলিশ'}
        </button>
        <a href={url} target="_blank" rel="noreferrer"
          className="w-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button onClick={() => onDelete(lp.id)}
          className="w-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* copy link */}
      {lp.is_published && (
        <button
          onClick={() => { navigator.clipboard.writeText(window.location.origin + url); toast.success('লিঙ্ক কপি হয়েছে!') }}
          className="w-full mt-2 py-1.5 rounded-xl bg-gray-50 text-gray-500 text-xs hover:bg-gray-100">
          🔗 লিঙ্ক কপি করুন
        </button>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function LandingPageBuilder() {
  const { user } = useAuth()
  const [shops, setShops] = useState([])
  const [selectedShopId, setSelectedShopId] = useState('')

  useEffect(() => {
    if (!user?.id) return
    supabase.from('shops').select('id, shop_name, owner_id').eq('owner_id', user.id).eq('is_active', true)
      .then(({ data }) => { if (data) setShops(data) })
  }, [user?.id])
  const { data: products = [] } = useShopProducts(selectedShopId)

  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const blankForm = () => ({
    template_id: 1,
    title: '',
    headline: '',
    subheadline: '',
    badge_text: '🔥 সীমিত অফার',
    hero_image_url: '',
    cta_text: 'এখনই অর্ডার করুন',
    cta_color: '#16a34a',
    product_name: '',
    product_price: '',
    product_original_price: '',
    product_description: '',
    features: ['', '', ''],
    faqs: [{ q: '', a: '' }],
    show_whatsapp: true,
    phone: '',
    whatsapp_message: '',
    product_id: '',
    shop_id: selectedShopId,
  })

  const [form, setForm] = useState(blankForm())
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const fetchPages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setPages(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user?.id) fetchPages() }, [user?.id])
  useEffect(() => { if (shops.length && !selectedShopId) setSelectedShopId(shops[0]?.id || '') }, [shops])

  const openNew = () => { setEditingId(null); setForm(blankForm()); setShowEditor(true) }
  const openEdit = (lp) => {
    setEditingId(lp.id)
    setForm({
      template_id: lp.template_id,
      title: lp.title,
      headline: lp.headline,
      subheadline: lp.subheadline || '',
      badge_text: lp.badge_text || '',
      hero_image_url: lp.hero_image_url || '',
      cta_text: lp.cta_text,
      cta_color: lp.cta_color,
      product_name: lp.product_name || '',
      product_price: lp.product_price || '',
      product_original_price: lp.product_original_price || '',
      product_description: lp.product_description || '',
      features: lp.features?.length ? lp.features : ['', '', ''],
      faqs: lp.faqs?.length ? lp.faqs : [{ q: '', a: '' }],
      show_whatsapp: lp.show_whatsapp,
      phone: lp.phone || '',
      whatsapp_message: lp.whatsapp_message || '',
      product_id: lp.product_id || '',
      shop_id: lp.shop_id || '',
    })
    setShowEditor(true)
  }

  const fillFromProduct = (productId) => {
    const p = products.find(x => x.id === productId)
    if (!p) return
    setForm(f => ({
      ...f,
      product_id: productId,
      product_name: p.name,
      product_price: p.price || '',
      product_original_price: p.original_price || '',
      hero_image_url: p.image_url || '',
      title: p.name,
      headline: p.name + ' — এখনই অর্ডার করুন',
    }))
  }

  const [aiLoading, setAiLoading] = useState(false)

  const generateWithAI = async () => {
    const productName = form.product_name || form.title
    if (!productName.trim()) return toast.error('আগে পণ্যের নাম দিন')
    setAiLoading(true)
    try {
      const data = await aiGenerate('landing_page', {
        productName,
        price: form.product_price,
        category: shops.find(s => s.id === form.shop_id)?.category || '',
      })
      setForm(f => ({
        ...f,
        headline:         data.headline    || f.headline,
        subheadline:      data.subheadline || f.subheadline,
        badge_text:       data.badge_text  || f.badge_text,
        cta_text:         data.cta_text    || f.cta_text,
        whatsapp_message: data.whatsapp_message || f.whatsapp_message,
        features: data.features?.length ? data.features : f.features,
        faqs:     data.faqs?.length     ? data.faqs     : f.faqs,
      }))
      toast.success(`✨ AI লিখেছে! (${data.provider === 'deepseek' ? 'DeepSeek' : 'Gemini'})`)
    } catch (e) {
      toast.error('AI কাজ করেনি: ' + e.message)
    }
    setAiLoading(false)
  }

  const save = async () => {
    if (!form.title.trim()) return toast.error('শিরোনাম দিন')
    setSaving(true)
    const payload = {
      ...form,
      owner_id: user.id,
      features: form.features.filter(Boolean),
      faqs: form.faqs.filter(f => f.q || f.a),
      product_price: form.product_price ? Number(form.product_price) : null,
      product_original_price: form.product_original_price ? Number(form.product_original_price) : null,
    }
    let err
    if (editingId) {
      const res = await supabase.from('landing_pages').update(payload).eq('id', editingId)
      err = res.error
    } else {
      payload.slug = slugify(form.title)
      const res = await supabase.from('landing_pages').insert(payload)
      err = res.error
    }
    setSaving(false)
    if (err) return toast.error('সেভ হয়নি: ' + err.message)
    toast.success(editingId ? 'আপডেট হয়েছে!' : 'ল্যান্ডিং পেজ তৈরি হয়েছে!')
    setShowEditor(false)
    fetchPages()
  }

  const togglePublish = async (lp) => {
    await supabase.from('landing_pages').update({ is_published: !lp.is_published }).eq('id', lp.id)
    toast.success(lp.is_published ? 'আনপাবলিশ হয়েছে' : '🚀 পাবলিশ হয়েছে!')
    fetchPages()
  }

  const deletePage = async (id) => {
    if (!confirm('এই ল্যান্ডিং পেজটি মুছে ফেলবেন?')) return
    await supabase.from('landing_pages').delete().eq('id', id)
    toast.success('মুছে ফেলা হয়েছে')
    fetchPages()
  }

  /* ── Editor drawer ── */
  if (showEditor) {
    const tpl = TEMPLATES.find(t => t.id === form.template_id) || TEMPLATES[0]
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        {/* top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setShowEditor(false)} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-800 flex-1">{editingId ? 'এডিট করুন' : 'নতুন ল্যান্ডিং পেজ'}</h1>
          <button onClick={generateWithAI} disabled={aiLoading}
            className="px-3 h-9 rounded-xl text-white text-sm font-bold disabled:opacity-60 flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            {aiLoading
              ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />লিখছে...</>
              : <>✨ AI</>}
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 h-9 rounded-xl text-white text-sm font-bold disabled:opacity-60"
            style={{ background: tpl.color }}>
            {saving ? 'সেভ...' : '💾 সেভ'}
          </button>
        </div>

        <div className="px-4 pt-4 space-y-6 max-w-lg mx-auto">

          {/* template picker */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">টেমপ্লেট বেছে নিন</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TEMPLATES.map(t => (
                <TemplateCard key={t.id} tpl={t} selected={form.template_id === t.id} onSelect={v => set('template_id', v)} />
              ))}
            </div>
          </div>

          {/* product autofill */}
          {shops.length > 0 && (
            <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-blue-700">🛒 প্রোডাক্ট থেকে অটোফিল</p>
              <Field label="দোকান">
                <select value={form.shop_id} onChange={e => { set('shop_id', e.target.value); setSelectedShopId(e.target.value) }} className={inp}>
                  <option value="">দোকান বেছে নিন</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
                </select>
              </Field>
              {products.length > 0 && (
                <Field label="প্রোডাক্ট">
                  <select value={form.product_id} onChange={e => fillFromProduct(e.target.value)} className={inp}>
                    <option value="">প্রোডাক্ট বেছে নিন</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
              )}
            </div>
          )}

          {/* hero section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">হিরো সেকশন</p>
            <Field label="পেজের শিরোনাম (ভিতরে দেখাবে না)">
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="যেমন: বালিশ অফার — জুলাই ২০২৫" className={inp} />
            </Field>
            <Field label="ব্যাজ টেক্সট (ছোট লেবেল)">
              <input value={form.badge_text} onChange={e => set('badge_text', e.target.value)} placeholder="🔥 সীমিত অফার" className={inp} />
            </Field>
            <Field label="বড় হেডলাইন">
              <input value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="যদি ভালো ঘুমাতে চান..." className={inp} />
            </Field>
            <Field label="সাবহেডলাইন">
              <textarea value={form.subheadline} onChange={e => set('subheadline', e.target.value)}
                placeholder="আমাদের অর্থোপেডিক বালিশ আপনার রাতকে বদলে দেবে।"
                rows={2} className={inp + ' resize-none'} />
            </Field>
            <Field label="প্রোডাক্ট ইমেজ URL">
              <input value={form.hero_image_url} onChange={e => set('hero_image_url', e.target.value)} placeholder="https://..." className={inp} />
            </Field>
          </div>

          {/* product details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">প্রোডাক্ট তথ্য</p>
            <Field label="প্রোডাক্টের নাম">
              <input value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="অর্থোপেডিক বালিশ" className={inp} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="বর্তমান মূল্য (৳)">
                <input type="number" value={form.product_price} onChange={e => set('product_price', e.target.value)} placeholder="৳৮৫০" className={inp} />
              </Field>
              <Field label="আগের মূল্য (৳)">
                <input type="number" value={form.product_original_price} onChange={e => set('product_original_price', e.target.value)} placeholder="৳১২০০" className={inp} />
              </Field>
            </div>
            <Field label="প্রোডাক্ট বর্ণনা">
              <textarea value={form.product_description} onChange={e => set('product_description', e.target.value)}
                rows={3} placeholder="প্রোডাক্টের বিস্তারিত বিবরণ..." className={inp + ' resize-none'} />
            </Field>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">CTA বাটন</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="বাটনের লেখা">
                <input value={form.cta_text} onChange={e => set('cta_text', e.target.value)} placeholder="এখনই অর্ডার করুন" className={inp} />
              </Field>
              <Field label="রঙ">
                <div className="flex gap-2">
                  <input type="color" value={form.cta_color} onChange={e => set('cta_color', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input value={form.cta_color} onChange={e => set('cta_color', e.target.value)} className={inp + ' flex-1'} />
                </div>
              </Field>
            </div>
          </div>

          {/* features */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">✅ ফিচার / সুবিধা</p>
            <FeaturesEditor features={form.features} onChange={v => set('features', v)} />
          </div>

          {/* FAQs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">❓ প্রশ্ন ও উত্তর</p>
            <FaqEditor faqs={form.faqs} onChange={v => set('faqs', v)} />
          </div>

          {/* WhatsApp */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">WhatsApp</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => set('show_whatsapp', !form.show_whatsapp)}
                className={`w-10 h-6 rounded-full transition-colors ${form.show_whatsapp ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.show_whatsapp ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-sm text-gray-600">WhatsApp বাটন দেখাবে</span>
            </label>
            {form.show_whatsapp && (
              <>
                <Field label="ফোন নম্বর">
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX" className={inp} />
                </Field>
                <Field label="WhatsApp মেসেজ">
                  <input value={form.whatsapp_message} onChange={e => set('whatsapp_message', e.target.value)}
                    placeholder="আমি অর্ডার করতে চাই..." className={inp} />
                </Field>
              </>
            )}
          </div>

        </div>

        {/* sticky save */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
          <button onClick={save} disabled={saving}
            className="w-full h-12 rounded-2xl text-white font-bold text-base disabled:opacity-60 transition-all active:scale-95"
            style={{ background: tpl.color }}>
            {saving ? 'সেভ হচ্ছে...' : `💾 ${editingId ? 'আপডেট' : 'তৈরি'} করুন`}
          </button>
        </div>
      </div>
    )
  }

  /* ── List view ── */
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg text-gray-800">ল্যান্ডিং পেজ</h1>
          <p className="text-xs text-gray-400">Facebook প্রমোশনের জন্য পেজ বানান</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-4 h-10 rounded-2xl text-white text-sm font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          নতুন পেজ
        </button>
      </div>

      {/* stats strip */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-4">
        {[
          { label: 'মোট পেজ', value: pages.length },
          { label: 'লাইভ', value: pages.filter(p => p.is_published).length },
          { label: 'ড্রাফট', value: pages.filter(p => !p.is_published).length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
            <p className="font-bold text-xl text-gray-800">{s.value}</p>
            <p className="text-[11px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* list */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">লোড হচ্ছে...</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📄</div>
            <p className="font-bold text-gray-600 mb-1">কোনো ল্যান্ডিং পেজ নেই</p>
            <p className="text-sm text-gray-400 mb-6">প্রথম পেজটি তৈরি করুন এবং Facebook এ শেয়ার করুন</p>
            <button onClick={openNew}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm">
              + প্রথম পেজ তৈরি করুন
            </button>
          </div>
        ) : (
          pages.map(lp => (
            <LpCard key={lp.id} lp={lp} onEdit={openEdit} onDelete={deletePage} onToggle={togglePublish} />
          ))
        )}
      </div>
    </div>
  )
}
