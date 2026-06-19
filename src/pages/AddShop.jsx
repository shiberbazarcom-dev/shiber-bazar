import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AddShop() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '', description: '', category_id: '', phone: '',
    address: '', image_url: '', opening_time: '৮:০০ AM', closing_time: '৮:০০ PM',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []))
  }, [])

  if (!user) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🔐</p>
      <p className="text-xl text-gray-600 mb-4">দোকান যোগ করতে আগে লগইন করুন</p>
      <Link to="/login" className="btn-primary inline-block">লগইন করুন</Link>
    </div>
  )

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('দোকানের নাম দিন')
    if (!form.category_id) return setError('বিভাগ নির্বাচন করুন')

    setLoading(true)
    const { error: err } = await supabase.from('shops').insert({
      ...form,
      owner_id: user.id,
      is_approved: false,
    })

    if (err) setError('দোকান যোগ করতে সমস্যা হয়েছে: ' + err.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
        <p className="text-6xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">আবেদন জমা হয়েছে!</h2>
        <p className="text-gray-600 mb-6">
          আপনার দোকানটি যাচাই করার পরে সাইটে দেখা যাবে। অ্যাডমিন শীঘ্রই অনুমোদন করবেন।
        </p>
        <Link to="/" className="btn-primary inline-block w-full py-3">হোম পেজে যান</Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🏪 নতুন দোকান যোগ করুন</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-lg mb-6 text-sm">
        ℹ️ আপনার দোকানটি অ্যাডমিন অনুমোদনের পরে সাইটে দেখা যাবে।
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">দোকানের নাম *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange}
            required placeholder="যেমন: করিমের মুদি দোকান" className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি *</label>
          <select name="category_id" value={form.category_id} onChange={handleChange}
            required className="input-field bg-white">
            <option value="">ক্যাটাগরি নির্বাচন করুন</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={3} placeholder="দোকান সম্পর্কে কিছু লিখুন..." className="input-field resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange}
            placeholder="০১XXXXXXXXX" className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা</label>
          <input type="text" name="address" value={form.address} onChange={handleChange}
            placeholder="দোকানের ঠিকানা" className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ছবির লিংক (URL)</label>
          <input type="url" name="image_url" value={form.image_url} onChange={handleChange}
            placeholder="https://example.com/image.jpg" className="input-field" />
          <p className="text-xs text-gray-400 mt-1">ছবি না দিলে স্বয়ংক্রিয়ভাবে তৈরি হবে</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">খোলার সময়</label>
            <input type="text" name="opening_time" value={form.opening_time} onChange={handleChange}
              placeholder="৮:০০ AM" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">বন্ধের সময়</label>
            <input type="text" name="closing_time" value={form.closing_time} onChange={handleChange}
              placeholder="৮:০০ PM" className="input-field" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full btn-primary py-3 text-lg disabled:opacity-60">
          {loading ? 'জমা দেওয়া হচ্ছে...' : 'দোকান জমা দিন'}
        </button>
      </form>
    </div>
  )
}
