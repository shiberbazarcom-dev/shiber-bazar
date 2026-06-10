import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      return setError('পাসওয়ার্ড মিলছে না')
    }
    if (form.password.length < 6) {
      return setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে')
    }

    setLoading(true)
    const { error: err } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phone: form.phone,
    })

    if (err) {
      setError(err.message === 'User already registered' ? 'এই ইমেইলে আগেই নিবন্ধন আছে' : err.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
        <p className="text-6xl mb-4">✅</p>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">নিবন্ধন সফল হয়েছে!</h2>
        <p className="text-gray-600 mb-6">
          আপনার ইমেইলে একটি নিশ্চিতকরণ লিংক পাঠানো হয়েছে। ইমেইল যাচাই করুন তারপর লগইন করুন।
        </p>
        <Link to="/login" className="btn-primary inline-block w-full py-3">লগইন পেজে যান</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🏪 দোকান নিবন্ধন করুন</h1>
          <p className="text-gray-500 mt-1 text-sm">আপনার একাউন্ট তৈরি করুন</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পূর্ণ নাম *</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              placeholder="আপনার নাম"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">মোবাইল নম্বর</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="০১XXXXXXXXX"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="কমপক্ষে ৬ অক্ষর"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড নিশ্চিত করুন *</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="পাসওয়ার্ড আবার লিখুন"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'অপেক্ষা করুন...' : 'নিবন্ধন করুন'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          আগেই নিবন্ধিত?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">লগইন করুন</Link>
        </p>
      </div>
    </div>
  )
}
