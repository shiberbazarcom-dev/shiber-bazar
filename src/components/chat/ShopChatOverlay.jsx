import { useState, useEffect } from 'react'
import ChatWindow from './ChatWindow'

export default function ShopChatOverlay({ conversation, shopName, shopLogo, onClose }) {
  const [minimized, setMinimized] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 640) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (isMobile) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isMobile])

  const name = shopName || 'দোকান'

  const Header = ({ mobile }) => (
    <div className={`flex items-center gap-2.5 px-3 flex-shrink-0 ${mobile ? 'py-3' : 'py-2.5'}`} style={{ background: '#7c3aed' }}>
      {mobile && (
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-600 flex-shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      )}
      {shopLogo
        ? <img src={shopLogo} alt="" className={`${mobile ? 'w-9 h-9' : 'w-8 h-8'} rounded-full object-cover flex-shrink-0`} />
        : <div className={`${mobile ? 'w-9 h-9' : 'w-8 h-8'} rounded-full bg-purple-300 flex items-center justify-center text-purple-900 font-bold flex-shrink-0`}>{name.slice(0, 1)}</div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{name}</p>
        <p className="text-purple-200 text-xs">লাইভ চ্যাট</p>
      </div>
      {!mobile && (
        <button onClick={() => setMinimized(m => !m)} className="w-7 h-7 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-600">
          {minimized
            ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M5 15l7-7 7 7"/></svg>
            : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M19 9l-7 7-7-7"/></svg>
          }
        </button>
      )}
      <button onClick={onClose} className={`${mobile ? 'w-8 h-8' : 'w-7 h-7'} rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-600 flex-shrink-0`}>
        <svg className={mobile ? 'w-5 h-5' : 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col bg-white">
        <Header mobile />
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatWindow conversation={conversation} otherName={name} hideHeader />
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-[200] flex flex-col w-[360px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 transition-all duration-200 ${minimized ? 'h-[52px]' : 'h-[520px]'}`}>
      <Header mobile={false} />
      {!minimized && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatWindow conversation={conversation} otherName={name} hideHeader />
        </div>
      )}
    </div>
  )
}
