import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { usePlaceOrder } from '../hooks/useOrders'
import { useAdminWhatsapp } from '../hooks/useSettings'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { whatsappUrl } from '../lib/utils'
import toast from 'react-hot-toast'

const GREEN = '#2563EB'

export default function OrderPage() {
  const { shopId } = useParams()
  const [searchParams] = useSearchParams()
  const location     = useLocation()

  // Cart state (passed from CartPage "Order Now")
  const cartState    = location.state || {}
  const cartItems    = cartState.cartItems || []
  const cartTotal    = cartState.totalAmount || 0

  // Fallback to URL params (direct product order)
  const shopName     = cartState.shopName || searchParams.get('shop') || ''
  const productParam = searchParams.get('product') || ''
  const priceParam   = parseFloat(searchParams.get('price') || '0') || 0

  // Build product_name from cart items or URL param
  const defaultProductName = cartItems.length > 0
    ? cartItems.map(i => `${i.name} ×${i.qty || 1}`).join(', ')
    : productParam
  const defaultPrice = cartItems.length > 0
    ? String(cartTotal)
    : (priceParam > 0 ? String(priceParam) : '')

  const { profile } = useAuth()

  const [form, setForm] = useState({
    customer_name:    profile?.full_name || '',
    customer_phone:   profile?.phone || '',
    customer_address: '',
    product_name:     defaultProductName,
    price:            defaultPrice,
    quantity:         1,
    notes:            '',
    shop_id:          shopId || null,
  })
  const [success, setSuccess] = useState(null)
  const placeOrder     = usePlaceOrder()
  const adminWhatsapp  = useAdminWhatsapp()
  const { clearCart }  = useCart()

  // If profile loads after initial render, fill in name/phone if still empty
  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        customer_name:  f.customer_name  || profile.full_name || '',
        customer_phone: f.customer_phone || profile.phone     || '',
      }))
    }
  }, [profile])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer_name.trim()) return toast.error('নাম দিন')
    if (!form.customer_phone.trim()) return toast.error('ফোন নম্বর দিন')
    if (!form.customer_address.trim()) return toast.error('ঠিকানা দিন')
    if (!form.product_name.trim()) return toast.error('পণ্যের নাম দিন')

    try {
      const unitPrice = parseFloat(form.price) || 0
      const total_amount = unitPrice * form.quantity
      // exclude 'price' — it's UI-only, not a DB column
      const { price: _price, ...orderFields } = form
      const data = await placeOrder.mutateAsync({ ...orderFields, total_amount })
      setSuccess(data)
      clearCart()
    } catch (err) {
      console.error('[OrderPage] place order error:', err)
      toast.error('অর্ডার দিতে সমস্যা হয়েছে, আবার চেষ্টা করুন')
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"
               style={{ background: '#eff6ff' }}>🎉</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">অর্ডার সফল!</h2>
          <p className="text-gray-400 text-sm mb-4">আপনার অর্ডার নম্বর সংরক্ষণ করুন</p>

          <div className="rounded-xl px-6 py-4 mb-5 border-2 border-dashed border-blue-300"
               style={{ background: '#eff6ff' }}>
            <p className="text-xs text-gray-400 mb-1">অর্ডার নম্বর</p>
            <p className="text-3xl font-bold tracking-widest" style={{ color: GREEN }}>
              {success.order_number}
            </p>
          </div>

          <p className="text-gray-500 text-sm mb-2">
            অর্ডার কনফার্ম করতে নিচের WhatsApp বাটনে ক্লিক করুন।
          </p>
          <p className="text-gray-400 text-xs mb-6">
            আমরা <strong>{form.customer_phone}</strong> নম্বরে যোগাযোগ করব।
          </p>

          <div className="space-y-3">
            {/* Admin WhatsApp CTA — primary action */}
            {adminWhatsapp && (
              <a
                href={whatsappUrl(
                  adminWhatsapp,
                  `🛒 নতুন অর্ডার\n` +
                  `অর্ডার নম্বর: ${success.order_number}\n` +
                  `পণ্য: ${form.product_name}\n` +
                  `পরিমাণ: ${form.quantity}\n` +
                  `নাম: ${form.customer_name}\n` +
                  `ফোন: ${form.customer_phone}\n` +
                  `ঠিকানা: ${form.customer_address}` +
                  (form.notes ? `\nনোট: ${form.notes}` : '')
                )}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 font-bold rounded-xl text-sm text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: '#25D366' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp-এ অর্ডার পাঠান
              </a>
            )}

            <Link to={`/track-order?phone=${encodeURIComponent(form.customer_phone)}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-white font-semibold rounded-xl text-sm"
              style={{ background: GREEN }}>
              📦 অর্ডার ট্র্যাক করুন
            </Link>
            <Link to="/"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-gray-600 font-medium rounded-xl text-sm border border-gray-200 hover:bg-gray-50">
              🏠 হোম পেজে যান
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Order form ── */
  return (
    <div className="container-app py-8 pb-28 md:pb-10 px-4" style={{ maxWidth: 560 }}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
             style={{ background: '#eff6ff' }}>🛒</div>
        <h1 className="text-2xl font-bold text-gray-800">অর্ডার করুন</h1>
        {shopName && (
          <p className="text-sm text-gray-400 mt-1">
            দোকান: <span className="font-medium text-gray-600">{shopName}</span>
          </p>
        )}
        {!shopName && (
          <p className="text-sm text-gray-400 mt-1">রেজিস্ট্রেশন ছাড়াই অর্ডার দিন</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Customer info */}
          <div className="pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              আপনার তথ্য
            </p>
            <div className="space-y-3">
              <div>
                <label className="form-label">আপনার নাম *</label>
                <input
                  required
                  value={form.customer_name}
                  onChange={e => set('customer_name', e.target.value)}
                  className="input"
                  placeholder="পুরো নাম লিখুন"
                />
              </div>
              <div>
                <label className="form-label">ফোন নম্বর *</label>
                <input
                  required
                  type="tel"
                  value={form.customer_phone}
                  onChange={e => set('customer_phone', e.target.value)}
                  className="input"
                  placeholder="01XXXXXXXXX"
                />
                <p className="text-xs text-gray-400 mt-1">
                  এই নম্বরে অর্ডার ট্র্যাক করতে পারবেন
                </p>
              </div>
              <div>
                <label className="form-label">ডেলিভারি ঠিকানা *</label>
                <textarea
                  required
                  value={form.customer_address}
                  onChange={e => set('customer_address', e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="গ্রাম/মহল্লা, উপজেলা, জেলা"
                />
              </div>
            </div>
          </div>

          {/* Product info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              পণ্যের তথ্য
            </p>
            <div className="space-y-3">
              <div>
                <label className="form-label">পণ্যের নাম *</label>
                <input
                  required
                  value={form.product_name}
                  onChange={e => set('product_name', e.target.value)}
                  className="input"
                  placeholder="কী কিনতে চান?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">একক মূল্য (৳)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                    className="input"
                    placeholder="০"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">পরিমাণ</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button type="button"
                      onClick={() => set('quantity', Math.max(1, form.quantity - 1))}
                      className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center text-lg">
                      −
                    </button>
                    <span className="w-10 text-center font-bold text-gray-800 text-lg">
                      {form.quantity}
                    </span>
                    <button type="button"
                      onClick={() => set('quantity', form.quantity + 1)}
                      className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center text-lg">
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Total preview */}
              {parseFloat(form.price) > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 border border-green-100">
                  <span className="text-sm text-gray-600">মোট ({form.quantity} × ৳{form.price})</span>
                  <span className="font-bold text-lg" style={{ color: '#16a34a' }}>
                    ৳{(parseFloat(form.price) * form.quantity).toLocaleString('bn-BD')}
                  </span>
                </div>
              )}
              <div>
                <label className="form-label">বিশেষ নোট (ঐচ্ছিক)</label>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="রং, সাইজ, বা অন্য কোনো বিশেষ চাহিদা..."
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={placeOrder.isPending}
            className="w-full py-3 text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-opacity"
            style={{ background: GREEN }}>
            {placeOrder.isPending ? '⏳ অর্ডার দেওয়া হচ্ছে...' : '📦 অর্ডার কনফার্ম করুন'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        অর্ডার ট্র্যাক করতে{' '}
        <Link to="/track-order" className="font-medium" style={{ color: GREEN }}>
          এখানে ক্লিক করুন
        </Link>
      </p>
    </div>
  )
}
