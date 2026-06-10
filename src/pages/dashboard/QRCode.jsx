import { useState, useRef, useEffect } from 'react'
import { useMyShops } from '../../hooks/useShops'

const SITE_URL = 'https://shiber-bazar.vercel.app'
const BLUE = '#2563EB'
const GREEN = '#16a34a'

function qrUrl(url, size = 300) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=000000&bgcolor=ffffff&margin=10&qzone=1&format=png`
}

export default function QRCodePage() {
  const { data: shops = [], isLoading } = useMyShops()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [posterDownloading, setPosterDownloading] = useState(false)
  const canvasRef = useRef(null)

  const shop = shops[selectedIdx] || null
  const shopUrl = shop
    ? `${SITE_URL}/shop/${shop.slug || shop.id}`
    : ''

  /* ── Download just the QR image ── */
  async function downloadQR() {
    if (!shop) return
    setDownloading(true)
    try {
      const resp = await fetch(qrUrl(shopUrl, 600))
      const blob = await resp.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${shop.shop_name}-qr.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      alert('ডাউনলোড করতে সমস্যা হয়েছে।')
    } finally {
      setDownloading(false)
    }
  }

  /* ── Generate + download poster via Canvas ── */
  async function downloadPoster() {
    if (!shop) return
    setPosterDownloading(true)
    try {
      const W = 600, H = 900
      const canvas = canvasRef.current
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      /* ── Background gradient ── */
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#e0eaff')
      bgGrad.addColorStop(1, '#f0f7ff')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      /* ── Top blue wave header ── */
      const headerGrad = ctx.createLinearGradient(0, 0, W, 200)
      headerGrad.addColorStop(0, '#1d4ed8')
      headerGrad.addColorStop(1, '#2563eb')
      ctx.fillStyle = headerGrad
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(W, 0)
      ctx.lineTo(W, 160)
      ctx.quadraticCurveTo(W / 2, 230, 0, 160)
      ctx.closePath()
      ctx.fill()

      /* ── Header text ── */
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = 'bold 38px sans-serif'
      ctx.fillText('দোকান লিংক', W / 2, 80)
      ctx.font = '20px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      ctx.fillText('আপনার দোকান এখন অনলাইনে', W / 2, 115)

      /* ── QR code white card ── */
      const qrSize = 320
      const qrX = (W - qrSize) / 2
      const qrY = 220
      // shadow
      ctx.shadowColor = 'rgba(0,0,0,0.12)'
      ctx.shadowBlur = 24
      ctx.shadowOffsetY = 6
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 24)
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      /* ── Draw QR image ── */
      const qrImg = await loadImage(qrUrl(shopUrl, 600))
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      /* ── Shop logo (if available) ── */
      const logoUrl = shop.logo_url || shop.logo
      if (logoUrl) {
        try {
          const logoImg = await loadImage(logoUrl)
          const ls = 72, lx = (W - ls) / 2, ly = qrY + qrSize + 30
          ctx.save()
          ctx.beginPath()
          ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(logoImg, lx, ly, ls, ls)
          ctx.restore()
          // circle border
          ctx.strokeStyle = BLUE
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2)
          ctx.stroke()
        } catch { /* logo failed, skip */ }
      }

      /* ── Shop name ── */
      const nameY = logoUrl ? qrY + qrSize + 130 : qrY + qrSize + 60
      ctx.fillStyle = '#1e293b'
      ctx.textAlign = 'center'
      ctx.font = 'bold 34px sans-serif'
      ctx.fillText(shop.shop_name, W / 2, nameY)

      /* ── Category ── */
      if (shop.category) {
        ctx.fillStyle = BLUE
        ctx.font = '18px sans-serif'
        ctx.fillText(shop.category, W / 2, nameY + 36)
      }

      /* ── Contact ── */
      const contactY = nameY + (shop.category ? 80 : 55)
      ctx.fillStyle = '#64748b'
      ctx.font = '17px sans-serif'
      ctx.fillText(`যোগাযোগ:  ${shop.phone || 'N/A'}`, W / 2, contactY)

      /* ── Address ── */
      if (shop.address) {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '15px sans-serif'
        wrapText(ctx, `📍 ${shop.address}`, W / 2, contactY + 30, W - 80, 22)
      }

      /* ── Bottom URL strip ── */
      ctx.fillStyle = '#2563eb'
      ctx.fillRect(0, H - 70, W, 70)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = '15px sans-serif'
      ctx.fillText('🔗  ' + shopUrl, W / 2, H - 30)

      /* ── Download ── */
      const a = document.createElement('a')
      a.download = `${shop.shop_name}-poster.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch (err) {
      console.error(err)
      alert('পোস্টার তৈরি করতে সমস্যা হয়েছে।')
    } finally {
      setPosterDownloading(false)
    }
  }

  /* ── Helpers ── */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ')
    let line = ''
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        ctx.fillText(line, x, y)
        line = words[i] + ' '
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, y)
  }

  /* ──────────────────────────────────────────── */

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  if (!shops.length) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🏪</div>
      <p className="text-gray-500 text-sm">কোনো দোকান নেই। আগে একটি দোকান তৈরি করুন।</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">দোকানের QR কোড</h1>
        <p className="text-sm text-gray-500 mt-1">আপনার দোকানের QR কোড তৈরি করুন এবং ডাউনলোড করুন</p>
      </div>

      {/* Shop selector (if multiple shops) */}
      {shops.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">দোকান বেছে নিন</p>
          <div className="flex flex-wrap gap-2">
            {shops.map((s, i) => (
              <button key={s.id} onClick={() => setSelectedIdx(i)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  selectedIdx === i
                    ? 'text-white border-transparent shadow-sm'
                    : 'text-gray-600 border-gray-200 hover:border-blue-300 bg-white'
                }`}
                style={selectedIdx === i ? { background: BLUE } : {}}>
                {s.shop_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QR Display Card */}
      {shop && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-5">
          {/* QR Code */}
          <div className="bg-white rounded-2xl shadow-inner border border-gray-100 p-5">
            <img
              src={qrUrl(shopUrl, 300)}
              alt="QR Code"
              className="w-56 h-56 sm:w-64 sm:h-64"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="text-center text-xs text-gray-400 mt-3 max-w-[200px] truncate mx-auto">{shopUrl}</p>
          </div>

          {/* Shop info summary */}
          <div className="text-center">
            <p className="font-bold text-gray-800 text-lg">{shop.shop_name}</p>
            {shop.category && <p className="text-sm text-blue-600">{shop.category}</p>}
            {shop.phone && <p className="text-sm text-gray-500 mt-1">📞 {shop.phone}</p>}
            {shop.address && <p className="text-xs text-gray-400 mt-0.5">📍 {shop.address}</p>}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={downloadQR}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition-all disabled:opacity-60">
              {downloading
                ? <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              }
              QR কোড ডাউনলোড করুন
            </button>

            <button
              onClick={downloadPoster}
              disabled={posterDownloading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #1d4ed8)` }}>
              {posterDownloading
                ? <span className="w-4 h-4 border-2 border-blue-200 border-t-white rounded-full animate-spin" />
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              }
              পোস্টার ডাউনলোড করুন
            </button>
          </div>
        </div>
      )}

      {/* How to use card */}
      <div className="rounded-2xl border p-5 flex gap-4" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
        <span className="text-2xl flex-shrink-0 mt-0.5">🖨️</span>
        <div>
          <p className="font-bold text-blue-800 mb-1">কিভাবে ব্যবহার করবেন?</p>
          <p className="text-sm text-blue-700 leading-relaxed">
            QR কোডটি ডাউনলোড করে প্রিন্ট করুন এবং আপনার দোকানে লাগিয়ে দিন।
            ক্রেতারা QR কোড স্ক্যান করে সরাসরি আপনার অনলাইন দোকান দেখতে পারবেন।
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-blue-600 font-medium">
            <span className="flex items-center gap-1">✅ প্রিন্ট করুন</span>
            <span className="flex items-center gap-1">✅ দোকানে লাগান</span>
            <span className="flex items-center gap-1">✅ ক্রেতা স্ক্যান করবেন</span>
            <span className="flex items-center gap-1">✅ অর্ডার পাবেন</span>
          </div>
        </div>
      </div>

      {/* Shop URL copy */}
      {shop && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">দোকানের লিংক</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shopUrl}
              className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 min-w-0"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shopUrl)
                  .then(() => alert('লিংক কপি হয়েছে!'))
              }}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: GREEN }}>
              কপি
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">এই লিংকটি শেয়ার করুন — সরাসরি আপনার দোকানে নিয়ে যাবে</p>
        </div>
      )}

      {/* Hidden canvas for poster generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
