import { useState } from 'react'
import * as XLSX from 'xlsx'
import { useCategories } from '../../hooks/useCategories'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

function useApprovedShops() {
  return useQuery({
    queryKey: ['approved-shops-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('shops').select('id, shop_name').eq('status', 'approved').order('shop_name')
      return data || []
    },
  })
}

function generateSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '').slice(0, 60)
    + '-' + Math.random().toString(36).slice(2, 6)
}

/* ── Download template Excel ── */
function downloadTemplate(type) {
  const shopHeaders  = [['দোকানের নাম', 'ক্যাটাগরি', 'ফোন', 'ঠিকানা', 'জেলা', 'WhatsApp', 'বিবরণ']]
  const prodHeaders  = [['পণ্যের নাম', 'দাম', 'ক্যাটাগরি', 'স্টকে আছে (হ্যাঁ/না)']]
  const shopExample  = [['করিম স্টোর', 'মুদিখানা', '01711000000', 'শিবগঞ্জ বাজার', 'চাঁপাইনবাবগঞ্জ', '01711000000', 'সব ধরনের মুদিখানা পণ্য']]
  const prodExample  = [['চাল (মিনিকেট)', '60', 'চাল', 'হ্যাঁ'], ['সরিষার তেল', '180', 'তেল', 'হ্যাঁ']]

  const ws = XLSX.utils.aoa_to_sheet(type === 'shop' ? [...shopHeaders, ...shopExample] : [...prodHeaders, ...prodExample])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, type === 'shop' ? 'দোকান' : 'পণ্য')
  XLSX.writeFile(wb, type === 'shop' ? 'দোকান_template.xlsx' : 'পণ্য_template.xlsx')
}

/* ── Parse uploaded file ── */
function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        resolve(rows)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/* ══════════════════════════════════
   Tab 1 — Shop Import
══════════════════════════════════ */
function ShopImportTab() {
  const { user } = useAuth()
  const { data: categories = [] } = useCategories()
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(null)

  const catMap = Object.fromEntries(
    categories.map(c => [c.name.toLowerCase().trim(), c.id])
  )

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const raw    = await parseFile(file)
      const header = raw[0] || []
      const data   = raw.slice(1).filter(r => r.some(c => String(c).trim()))
      const parsed = data.map((r, i) => {
        const name   = String(r[0] || '').trim()
        const cat    = String(r[1] || '').trim()
        const catId  = catMap[cat.toLowerCase()] || null
        return {
          _row:      i + 2,
          shop_name: name,
          _category: cat,
          category_id: catId,
          phone:       String(r[2] || '').trim(),
          address:     String(r[3] || '').trim(),
          district:    String(r[4] || '').trim() || null,
          whatsapp:    String(r[5] || '').trim() || null,
          description: String(r[6] || '').trim() || null,
          _valid: !!name && !!catId && !!String(r[2] || '').trim() && !!String(r[3] || '').trim(),
        }
      })
      setRows(parsed)
      setDone(null)
    } catch {
      toast.error('ফাইল পড়তে সমস্যা হয়েছে')
    }
    e.target.value = ''
  }

  async function handleImport() {
    const valid = rows.filter(r => r._valid)
    if (!valid.length) return toast.error('কোনো valid row নেই')
    setLoading(true)
    try {
      const inserts = valid.map(r => ({
        shop_name:   r.shop_name,
        slug:        generateSlug(r.shop_name),
        category_id: r.category_id,
        phone:       r.phone,
        address:     r.address,
        district:    r.district,
        whatsapp:    r.whatsapp || r.phone,
        description: r.description,
        owner_id:    user.id,
        status:      'approved',
        is_verified: false,
      }))
      const { error } = await supabase.from('shops').insert(inserts)
      if (error) throw error
      toast.success(`✅ ${valid.length}টি দোকান যোগ হয়েছে`)
      setDone(valid.length)
      setRows([])
    } catch (err) {
      toast.error('সমস্যা: ' + (err.message || 'আবার চেষ্টা করুন'))
    } finally {
      setLoading(false)
    }
  }

  const validCount   = rows.filter(r => r._valid).length
  const invalidCount = rows.length - validCount

  return (
    <div className="space-y-5">
      {/* Download template */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-blue-800 text-sm">Excel Template</p>
          <p className="text-xs text-purple-600 mt-0.5">এই template এ তথ্য পূরণ করুন, তারপর upload করুন</p>
        </div>
        <button onClick={() => downloadTemplate('shop')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors">
          📥 Template Download
        </button>
      </div>

      {/* Upload */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">Excel / CSV ফাইল আপলোড করুন</label>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
          <span className="text-2xl mb-1">📂</span>
          <span className="text-sm text-gray-500">.xlsx বা .csv ফাইল বেছে নিন</span>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        </label>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">{rows.length} টি row</span>
              {validCount > 0   && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ {validCount} valid</span>}
              {invalidCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">✗ {invalidCount} invalid</span>}
            </div>
            <button onClick={() => setRows([])} className="text-xs text-gray-400 hover:text-gray-600">বাতিল</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'দোকান', 'ক্যাটাগরি', 'ফোন', 'ঠিকানা', 'স্ট্যাটাস'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className={r._valid ? 'bg-white' : 'bg-red-50'}>
                    <td className="px-3 py-2 text-gray-400">{r._row}</td>
                    <td className="px-3 py-2 font-medium text-gray-700">{r.shop_name || <span className="text-red-400">খালি</span>}</td>
                    <td className="px-3 py-2">
                      {r.category_id
                        ? <span className="text-green-700">{r._category}</span>
                        : <span className="text-red-400">{r._category || 'খালি'} (পাওয়া যায়নি)</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{r.phone || <span className="text-red-400">খালি</span>}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[150px] truncate">{r.address || <span className="text-red-400">খালি</span>}</td>
                    <td className="px-3 py-2">
                      {r._valid
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="text-red-500 font-bold">✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-50">... আরও {rows.length - 20} টি row (preview এ দেখানো হচ্ছে না)</p>
            )}
          </div>

          {validCount > 0 && (
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={handleImport} disabled={loading}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 disabled:opacity-60 transition-colors">
                {loading ? '⏳ যোগ হচ্ছে...' : `✅ ${validCount}টি দোকান import করুন`}
              </button>
            </div>
          )}
        </div>
      )}

      {done !== null && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-800">{done}টি দোকান সফলভাবে যোগ হয়েছে!</p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════
   Tab 2 — Product Import
══════════════════════════════════ */
function ProductImportTab() {
  const { data: shops = [] }  = useApprovedShops()
  const [shopId, setShopId]   = useState('')
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const raw    = await parseFile(file)
      const data   = raw.slice(1).filter(r => r.some(c => String(c).trim()))
      const parsed = data.map((r, i) => {
        const name  = String(r[0] || '').trim()
        const price = parseFloat(String(r[1] || '').replace(/[^\d.]/g, '')) || null
        const inStock = !['না', 'no', 'false', '0'].includes(String(r[3] || 'হ্যাঁ').trim().toLowerCase())
        return {
          _row: i + 2,
          name,
          price,
          category: String(r[2] || '').trim() || null,
          in_stock: inStock,
          _valid: !!name,
        }
      })
      setRows(parsed)
      setDone(null)
    } catch {
      toast.error('ফাইল পড়তে সমস্যা হয়েছে')
    }
    e.target.value = ''
  }

  async function handleImport() {
    if (!shopId) return toast.error('দোকান বেছে নিন')
    const valid = rows.filter(r => r._valid)
    if (!valid.length) return toast.error('কোনো valid পণ্য নেই')
    setLoading(true)
    try {
      const inserts = valid.map(r => ({
        shop_id:   shopId,
        name:      r.name,
        price:     r.price,
        category:  r.category,
        in_stock:  r.in_stock,
        is_active: true,
      }))
      const { error } = await supabase.from('products').insert(inserts)
      if (error) throw error
      toast.success(`✅ ${valid.length}টি পণ্য যোগ হয়েছে`)
      setDone(valid.length)
      setRows([])
    } catch (err) {
      toast.error('সমস্যা: ' + (err.message || 'আবার চেষ্টা করুন'))
    } finally {
      setLoading(false)
    }
  }

  const validCount   = rows.filter(r => r._valid).length
  const invalidCount = rows.length - validCount

  return (
    <div className="space-y-5">
      {/* Download template */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-blue-800 text-sm">পণ্য Template</p>
          <p className="text-xs text-purple-600 mt-0.5">এই format এ পণ্যের তালিকা বানান</p>
        </div>
        <button onClick={() => downloadTemplate('product')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors">
          📥 Template Download
        </button>
      </div>

      {/* Shop select */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">কোন দোকানে পণ্য যোগ হবে? *</label>
        <select value={shopId} onChange={e => setShopId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 bg-white">
          <option value="">দোকান বেছে নিন</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
        </select>
      </div>

      {/* Upload */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">Excel / CSV ফাইল আপলোড করুন</label>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
          <span className="text-2xl mb-1">📂</span>
          <span className="text-sm text-gray-500">.xlsx বা .csv ফাইল বেছে নিন</span>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        </label>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">{rows.length} টি পণ্য</span>
              {validCount   > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ {validCount}</span>}
              {invalidCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">✗ {invalidCount}</span>}
            </div>
            <button onClick={() => setRows([])} className="text-xs text-gray-400 hover:text-gray-600">বাতিল</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'পণ্যের নাম', 'দাম', 'ক্যাটাগরি', 'স্টক', 'স্ট্যাটাস'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className={r._valid ? 'bg-white' : 'bg-red-50'}>
                    <td className="px-3 py-2 text-gray-400">{r._row}</td>
                    <td className="px-3 py-2 font-medium text-gray-700">{r.name || <span className="text-red-400">খালি</span>}</td>
                    <td className="px-3 py-2 text-gray-600">{r.price ? `৳${r.price}` : '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.category || '—'}</td>
                    <td className="px-3 py-2">{r.in_stock ? '✓' : '✗'}</td>
                    <td className="px-3 py-2">{r._valid ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-500 font-bold">✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-50">... আরও {rows.length - 20} টি</p>
            )}
          </div>

          {validCount > 0 && (
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={handleImport} disabled={loading || !shopId}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 disabled:opacity-60 transition-colors">
                {loading ? '⏳ যোগ হচ্ছে...' : `✅ ${validCount}টি পণ্য import করুন`}
              </button>
            </div>
          )}
        </div>
      )}

      {done !== null && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-800">{done}টি পণ্য সফলভাবে যোগ হয়েছে!</p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════
   Main Page
══════════════════════════════════ */
export default function BulkImport() {
  const [tab, setTab] = useState('shop')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📥 Bulk Import</h1>
        <p className="text-sm text-gray-400 mt-0.5">Excel থেকে একবারে অনেক দোকান বা পণ্য যোগ করুন</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'shop',    label: '🏪 দোকান import' },
          { key: 'product', label: '🛍️ পণ্য import' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shop'    && <ShopImportTab />}
      {tab === 'product' && <ProductImportTab />}
    </div>
  )
}
