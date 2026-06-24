import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateShop, useMyShops } from '../../hooks/useShops'
import { useCategories } from '../../hooks/useCategories'
import { useAuth } from '../../context/AuthContext'
import { Input, Textarea, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { isPro } from '../../lib/planUtils'
import toast from 'react-hot-toast'

const FREE_SHOP_LIMIT = 1
const PRO_SHOP_LIMIT  = 3

const DAYS = ['শনি','রবি','সোম','মঙ্গল','বুধ','বৃহস্পতি','শুক্র']

export default function AddShop() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createShop = useCreateShop()
  const { data: categories = [] } = useCategories()
  const { data: myShops = [] } = useMyShops()
  const [step, setStep] = useState(1)

  // Determine plan from any existing shop (all shops of same owner share same plan)
  const anyShop = myShops[0]
  const userIsPro = isPro(anyShop)
  const userIsBusiness = anyShop?.plan === 'business'
  const shopLimit = userIsBusiness ? 10 : userIsPro ? PRO_SHOP_LIMIT : FREE_SHOP_LIMIT
  const shopLimitReached = myShops.length >= shopLimit

  const [form, setForm] = useState({
    shop_name: '', description: '', category_id: '', subcategory_id: '',
    phone: '', whatsapp: '', email: '', website: '',
    address: '', google_map_link: '', latitude: '', longitude: '',
    logo: '', cover_image: '',
    opening_time: '৮:০০ AM', closing_time: '১০:০০ PM',
    open_days: ['শনি','রবি','সোম','মঙ্গল','বুধ','বৃহস্পতি'],
  })

  if (!user) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🔐</p>
      <p className="text-xl text-slate-600 mb-4">লগইন করুন</p>
      <Link to="/login"><Button>লগইন করুন</Button></Link>
    </div>
  )

  if (shopLimitReached) return (
    <div className="max-w-md mx-auto py-20 text-center px-4">
      <p className="text-5xl mb-4">🔒</p>
      <h2 className="text-lg font-bold text-gray-800 mb-2">দোকানের limit শেষ</h2>
      <p className="text-sm text-gray-500 mb-6">
        আপনার current plan-এ সর্বোচ্চ <strong>{shopLimit}টি</strong> দোকান রাখা যাবে।
        আরো দোকান যোগ করতে upgrade করুন।
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/dashboard/shops" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
          আমার দোকান
        </Link>
        <Link to="/pricing" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          Plan Upgrade করুন
        </Link>
      </div>
    </div>
  )

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      open_days: f.open_days.includes(day)
        ? f.open_days.filter(d => d !== day)
        : [...f.open_days, day]
    }))
  }

  const handleSubmit = async () => {
    if (!form.shop_name.trim()) return toast.error('দোকানের নাম দিন')
    if (!form.category_id) return toast.error('বিভাগ নির্বাচন করুন')

    try {
      await createShop.mutateAsync(form)
      toast.success('দোকান জমা হয়েছে! অ্যাডমিন অনুমোদনের পরে দেখা যাবে।')
      navigate('/dashboard/shops')
    } catch {
      toast.error('দোকান যোগ করতে সমস্যা হয়েছে')
    }
  }

  const steps = ['মূল তথ্য', 'যোগাযোগ', 'মিডিয়া', 'সময়সূচি']

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">🏪 নতুন দোকান যোগ করুন</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
              i + 1 === step ? 'bg-brand-600 text-white' :
              i + 1 < step  ? 'bg-brand-200 dark:bg-brand-800 text-brand-700 dark:text-brand-200' :
              'bg-slate-200 dark:bg-slate-700 text-slate-400'
            }`}>{i + 1 < step ? '✓' : i + 1}</div>
            <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i + 1 < step ? 'bg-brand-300' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6 space-y-5">
        {/* Step 1: Basic */}
        {step === 1 && (
          <>
            <Input label="দোকানের নাম *" value={form.shop_name}
              onChange={e => set('shop_name', e.target.value)} placeholder="যেমন: করিমের মুদি দোকান" required />
            <Select label="ক্যাটাগরি *" value={form.category_id}
              onChange={e => set('category_id', e.target.value)}>
              <option value="">ক্যাটাগরি নির্বাচন করুন</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </Select>
            <Textarea label="বিবরণ" value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4} placeholder="দোকান সম্পর্কে বিস্তারিত লিখুন..." />
            <Input label="ঠিকানা" value={form.address}
              onChange={e => set('address', e.target.value)} placeholder="দোকানের সম্পূর্ণ ঠিকানা" />
            <Input label="Google Map লিংক" value={form.google_map_link}
              onChange={e => set('google_map_link', e.target.value)} placeholder="https://maps.google.com/..." />
          </>
        )}

        {/* Step 2: Contact */}
        {step === 2 && (
          <>
            <Input label="ফোন নম্বর" type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value)} placeholder="০১XXXXXXXXX" prefix="📞" />
            <Input label="WhatsApp নম্বর" type="tel" value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value)} placeholder="০১XXXXXXXXX" prefix="💬" />
            <Input label="ইমেইল" type="email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="shop@example.com" prefix="✉️" />
            <Input label="ওয়েবসাইট" type="url" value={form.website}
              onChange={e => set('website', e.target.value)} placeholder="https://yoursite.com" prefix="🌐" />
          </>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
              ℹ️ ছবির URL দিন। ছবি আপলোড ফিচার শীঘ্রই আসছে।
            </div>
            <Input label="লোগো URL" type="url" value={form.logo}
              onChange={e => set('logo', e.target.value)} placeholder="https://example.com/logo.jpg" prefix="🖼️" />
            {form.logo && (
              <img src={form.logo} alt="logo preview" className="w-24 h-24 rounded-2xl object-cover border border-slate-200" onError={e => e.target.style.display = 'none'} />
            )}
            <Input label="কভার ছবি URL" type="url" value={form.cover_image}
              onChange={e => set('cover_image', e.target.value)} placeholder="https://example.com/cover.jpg" prefix="🖼️" />
            {form.cover_image && (
              <img src={form.cover_image} alt="cover preview" className="w-full h-32 rounded-xl object-cover border border-slate-200" onError={e => e.target.style.display = 'none'} />
            )}
          </>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="খোলার সময়" value={form.opening_time}
                onChange={e => set('opening_time', e.target.value)} placeholder="৮:০০ AM" prefix="🕐" />
              <Input label="বন্ধের সময়" value={form.closing_time}
                onChange={e => set('closing_time', e.target.value)} placeholder="১০:০০ PM" prefix="🕙" />
            </div>
            <div>
              <label className="form-label">সাপ্তাহিক ছুটি ব্যতীত খোলার দিন</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors border-2 ${
                      form.open_days.includes(day)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                    }`}>{day}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-5">
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">← পিছনে</Button>
        )}
        {step < 4 ? (
          <Button onClick={() => setStep(s => s + 1)} className="flex-1">পরবর্তী →</Button>
        ) : (
          <Button onClick={handleSubmit} loading={createShop.isPending} className="flex-1 !py-3">
            🏪 দোকান জমা দিন
          </Button>
        )}
      </div>

      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300">
        ℹ️ দোকান জমা দেওয়ার পর অ্যাডমিন যাচাই করে অনুমোদন দেবেন।
      </div>
    </div>
  )
}
