import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

/* ── helpers ── */
const fmt = (n) => '৳' + Number(n || 0).toLocaleString('bn-BD')
const today = () => new Date().toISOString().slice(0, 10)
const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
const avatarColor = (name) => {
  const colors = ['bg-blue-500','bg-purple-500','bg-pink-500','bg-orange-500','bg-teal-500','bg-indigo-500']
  let h = 0
  for (let c of (name || '')) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

/* ── Animated Entry Row ── */
function EntryRow({ entry, index }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
        entry.type === 'baki' ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      style={{ transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
        entry.type === 'baki' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
      }`}>
        {entry.type === 'baki' ? '↑' : '↓'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">
          {entry.description || (entry.type === 'baki' ? 'বাকি দেওয়া' : 'পরিশোধ')}
        </p>
        <p className="text-xs text-gray-400">{new Date(entry.entry_date).toLocaleDateString('bn-BD')}</p>
      </div>
      <p className={`font-bold text-sm flex-shrink-0 ${entry.type === 'baki' ? 'text-red-600' : 'text-green-600'}`}>
        {entry.type === 'baki' ? '-' : '+'}{fmt(entry.amount)}
      </p>
    </div>
  )
}

/* ── Customer Modal ── */
function CustomerModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl animate-slideInUp sm:animate-scaleIn">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800 text-lg">নতুন কাস্টমার</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="form-label">নাম *</label>
            <input className="input" placeholder="কাস্টমারের নাম লিখুন" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="form-label">ফোন নম্বর</label>
            <input className="input" type="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="form-label">ঠিকানা</label>
            <input className="input" placeholder="গ্রাম / মহল্লা" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <label className="form-label">নোট</label>
            <input className="input" placeholder="যেকোনো তথ্য" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="btn-md btn-secondary flex-1">বাতিল</button>
          <button
            disabled={loading}
            onClick={() => { if (!form.name.trim()) { toast.error('নাম দিন'); return } onSave(form) }}
            className="btn-md btn-primary flex-1 disabled:opacity-60">
            {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Entry Modal ── */
function EntryModal({ customer, onClose, onSave, loading }) {
  const [form, setForm] = useState({ type: 'baki', amount: '', description: '', entry_date: today() })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl animate-slideInUp sm:animate-scaleIn">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">এন্ট্রি যোগ করুন</h2>
            <p className="text-sm text-gray-500">{customer.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => set('type', 'baki')}
              className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${form.type === 'baki' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'}`}>
              📤 বাকি দেওয়া
            </button>
            <button
              onClick={() => set('type', 'payment')}
              className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${form.type === 'payment' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500'}`}>
              💰 টাকা পেয়েছি
            </button>
          </div>

          <div>
            <label className="form-label">পরিমাণ (টাকা) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
              <input className="input pl-8" type="number" placeholder="০" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">বিবরণ</label>
            <input className="input" placeholder="কী কিনেছে / কেন বাকি" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="form-label">তারিখ</label>
            <input className="input" type="date" value={form.entry_date} onChange={e => set('entry_date', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="btn-md btn-secondary flex-1">বাতিল</button>
          <button
            disabled={loading}
            onClick={() => {
              if (!form.amount || Number(form.amount) <= 0) { toast.error('পরিমাণ দিন'); return }
              onSave({ ...form, customer_id: customer.id })
            }}
            className={`btn-md flex-1 text-white font-semibold transition-all ${form.type === 'baki' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-60`}>
            {loading ? 'সংরক্ষণ হচ্ছে...' : form.type === 'baki' ? 'বাকি যোগ করুন' : 'পরিশোধ যোগ করুন'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Customer Detail Panel ── */
function CustomerDetail({ customer, entries, onAddEntry, onBack }) {
  const totalBaki    = entries.filter(e => e.type === 'baki').reduce((s, e) => s + Number(e.amount), 0)
  const totalPayment = entries.filter(e => e.type === 'payment').reduce((s, e) => s + Number(e.amount), 0)
  const remaining    = totalBaki - totalPayment
  const percent      = totalBaki > 0 ? Math.min(100, Math.round((totalPayment / totalBaki) * 100)) : 0
  const sorted       = [...entries].sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))

  return (
    <div className="bg-white rounded-2xl shadow-card flex flex-col h-full">
      {/* Header */}
      <div className={`p-5 rounded-t-2xl text-white ${remaining > 0 ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-green-500 to-teal-500'}`}>
        {/* Mobile back button */}
        <button onClick={onBack} className="lg:hidden flex items-center gap-1.5 text-white/80 text-sm mb-3 hover:text-white">
          ← ফিরে যান
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-white/20`}>
              {initials(customer.name)}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{customer.name}</h3>
              {customer.phone && <p className="text-white/80 text-sm">📞 {customer.phone}</p>}
              {customer.address && <p className="text-white/70 text-xs">📍 {customer.address}</p>}
            </div>
          </div>
          {customer.phone && remaining > 0 && (
            <a
              href={`https://wa.me/88${customer.phone.replace(/^0/, '')}?text=আসসালামু আলাইকুম %0A আপনার বাকি আছে ${fmt(remaining)} %0A দয়া করে পরিশোধ করুন।`}
              target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 bg-white text-green-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-50 transition-all shadow-sm">
              📲 রিমাইন্ডার
            </a>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-white/70 text-xs font-medium">মোট বাকি</p>
            <p className="font-bold text-white text-sm mt-0.5">{fmt(totalBaki)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-white/70 text-xs font-medium">পরিশোধ</p>
            <p className="font-bold text-white text-sm mt-0.5">{fmt(totalPayment)}</p>
          </div>
          <div className="bg-white/25 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-white/80 text-xs font-medium">এখন বাকি</p>
            <p className="font-bold text-white text-sm mt-0.5">{fmt(Math.max(0, remaining))}</p>
          </div>
        </div>

        {/* Progress bar */}
        {totalBaki > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>পরিশোধের অগ্রগতি</span>
              <span>{percent}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add entry button */}
      <div className="px-4 pt-4">
        <button
          onClick={onAddEntry}
          className="w-full py-3 rounded-xl font-semibold text-sm border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all">
          + নতুন এন্ট্রি যোগ করুন
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sorted.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">এখনো কোনো লেনদেন নেই</p>
          </div>
        )}
        {sorted.map((e, i) => <EntryRow key={e.id} entry={e} index={i} />)}
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function HisaberKhata() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [search, setSearch] = useState('')
  const [showDetail, setShowDetail] = useState(false) // mobile: show detail panel

  /* fetch customers */
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['hisab-customers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hisab_customers').select('*').eq('owner_id', user.id).order('name')
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  /* fetch all entries */
  const { data: allEntries = [] } = useQuery({
    queryKey: ['hisab-entries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hisab_entries').select('*').eq('owner_id', user.id).order('entry_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const customerSummary = (cId) => {
    const entries = allEntries.filter(e => e.customer_id === cId)
    const baki    = entries.filter(e => e.type === 'baki').reduce((s, e) => s + Number(e.amount), 0)
    const payment = entries.filter(e => e.type === 'payment').reduce((s, e) => s + Number(e.amount), 0)
    return baki - payment
  }

  const addCustomer = useMutation({
    mutationFn: async (form) => {
      const { error } = await supabase.from('hisab_customers').insert({ ...form, owner_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hisab-customers'] })
      toast.success('কাস্টমার যোগ হয়েছে! ✓')
      setShowAddCustomer(false)
    },
    onError: () => toast.error('সমস্যা হয়েছে'),
  })

  const addEntry = useMutation({
    mutationFn: async (form) => {
      const { error } = await supabase.from('hisab_entries').insert({ ...form, owner_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hisab-entries'] })
      toast.success('এন্ট্রি সংরক্ষিত হয়েছে! ✓')
      setShowEntryModal(false)
    },
    onError: () => toast.error('সমস্যা হয়েছে'),
  })

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const totalOutstanding = customers.reduce((s, c) => s + Math.max(0, customerSummary(c.id)), 0)
  const totalCustomers   = customers.length
  const bakiCount        = customers.filter(c => customerSummary(c.id) > 0).length

  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c)
    setShowDetail(true)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📒 হিসাবের খাতা</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">কাস্টমারদের বাকি ও পরিশোধের হিসাব</p>
        </div>
        <button onClick={() => setShowAddCustomer(true)} className="btn-md btn-primary text-sm">
          + নতুন
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white">
          <p className="text-red-100 text-xs font-medium">মোট বাকি</p>
          <p className="text-xl font-bold mt-1 leading-tight">{fmt(totalOutstanding)}</p>
          <p className="text-red-200 text-xs mt-1">{bakiCount} জনের কাছে</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <p className="text-blue-100 text-xs font-medium">কাস্টমার</p>
          <p className="text-xl font-bold mt-1">{totalCustomers}</p>
          <p className="text-blue-200 text-xs mt-1">মোট</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-4 text-white">
          <p className="text-green-100 text-xs font-medium">পরিশোধ</p>
          <p className="text-xl font-bold mt-1">{totalCustomers - bakiCount}</p>
          <p className="text-green-200 text-xs mt-1">জন ক্লিয়ার</p>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Customer list — hidden on mobile when detail shown */}
        <div className={`lg:col-span-2 space-y-3 ${showDetail ? 'hidden lg:block' : 'block'}`}>
          <input
            className="input"
            placeholder="🔍 নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {isLoading && (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📒</p>
              <p className="text-sm font-medium text-gray-500">কোনো কাস্টমার নেই</p>
              <p className="text-xs text-gray-400 mt-1">প্রথম কাস্টমার যোগ করুন</p>
              <button
                onClick={() => setShowAddCustomer(true)}
                className="mt-4 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all">
                + কাস্টমার যোগ করুন
              </button>
            </div>
          )}

          {filtered.map((c, idx) => {
            const remaining  = customerSummary(c.id)
            const isSelected = selectedCustomer?.id === c.id
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCustomer(c)}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 animate-fadeUp ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-transparent bg-white hover:border-gray-200 hover:shadow-sm'
                } shadow-card`}>
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(c.name)}`}>
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate text-sm">{c.name}</p>
                    {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {remaining > 0 ? (
                      <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg">
                        {fmt(remaining)}
                      </span>
                    ) : (
                      <span className="inline-block bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-lg">
                        ✓ ক্লিয়ার
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className={`lg:col-span-3 ${showDetail ? 'block' : 'hidden lg:block'}`}>
          {selectedCustomer ? (
            <CustomerDetail
              customer={selectedCustomer}
              entries={allEntries.filter(e => e.customer_id === selectedCustomer.id)}
              onAddEntry={() => setShowEntryModal(true)}
              onBack={() => setShowDetail(false)}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-card h-64 hidden lg:flex items-center justify-center">
              <div className="text-center text-gray-300">
                <p className="text-5xl mb-3">👈</p>
                <p className="text-sm text-gray-400">বাম পাশ থেকে কাস্টমার বেছে নিন</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddCustomer && (
        <CustomerModal
          onClose={() => setShowAddCustomer(false)}
          onSave={(form) => addCustomer.mutate(form)}
          loading={addCustomer.isPending}
        />
      )}
      {showEntryModal && selectedCustomer && (
        <EntryModal
          customer={selectedCustomer}
          onClose={() => setShowEntryModal(false)}
          onSave={(form) => addEntry.mutate(form)}
          loading={addEntry.isPending}
        />
      )}
    </div>
  )
}
