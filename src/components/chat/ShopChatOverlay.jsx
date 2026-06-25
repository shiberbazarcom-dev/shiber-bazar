import { useState, useEffect } from 'react'
import ChatWindow from './ChatWindow'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

/* ── Fetch conversation object by id ── */
function useConversation(id) {
  return useQuery({
    queryKey: ['conversation', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*, shop:shops(shop_name, logo_url, owner_id)')
        .eq('id', id)
        .single()
      return data
    },
  })
}

export default function ShopChatOverlay({ conversationId, shopName, shopLogo, onClose }) {
  const [minimized, setMinimized] = useState(false)
  const { data: conversation } = useConversation(conversationId)

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll on mobile when open
  useEffect(() => {
    if (window.innerWidth < 640) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const name = shopName || conversation?.shop?.shop_name || 'দোকান'

  return (
    <>
      {/* ── Desktop: floating panel (bottom-right) ── */}
      <div className={`
        hidden sm:flex flex-col
        fixed bottom-4 right-4 z-[200]
        w-[360px] rounded-2xl overflow-hidden
        shadow-2xl border border-gray-200
        transition-all duration-200
        ${minimized ? 'h-[52px]' : 'h-[520px]'}
      `}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 flex-shrink-0" style={{ background: '#7c3aed' }}>
          {shopLogo
            ? <img src={shopLogo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            : <div className="w-8 h-8 rounded-full bg-purple-300 flex items-center justify-center text-purple-900 text-sm font-bold flex-shrink-0">
                {name.slice(0, 1)}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">{name}</p>
            <p className="text-purple-200 text-[11px]">লাইভ চ্যাট</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(m => !m)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-600 transition-colors"
              aria-label={minimized ? 'বড় করুন' : 'ছোট করুন'}
            >
              {minimized
                ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M5 15l7-7 7 7"/></svg>
                : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M19 9l-7 7-7-7"/></svg>
              }
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-600 transition-colors"
              aria-label="বন্ধ করুন"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Chat body */}
        {!minimized && (
          <div className="flex-1 bg-white overflow-hidden">
            {conversation
              ? <ChatWindow conversation={conversation} otherName={name} />
              : <div className="flex items-center justify-center h-full text-gray-400 text-sm">লোড হচ্ছে...</div>
            }
          </div>
        )}
      </div>

      {/* ── Mobile: full-screen slide-up ── */}
      <div className="sm:hidden fixed inset-0 z-[200] flex flex-col" style={{ background: 'white' }}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3 py-3 flex-shrink-0 safe-top" style={{ background: '#7c3aed' }}>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-600 transition-colors flex-shrink-0"
            aria-label="ফিরে যান"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          {shopLogo
            ? <img src={shopLogo} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            : <div className="w-9 h-9 rounded-full bg-purple-300 flex items-center justify-center text-purple-900 font-bold flex-shrink-0">
                {name.slice(0, 1)}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{name}</p>
            <p className="text-purple-200 text-xs">লাইভ চ্যাট</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-600 transition-colors flex-shrink-0"
            aria-label="বন্ধ করুন"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Chat body — fills remaining screen */}
        <div className="flex-1 overflow-hidden bg-white">
          {conversation
            ? <ChatWindow conversation={conversation} otherName={name} />
            : <div className="flex items-center justify-center h-full text-gray-400 text-sm">লোড হচ্ছে...</div>
          }
        </div>
      </div>
    </>
  )
}
