/**
 * WhatsApp utility functions — শিবের বাজার
 * Reusable across admin, shop owner, and customer pages.
 */

/** Normalize any BD phone number to international format for wa.me */
export function normalizePhone(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('880'))  return digits          // already 880XXXXXXXXXX
  if (digits.startsWith('88'))   return digits          // already 88XXXXXXXXXXX
  if (digits.startsWith('0'))    return '88' + digits   // 01XXXXXXXXX → 8801XXXXXXXXX
  if (digits.length === 10)      return '880' + digits  // bare 10-digit
  return digits
}

/** Generate wa.me URL (does not open it) */
export function whatsAppUrl(phone, message = '') {
  const num = normalizePhone(phone)
  if (!num) return ''
  return message
    ? `https://wa.me/${num}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${num}`
}

/** Open WhatsApp in a new tab */
export function openWhatsApp(phone, message = '') {
  const url = whatsAppUrl(phone, message)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

// ─────────────────────────────────────────────────────────────
// Message builders
// ─────────────────────────────────────────────────────────────

/**
 * Message for FORWARDING order to the shop owner.
 * Admin uses this — contains full order details.
 */
export function buildShopOwnerMessage(order) {
  const product  = order.product_name  || 'পণ্য'
  const qty      = order.quantity      ?? 1
  const total    = order.total_amount  ?? 0
  const address  = order.customer_address || 'দেওয়া হয়নি'
  const shopName = order.shops?.shop_name  || ''

  const lines = [
    '🛒 *নতুন অর্ডার — শিবের বাজার*',
    shopName ? `🏪 দোকান: ${shopName}` : '',
    '',
    `📦 অর্ডার নং: *${order.order_number}*`,
    `👤 গ্রাহক: ${order.customer_name}`,
    `📞 ফোন: ${order.customer_phone}`,
    `📍 ঠিকানা: ${address}`,
    '',
    `🛍️ পণ্য: *${product}*`,
    `🔢 পরিমাণ: ${qty}`,
    total > 0 ? `💰 মোট: ৳${Number(total).toLocaleString('bn-BD')}` : '',
    order.notes ? `📝 নোট: ${order.notes}` : '',
    '',
    '_শিবের বাজার অ্যাডমিন থেকে পাঠানো_',
  ].filter(line => line !== undefined && line !== null)

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Message for notifying the CUSTOMER their order is confirmed.
 * Shop owner uses this.
 */
export function buildCustomerConfirmMessage(order) {
  const product = order.product_name || ''
  const qty     = order.quantity     ?? 1
  const total   = order.total_amount ?? 0

  const lines = [
    `হ্যালো *${order.customer_name}*! 👋`,
    '',
    `✅ আপনার অর্ডার *কনফার্ম* হয়েছে।`,
    '',
    `📦 অর্ডার নং: *${order.order_number}*`,
    product ? `🛍️ পণ্য: ${product} × ${qty}` : '',
    total > 0 ? `💰 মোট: ৳${Number(total).toLocaleString('bn-BD')}` : '',
    '',
    'শীঘ্রই আপনার সাথে যোগাযোগ করা হবে। 🙏',
    '— *শিবের বাজার*',
  ].filter(Boolean)

  return lines.join('\n')
}

/**
 * Message to notify customer their order has been SHIPPED.
 */
export function buildCustomerShippedMessage(order) {
  const lines = [
    `হ্যালো *${order.customer_name}*!`,
    '',
    `🚚 আপনার অর্ডার *পাঠানো হয়েছে*।`,
    `📦 অর্ডার নং: ${order.order_number}`,
    '',
    'শীঘ্রই পৌঁছে যাবে। ধন্যবাদ! 🙏',
    '— *শিবের বাজার*',
  ]
  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────
// Convenience URL builders
// ─────────────────────────────────────────────────────────────

/** Admin → forwards order to shop owner's WhatsApp */
export function shopOwnerWhatsAppUrl(order) {
  const phone = order.shops?.whatsapp || order.shops?.phone || ''
  if (!phone) return ''
  return whatsAppUrl(phone, buildShopOwnerMessage(order))
}

/** Shop owner → sends confirmation to customer */
export function customerConfirmWhatsAppUrl(order) {
  if (!order.customer_phone) return ''
  return whatsAppUrl(order.customer_phone, buildCustomerConfirmMessage(order))
}

/** Shop owner → sends shipped notification to customer */
export function customerShippedWhatsAppUrl(order) {
  if (!order.customer_phone) return ''
  return whatsAppUrl(order.customer_phone, buildCustomerShippedMessage(order))
}
