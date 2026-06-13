import { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    function handleOffline() { setOffline(true); setShowBack(false) }
    function handleOnline()  {
      setOffline(false)
      setShowBack(true)
      setTimeout(() => setShowBack(false), 3000)
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [])

  if (!offline && !showBack) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white transition-all ${
      offline ? 'bg-red-500' : 'bg-green-500'
    }`}>
      {offline ? (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          ইন্টারনেট নেই — পুরনো তথ্য দেখাচ্ছে
        </>
      ) : (
        <>
          ✓ ইন্টারনেট ফিরে এসেছে
        </>
      )}
    </div>
  )
}
