import { Link } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'

const YEAR = new Date().getFullYear()

export default function Footer() {
  const { data: categories = [] } = useCategories()

  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="container-app py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">

          {/* Brand — full width on smallest screens */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="শিবের বাজার" className="w-9 h-9 object-contain flex-shrink-0"
                   onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
              <div className="w-9 h-9 rounded-lg items-center justify-center text-white font-bold flex-shrink-0 hidden"
                   style={{ background: 'var(--primary)' }}>
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
                { to: '/policy',     label: 'গোপনীয়তা নীতি' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-500 hover:text-purple-700 transition-colors">
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
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-700 transition-colors">
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">যোগাযোগ</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-gray-500">
                <span className="flex-shrink-0 mt-0.5">📍</span>
                <span>শিবের বাজার, সিলেট সদর, সিলেট</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex-shrink-0">📞</span>
                <a href="tel:+8801310012276" className="hover:text-purple-700 transition-colors">
                  ০১৩১০-০১২২৭৬
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex-shrink-0">💬</span>
                <a href="https://wa.me/8801310012276" target="_blank" rel="noopener noreferrer"
                   className="hover:text-green-600 transition-colors">
                  WhatsApp করুন
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100 pt-4 pb-20 md:pb-4">
        <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-xs text-gray-400">
            © {YEAR} শিবের বাজার। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="flex gap-4">
            <Link to="/policy" className="text-xs text-gray-400 hover:text-purple-600 transition-colors">
              গোপনীয়তা নীতি
            </Link>
            <Link to="/policy#terms" className="text-xs text-gray-400 hover:text-purple-600 transition-colors">
              শর্তাবলী
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
