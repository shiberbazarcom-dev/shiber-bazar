import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

/* ── helpers ── */
const fmt = (n) => '৳' + Number(n || 0).toLocaleString('bn-BD')
const today = () => new Date().toISOString().slice(0, 10)

/* ── Customer Modal ── */
function CustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800 text-lg">নতুন কাস্টমার</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="form-label">নাম *</label>
            <input className="input" placeholder="কাস্টমারের নাম" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="form-label">ফোন নম্বর</label>
            <input className="input" placeholder="01XXXXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
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
            onClick={() => { if (!form.name.trim()) { toast.error('নাম দিন'); return } onSave(form) }}
            className="btn-md btn-primary flex-1">
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Entry Modal (baki / payment) ── */
function EntryModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState({ type: 'baki', amount: '', description: '', entry_date: today() })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">এন্ট্রি যোগ করুন</h2>
            <p className="text-sm text-gray-500">{customer.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => set('type', 'baki')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${form.type === 'baki' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              বাকি দেওয়া
            </button>
            <button
              onClick={() => set('type', 'payment')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${form.type === 'payment' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              টাকা পেয়েছি
            </button>
          </div>
          <div>
            <label className="form-label">পরিমাণ (টাকা) *</label>
            <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
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
            onClick={() => { if (!form.amount || Number(form.amount) <= 0) { toast.error('পরিমাণ দিন'); return } onSave({ ...form, customer_id: customer.id }) }}
            className="btn-md btn-primary flex-1">
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Customer Detail Panel ── */
function CustomerDetail({ customer, entries, onAddEntry, onDelete }) {
  const totalBaki    = entries.filter(e => e.type === 'baki').reduce((s, e) => s + Number(e.amount), 0)
  const totalPayment = entries.filter(e => e.type === 'payment').reduce((s, e) => s + Number(e.amount), 0)
  const remaining    = totalBaki - totalPayment

  return (
    <div className="bg-white rounded-2xl shadow-card h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{customer.name}</h3>
            {customer.phone && <p className="text-sm text-gray-500">📞 {customer.phone}</p>}
            {customer.address && <p className="text-sm text-gray-500">📍 {customer.address}</p>}
          </div>
          {customer.phone && (
            <a
              href={`https://wa.me/88${customer.phone.replace(/^0/, '')}?text=আসসালামু আলাইকুম, আপনার বাকি আছে ${fmt(remaining)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-600 transition-all">
              WhatsApp
            </a>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-red-500 font-medium">মোট বাকি</p>
            <p className="font-bold text-red-600 text-sm mt-0.5">{fmt(totalBaki)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-green-600 font-medium">পরিশোধ</p>
            <p className="font-bold text-green-600 text-sm mt-0.5">{fmt(totalPayment)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${remaining > 0 ? 'bg-orange-50' : 'bg-blue-50'}`}>
            <p className={`text-xs font-medium ${remaining > 0 ? 'text-orange-500' : 'text-blue-500'}`}>বাকি আছে</p>
            <p className={`font-bold text-sm mt-0.5 ${remaining > 0 ? 'text-orange-600' : 'text-blue-600'}`}>{fmt(remaining)}</p>
          </div>
        </div>

        <button onClick={onAddEntry} className="btn-md btn-primary w-full mt-3">
          + এন্ট্রি যোগ করুন
        </button>
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {entries.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">কোনো লেনদেন নেই</p>
        )}
        {[...entries].sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date)).map(e => (
          <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${e.type === 'baki' ? 'bg-red-100' : 'bg-green-100'}`}>
              {e.type === 'baki' ? '📤' : '💰'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{e.description || (e.type === 'baki' ? 'বাকি দেওয়া' : 'পরিশোধ')}</p>
              <p className="text-xs text-gray-400">{new Date(e.entry_date).toLocaleDateString('bn-BD')}</p>
            </div>
            <p className={`font-bold text-sm flex-shrink-0 ${e.type === 'baki' ? 'text-red-600' : 'text-green-600'}`}>
              {e.type === 'baki' ? '-' : '+'}{fmt(e.amount)}
            </p>
          </div>
        ))}
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

  /* fetch customers */
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['hisab-customers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hisab_customers')
        .select('*')
        .eq('owner_id', user.id)
        .order('name')
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  /* fetch all entries for this owner */
  const { data: allEntries = [] } = useQuery({
    queryKey: ['hisab-entries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hisab_entries')
        .select('*')
        .eq('owner_id', user.id)
        .order('entry_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  /* summary per customer */
  const customerSummary = (cId) => {
    const entries = allEntries.filter(e => e.customer_id === cId)
    const baki    = entries.filter(e => e.type === 'baki').reduce((s, e) => s + Number(e.amount), 0)
    const payment = entries.filter(e => e.type === 'payment').reduce((s, e) => s + Number(e.amount), 0)
    return baki - payment
  }

  /* add customer */
  const addCustomer = useMutation({
    mutationFn: async (form) => {
      const { error } = await supabase.from('hisab_customers').insert({ ...form, owner_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hisab-customers'] })
      toast.success('কাস্টমার যোগ হয়েছে!')
      setShowAddCustomer(false)
    },
    onError: () => toast.error('সমস্যা হয়েছে'),
  })

  /* add entry */
  const addEntry = useMutation({
    mutationFn: async (form) => {
      const { error } = await supabase.from('hisab_entries').insert({ ...form, owner_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hisab-entries'] })
      toast.success('এন্ট্রি সংরক্ষিত হয়েছে!')
      setShowEntryModal(false)
    },
    onError: () => toast.error('সমস্যা হয়েছে'),
  })

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const totalOutstanding = customers.reduce((s, c) => s + Math.max(0, customerSummary(c.id)), 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📒 হিসাবের খাতা</h1>
          <p className="text-sm text-gray-500 mt-0.5">কাস্টমারদের বাকি ও পরিশোধের হিসাব</p>
        </div>
        <button onClick={() => setShowAddCustomer(true)} className="btn-md btn-primary">
          + নতুন কাস্টমার
        </button>
      </div>

      {/* Total outstanding card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <p className="text-blue-100 text-sm">মোট বাকি (সকল কাস্টমার)</p>
        <p className="text-3xl font-bold mt-1">{fmt(totalOutstanding)}</p>
        <p className="text-blue-200 text-xs mt-1">{customers.length} জন কাস্টমার</p>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Customer list */}
        <div className="lg:col-span-2 space-y-3">
          <input
            className="input"
            placeholder="🔍 কাস্টমার খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {isLoading && <p className="text-center text-gray-400 py-8">লোড হচ্ছে...</p>}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">📒</p>
              <p className="text-sm">কোনো কাস্টমার নেই</p>
              <button onClick={() => setShowAddCustomer(true)} className="mt-3 text-blue-600 text-sm font-semibold hover:underline">
                + প্রথম কাস্টমার যোগ করুন
              </button>
            </div>
          )}
          {filtered.map(c => {
            const remaining = customerSummary(c.id)
            const isSelected = selectedCustomer?.id === c.id
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white hover:border-gray-200'} shadow-card`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{c.name}</p>
                    {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${remaining > 0 ? 'text-red-600' : remaining < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {remaining > 0 ? `বাকি ${fmt(remaining)}` : remaining < 0 ? `অতিরিক্ত ${fmt(Math.abs(remaining))}` : 'পরিশোধ ✓'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selectedCustomer ? (
            <CustomerDetail
              customer={selectedCustomer}
              entries={allEntries.filter(e => e.customer_id === selectedCustomer.id)}
              onAddEntry={() => setShowEntryModal(true)}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-card h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-4xl mb-2">👈</p>
                <p className="text-sm">একজন কাস্টমার বেছে নিন</p>
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
        />
      )}
      {showEntryModal && selectedCustomer && (
        <EntryModal
          customer={selectedCustomer}
          onClose={() => setShowEntryModal(false)}
          onSave={(form) => addEntry.mutate(form)}
        />
      )}
    </div>
  )
}
