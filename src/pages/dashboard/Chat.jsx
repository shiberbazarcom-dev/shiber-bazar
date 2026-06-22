import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useConversations, useRealtimeConversations, syncMessages } from '../../hooks/useChat'
import ConversationList from '../../components/chat/ConversationList'
import ChatWindow from '../../components/chat/ChatWindow'

const OWNER_ROLES = ['shop_owner', 'market_manager', 'super_admin']

export default function Chat() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [showList, setShowList] = useState(true)
  const lastMsgAtRef = useRef({}) // track last_message_at per conversation to detect new messages

  const { data: conversations = [] } = useConversations()
  useRealtimeConversations()

  // Sync selected conversation whenever conversations list refreshes
  // This keeps ai_paused, last_message, unread_count etc. up to date
  useEffect(() => {
    if (conversationId) {
      setShowList(false) // always show chat panel when URL has a conversationId
      const found = conversations.find(c => c.id === conversationId)
      if (found) setSelected(found)
    } else if (selected) {
      // Keep selected in sync even without URL param
      const found = conversations.find(c => c.id === selected.id)
      if (found) setSelected(found)
    }
  }, [conversationId, conversations]) // eslint-disable-line

  // --- CRITICAL SYNC FIX ---
  // Conversations realtime is reliable; messages realtime can be missed.
  // When the active conversation gets a new last_message_at, immediately sync its messages.
  // This bridges the gap between sidebar updating and chat window updating.
  useEffect(() => {
    const activeId = conversationId || selected?.id
    if (!activeId) return
    const conv = conversations.find(c => c.id === activeId)
    if (!conv?.last_message_at) return
    if (conv.last_message_at !== lastMsgAtRef.current[activeId]) {
      lastMsgAtRef.current[activeId] = conv.last_message_at
      syncMessages(qc, activeId)
    }
  }, [conversations]) // eslint-disable-line

  function handleSelect(conv) {
    setSelected(conv)
    setShowList(false)
    navigate(`/dashboard/chat/${conv.id}`, { replace: true })
  }

  function getOtherName(conv) {
    if (!conv || !user) return ''
    return conv.customer_id === user.id
      ? (conv.owner?.full_name || 'দোকানদার')
      : (conv.customer?.full_name || 'ক্রেতা')
  }

  return (
    <div className="h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-10rem)] bg-white rounded-2xl border border-gray-100 overflow-hidden flex">
      <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col flex-shrink-0 ${!showList ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">💬 বার্তাসমূহ</h2>
          <span className="text-xs text-gray-400">{conversations.length} টি কথোপকথন</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
          conversations={conversations}
          selected={selected}
          onSelect={handleSelect}
          isOwner={OWNER_ROLES.includes(user?.role)}
        />
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 ${showList ? 'hidden lg:flex' : 'flex'}`}>
        <div className="lg:hidden px-3 py-1.5 border-b border-gray-100 flex items-center">
          <button
            onClick={() => { setShowList(true); navigate('/dashboard/chat', { replace: true }) }}
            className="flex items-center gap-1.5 text-blue-600 text-sm font-medium min-h-[40px] px-2 touch-manipulation"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            ফিরে যান
          </button>
        </div>
        {conversationId && !selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-pulse">💬</div>
              <p className="text-sm">লোড হচ্ছে...</p>
            </div>
          </div>
        ) : (
          <ChatWindow conversation={selected} otherName={getOtherName(selected)} />
        )}
      </div>
    </div>
  )
}
