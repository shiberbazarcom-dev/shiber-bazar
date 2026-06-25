import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const fmt    = (n) => '৳' + Number(n || 0).toLocaleString('bn-BD')
const today  = () => new Date().toISOString().slice(0, 10)
const initials = (name = '') => name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
const COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f97316','#14b8a6','#6366f1']
const avatarBg = (name = '') => COLORS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % COLORS.length, 0)]

/* ─── Bottom Sheet Modal ─── */
function Sheet({ onClose, title, subtitle, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl animate-slideInUp sm:animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />
        <div className="px-5 pt-4 pb-3 border-b">
          <p className="font-bold text-gray-800 text-base">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-5 space-y-3">{children}</div>
        {footer && <div className="px-5 pb-5 pt-2 flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/* ─── Customer Modal ─── */
function CustomerModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Sheet
      title="নতুন কাস্টমার"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">বাতিল</button>
        <button
          disabled={loading}
          onClick={() => { if (!form.name.trim()) { toast.error('নাম দিন'); return } onSave(form) }}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
          {loading ? 'সংরক্ষণ...' : 'যোগ করুন'}
        </button>
      </>}
    >
      <input className="input" placeholder="নাম *" value={form.name} onChange={e => set('name', e.target.value)} />
      <input className="input" type="tel" placeholder="ফোন নম্বর" value={form.phone} onChange={e => set('phone', e.target.value)} />
      <input className="input" placeholder="ঠিকানা (ঐচ্ছিক)" value={form.address} onChange={e => set('address', e.target.value)} />
    </Sheet>
  )
}

/* ─── Entry Modal ─── */
function EntryModal({ customer, onClose, onSave, loading }) {
  const [form, setForm] = useState({ type: 'baki', amount: '', description: '', entry_date: today() })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isBaki = form.type === 'baki'
  return (
    <Sheet
      title="এন্ট্রি যোগ করুন"
      subtitle={customer.name}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">বাতিল</button>
        <button
          disabled={loading}
          onClick={() => {
            if (!form.amount || Number(form.amount) <= 0) { toast.error('পরিমাণ দিন'); return }
            onSave({ ...form, customer_id: customer.id })
          }}
          className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${isBaki ? 'bg-red-500' : 'bg-green-500'}`}>
          {loading ? 'সংরক্ষণ...' : isBaki ? 'বাকি যোগ' : 'পরিশোধ যোগ'}
        </button>
      </>}
    >
      {/* Toggle */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
        {[['baki','📤 বাকি দেওয়া'], ['payment','💰 টাকা পেলাম']].map(([v, label]) => (
          <button key={v} onClick={() => set('type', v)}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${form.type === v ? (v === 'baki' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
        <input className="input pl-8" type="number" placeholder="০" value={form.amount} onChange={e => set('amount', e.target.value)} />
      </div>
      <input className="input" placeholder="বিবরণ (ঐচ্ছিক)" value={form.description} onChange={e => set('description', e.target.value)} />
      <input className="input" type="date" value={form.entry_date} onChange={e => set('entry_date', e.target.value)} />
    </Sheet>
  )
}

/* ─── Entry item with stagger ─── */
function EntryItem({ e, i }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), i * 50); return () => clearTimeout(t) }, [i])
  const isBaki = e.type === 'baki'
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isBaki ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
        {isBaki ? '↑' : '↓'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate">{e.description || (isBaki ? 'বাকি দেওয়া' : 'পরিশোধ')}</p>
        <p className="text-xs text-gray-400">{new Date(e.entry_date).toLocaleDateString('bn-BD')}</p>
      </div>
      <p className={`text-sm font-bold flex-shrink-0 ${isBaki ? 'text-red-500' : 'text-green-500'}`}>
        {isBaki ? '-' : '+'}{fmt(e.amount)}
      </p>
    </div>
  )
}

/* ─── Detail panel ─── */
function Detail({ customer, entries, onAddEntry, onBack }) {
  const baki    = entries.filter(e => e.type === 'baki').reduce((s, e) => s + Number(e.amount), 0)
  const payment = entries.filter(e => e.type === 'payment').reduce((s, e) => s + Number(e.amount), 0)
  const due     = baki - payment
  const pct     = baki > 0 ? Math.min(100, Math.round((payment / baki) * 100)) : 100
  const sorted  = [...entries].sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Customer info bar */}
      <div className="p-4 border-b border-gray-50">
        <button onClick={onBack} className="lg:hidden text-xs text-blue-600 font-medium mb-3 flex items-center gap-1">← ফিরে যান</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: avatarBg(customer.name) }}>
            {initials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm">{customer.name}</p>
            {customer.phone && <p className="text-xs text-gray-400">{customer.phone}</p>}
          </div>
          {customer.phone && due > 0 && (
            <a
              href={`https://wa.me/88${customer.phone.replace(/^0/, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম,\nআপনার বাকি আছে ${fmt(due)}\nদয়া করে পরিশোধ করুন।`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 text-xs font-semibold text-green-600 border border-green-200 bg-green-50 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-all">
              📲 রিমাইন্ডার
            </a>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: 'মোট বাকি', val: fmt(baki), color: 'text-gray-700' },
            { label: 'পরিশোধ', val: fmt(payment), color: 'text-green-600' },
            { label: 'বাকি আছে', val: fmt(Math.max(0, due)), color: due > 0 ? 'text-red-500' : 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`font-bold text-sm mt-0.5 ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>পরিশোধের অগ্রগতি</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Add entry */}
      <div className="px-4 py-3 border-b border-gray-50">
        <button onClick={onAddEntry}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">
          + এন্ট্রি যোগ করুন
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-4">
        {sorted.length === 0
          ? <p className="text-center text-gray-400 text-sm py-10">কোনো লেনদেন নেই</p>
          : sorted.map((e, i) => <EntryItem key={e.id} e={e} i={i} />)
        }
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function HisaberKhata() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [addCust, setAddCust]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [addEntry, setAddEntry] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [search, setSearch]     = useState('')

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['hisab-customers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('hisab_customers').select('*').eq('owner_id', user.id).order('name')
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: allEntries = [] } = useQuery({
    queryKey: ['hisab-entries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('hisab_entries').select('*').eq('owner_id', user.id).order('entry_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const due = (cId) => {
    const es = allEntries.filter(e => e.customer_id === cId)
    return es.filter(e => e.type === 'baki').reduce((s, e) => s + Number(e.amount), 0)
         - es.filter(e => e.type === 'payment').reduce((s, e) => s + Number(e.amount), 0)
  }

  const custMutation = useMutation({
    mutationFn: async (form) => { const { error } = await supabase.from('hisab_customers').insert({ ...form, owner_id: user.id }); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hisab-customers'] }); toast.success('কাস্টমার যোগ হয়েছে!'); setAddCust(false) },
    onError: () => toast.error('সমস্যা হয়েছে'),
  })

  const entryMutation = useMutation({
    mutationFn: async (form) => { const { error } = await supabase.from('hisab_entries').insert({ ...form, owner_id: user.id }); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hisab-entries'] }); toast.success('এন্ট্রি সংরক্ষিত!'); setAddEntry(false) },
    onError: () => toast.error('সমস্যা হয়েছে'),
  })

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
  )

  const totalDue   = customers.reduce((s, c) => s + Math.max(0, due(c.id)), 0)
  const bakiCount  = customers.filter(c => due(c.id) > 0).length

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">হিসাবের খাতা</h1>
          <p className="text-xs text-gray-400 mt-0.5">কাস্টমারদের বাকির হিসাব</p>
        </div>
        <button onClick={() => setAddCust(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all">
          + নতুন কাস্টমার
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-400">মোট বাকি</p>
          <p className="text-lg font-bold text-red-500 mt-0.5">{fmt(totalDue)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-400">কাস্টমার</p>
          <p className="text-lg font-bold text-gray-700 mt-0.5">{customers.length} জন</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-400">বাকি আছে</p>
          <p className="text-lg font-bold text-orange-500 mt-0.5">{bakiCount} জন</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 grid lg:grid-cols-5 gap-4 min-h-0">

        {/* List */}
        <div className={`lg:col-span-2 flex flex-col gap-2 ${showDetail ? 'hidden lg:flex' : 'flex'}`}>
          <input className="input" placeholder="নাম বা ফোন দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {isLoading && [1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}

            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-3xl mb-2">📒</p>
                <p className="text-sm font-medium text-gray-500">কোনো কাস্টমার নেই</p>
                <button onClick={() => setAddCust(true)} className="mt-3 text-blue-600 text-sm font-semibold hover:underline">
                  + প্রথম কাস্টমার যোগ করুন
                </button>
              </div>
            )}

            {filtered.map((c, idx) => {
              const d = due(c.id)
              const isActive = selected?.id === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelected(c); setShowDetail(true) }}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 animate-fadeUp
                    ${isActive ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: avatarBg(c.name) }}>
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{c.name}</p>
                    {c.phone && <p className="text-xs text-gray-400 truncate">{c.phone}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${d > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {d > 0 ? fmt(d) : '✓'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail */}
        <div className={`lg:col-span-3 min-h-0 ${showDetail ? 'block' : 'hidden lg:block'}`}>
          {selected
            ? <Detail
                customer={selected}
                entries={allEntries.filter(e => e.customer_id === selected.id)}
                onAddEntry={() => setAddEntry(true)}
                onBack={() => setShowDetail(false)}
              />
            : <div className="hidden lg:flex h-full items-center justify-center bg-white rounded-2xl border border-gray-100">
                <div className="text-center text-gray-300">
                  <p className="text-4xl mb-2">👈</p>
                  <p className="text-sm">কাস্টমার বেছে নিন</p>
                </div>
              </div>
          }
        </div>
      </div>

      {addCust && <CustomerModal onClose={() => setAddCust(false)} onSave={f => custMutation.mutate(f)} loading={custMutation.isPending} />}
      {addEntry && selected && <EntryModal customer={selected} onClose={() => setAddEntry(false)} onSave={f => entryMutation.mutate(f)} loading={entryMutation.isPending} />}
    </div>
  )
}
