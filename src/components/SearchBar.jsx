import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ className = '', placeholder = 'দোকানের নাম বা ধরন লিখুন...' }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/shops?search=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className={`flex gap-2 ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
      />
      <button
        type="submit"
        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
      >
        🔍 খুঁজুন
      </button>
    </form>
  )
}
