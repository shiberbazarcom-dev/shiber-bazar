import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { whatsappUrl } from '../lib/utils'
import toast from 'react-hot-toast'

const GREEN = '#16a34a'
const BLUE  = 'var(--primary)'

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart } = useCart()
  const navigate = useNavigate()

  const total = items.reduce((sum, i) => sum + Number(i.price || 0) * (i.qty || 1), 0)

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center pb-28 md:pb-16">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">কার্ট খালি</h2>
      <p className="text-gray-400 text-sm mb-6">কোনো পণ্য যোগ করা হয়নি</p>
      <Link to="/shops"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
        style={{ background: BLUE }}>
        🏪 দোকান দেখুন
      </Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32 md:pb-12 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">🛒 আমার কার্ট</h1>
          <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">{items.length}টি পণ্য</span>
        </div>
        <button onClick={() => { clearCart(); toast.success('কার্ট খালি হয়েছে') }}
          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
          সব মুছুন
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm p-3 flex items-start gap-3">
            {/* Image */}
            <Link to={`/product/${item.id}`} className="flex-shrink-0">
              {item.image_url
                ? <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-gray-50" />
                : <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-3xl">📦</div>
              }
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.id}`}>
                <p className="font-semibold text-sm text-gray-800 line-clamp-2 hover:text-purple-700 transition-colors">
                  {item.name}
                </p>
              </Link>
              {item.shops?.shop_name && (
                <p className="text-xs text-gray-400 mt-0.5">🏪 {item.shops.shop_name}</p>
              )}
              <p className="text-base font-bold mt-1" style={{ color: GREEN }}>
                ৳{(Number(item.price || 0) * (item.qty || 1)).toLocaleString('bn-BD')}
              </p>
              {item.qty > 1 && (
                <p className="text-xs text-gray-400">৳{Number(item.price).toLocaleString('bn-BD')} × {item.qty}</p>
              )}

              {/* Qty control */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => item.qty <= 1 ? removeItem(item.id) : updateQty(item.id, item.qty - 1)}
                    className="w-8 h-7 text-gray-600 hover:bg-gray-100 font-bold text-base flex items-center justify-center transition-colors">
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-800">{item.qty || 1}</span>
                  <button onClick={() => updateQty(item.id, (item.qty || 1) + 1)}
                    className="w-8 h-7 text-gray-600 hover:bg-gray-100 font-bold text-base flex items-center justify-center transition-colors">
                    +
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors">
                  মুছুন
                </button>
              </div>
            </div>

            {/* WhatsApp order for this item */}
            {(item.shops?.whatsapp || item.shops?.phone) && (
              <a href={whatsappUrl(
                  item.shops.whatsapp || item.shops.phone,
                  `"${item.name}" পণ্যটি অর্ডার করতে চাই${item.price ? ` — মূল্য ৳${item.price}` : ''}`
                )}
                target="_blank" rel="noreferrer"
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white flex-col transition-opacity hover:opacity-90"
                style={{ background: '#25d366' }}
                title="WhatsApp অর্ডার">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex justify-between text-sm text-gray-500">
          <span>মোট পণ্য</span>
          <span>{items.reduce((s, i) => s + (i.qty || 1), 0)}টি</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-3">
          <span className="text-gray-800">মোট মূল্য</span>
          <span style={{ color: GREEN }}>৳{total.toLocaleString('bn-BD')}</span>
        </div>
        <p className="text-xs text-gray-400">* প্রতিটি পণ্যের জন্য আলাদা দোকানে যোগাযোগ করুন</p>
      </div>

      {/* ── Checkout: Order by shop ── */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">📲 অর্ডার করুন</p>
        {(() => {
          // Group items by shop
          const byShop = {}
          items.forEach(item => {
            const shopId = item.shops?.id || item.shop_id || 'unknown'
            if (!byShop[shopId]) byShop[shopId] = { shop: item.shops, items: [] }
            byShop[shopId].items.push(item)
          })
          return Object.values(byShop).map(({ shop, items: shopItems }) => {
            const shopName = shop?.shop_name || 'দোকান'
            const phone = shop?.whatsapp || shop?.phone
            const msgLines = shopItems.map(i =>
              `• ${i.name} × ${i.qty || 1}${i.price ? ` — ৳${Number(i.price) * (i.qty || 1)}` : ''}`
            ).join('\n')
            const totalForShop = shopItems.reduce((s, i) => s + Number(i.price || 0) * (i.qty || 1), 0)
            const msg = `আস-সালামু আলাইকুম, "${shopName}" থেকে অর্ডার করতে চাই:\n\n${msgLines}\n\nমোট: ৳${totalForShop}`
            return (
              <div key={shop?.id || 'unknown'} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs">🏪</span>
                  <p className="text-xs font-semibold text-gray-700 truncate flex-1">{shopName}</p>
                  <p className="text-xs text-gray-400 flex-shrink-0">{shopItems.length}টি পণ্য — ৳{totalForShop.toLocaleString('bn-BD')}</p>
                </div>
                <div className="flex gap-2">
                  {/* Website order — passes all shop items as state */}
                  {shop?.id && (
                    <button
                      onClick={() => navigate(`/order/${shop.id}`, {
                        state: {
                          shopName,
                          cartItems: shopItems,
                          totalAmount: totalForShop,
                        }
                      })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
                      style={{ background: BLUE }}>
                      🛒 Order Now
                    </button>
                  )}
                  {/* WhatsApp order */}
                  {phone ? (
                    <a href={whatsappUrl(phone, msg)} target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
                      style={{ background: '#25d366' }}>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      WhatsApp অর্ডার
                    </a>
                  ) : (
                    <span className="flex-1 text-center text-xs text-gray-400 italic py-2">নম্বর নেই</span>
                  )}
                </div>
              </div>
            )
          })
        })()}
      </div>

      {/* Continue shopping */}
      <Link to="/shops"
        className="block w-full text-center py-3 rounded-xl border-2 font-semibold text-sm transition-colors hover:bg-purple-50"
        style={{ borderColor: BLUE, color: BLUE }}>
        🏪 আরও কেনাকাটা করুন
      </Link>
    </div>
  )
}
