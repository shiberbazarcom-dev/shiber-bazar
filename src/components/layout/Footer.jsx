import { Link } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'

export default function Footer() {
  const { data: categories = [] } = useCategories()

  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="container-app py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
                   style={{ background: '#2563EB' }}>
                শ
              </div>
              <div>
                <p className="font-bold text-gray-800">শিবের বাজার</p>
                <p className="text-xs text-gray-400">দোকান ডিরেক্টরি</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              আপনার এলাকার সকল দোকানের তথ্য এক জায়গায়। সহজে খুঁজুন, যোগাযোগ করুন।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">দ্রুত লিংক</h4>
            <ul className="space-y-2">
              {[
                { to: '/',           label: 'হোম' },
                { to: '/shops',      label: 'সব দোকান' },
                { to: '/categories', label: 'ক্যাটাগরিসমূহ' },
                { to: '/contact',    label: 'যোগাযোগ' },
                { to: '/register',   label: 'দোকান যোগ করুন' },
                { to: '/login',      label: 'লগইন' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-500 hover:text-blue-700 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">জনপ্রিয় ক্যাটাগরি</h4>
            <ul className="space-y-2">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors">
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">যোগাযোগ</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-gray-500">
                <span>📍</span>
                <span>শিবের বাজার, বাংলাদেশ</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <span>📞</span>
                <span>+৮৮০-১XXX-XXXXXX</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <span>✉️</span>
                <span>info@shiberbazar.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 py-4">
        <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">© ২০২৪ শিবের বাজার। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-4">
            <span className="text-xs text-gray-400">গোপনীয়তা নীতি</span>
            <span className="text-xs text-gray-400">শর্তাবলী</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
