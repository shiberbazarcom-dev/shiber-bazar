import { Link } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'
import { useSiteSettings } from '../../hooks/useSettings'
import { normalizePhone } from '../../lib/whatsapp'

const YEAR = new Date().getFullYear()

// Fallback constants — used when CMS value is empty
const FB = {
  site_name:            'শিবের বাজার',
  footer_about:         'আপনার এলাকার সকল দোকানের তথ্য এক জায়গায়। সহজে খুঁজুন, যোগাযোগ করুন।',
  contact_address:      'শিবের বাজার, সিলেট সদর, সিলেট',
  contact_phone:        '01310012276',
  contact_phone_display:'০১৩১০-০১২২৭৬',
  whatsapp_number:      '8801310012276',
  site_footer_copyright:'শিবের বাজার। সর্বস্বত্ব সংরক্ষিত।',
}

function cms(settings, key) {
  const v = settings[key]
  return (v !== undefined && v !== null && v !== '') ? v : (FB[key] ?? '')
}

export default function Footer() {
  const { data: categories = [] } = useCategories()
  const { data: settings = {} } = useSiteSettings()

  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="container-app py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">

          {/* Brand — full width on smallest screens */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={cms(settings,'site_logo_url') || '/logo.png'} alt={cms(settings,'site_name')} className="w-9 h-9 object-contain flex-shrink-0"
                   onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
              <div className="w-9 h-9 rounded-lg items-center justify-center text-white font-bold flex-shrink-0 hidden"
                   style={{ background: '#2563EB' }}>
                শ
              </div>
              <div>
                <p className="font-bold text-gray-800">{cms(settings,'site_name')}</p>
                <p className="text-xs text-gray-400">দোকান ডিরেক্টরি</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              {cms(settings,'footer_about')}
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
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">যোগাযোগ</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-gray-500">
                <span className="flex-shrink-0 mt-0.5">📍</span>
                <span>{cms(settings,'contact_address')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex-shrink-0">📞</span>
                <a href={`tel:${cms(settings,'contact_phone')}`} className="hover:text-blue-700 transition-colors">
                  {cms(settings,'contact_phone_display')}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex-shrink-0">💬</span>
                {/* normalizePhone: CMS-এ 01XXXXXXXXX থাকলেও wa.me লিংক কাজ করবে */}
                <a href={`https://wa.me/${normalizePhone(cms(settings,'whatsapp_number'))}`} target="_blank" rel="noopener noreferrer"
                   className="hover:text-green-600 transition-colors">
                  WhatsApp করুন
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex-shrink-0">📘</span>
                <a href="https://www.facebook.com/shiberbazardigital" target="_blank" rel="noopener noreferrer"
                   className="hover:text-blue-600 transition-colors">
                  ফেসবুক পেজ
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
            © {YEAR} {cms(settings,'site_footer_copyright')}
          </p>
          <div className="flex gap-4">
            <Link to="/policy" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
              গোপনীয়তা নীতি
            </Link>
            <Link to="/policy#terms" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
              শর্তাবলী
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
