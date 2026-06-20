import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useConversations, useRealtimeConversations } from '../../hooks/useChat'
import ConversationList from '../../components/chat/ConversationList'
import ChatWindow from '../../components/chat/ChatWindow'

const OWNER_ROLES = ['shop_owner', 'market_manager', 'super_admin']

export default function Chat() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [showList, setShowList] = useState(true)

  const { data: conversations = [] } = useConversations()
  useRealtimeConversations()

  // Sync selected conversation whenever conversations list refreshes
  // This keeps ai_paused, last_message, unread_count etc. up to date
  useEffect(() => {
    if (!conversations.length) return
    if (conversationId) {
      const found = conversations.find(c => c.id === conversationId)
      if (found) { setSelected(found); setShowList(false) }
    } else if (selected) {
      // Keep selected in sync even without URL param
      const found = conversations.find(c => c.id === selected.id)
      if (found) setSelected(found)
    }
  }, [conversationId, conversations]) // eslint-disable-line

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
    <div className="h-[calc(100dvh-10rem)] bg-white rounded-2xl border border-gray-100 overflow-hidden flex">
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
        <div className="lg:hidden px-4 py-2 border-b border-gray-100 flex items-center">
          <button
            onClick={() => { setShowList(true); navigate('/dashboard/chat', { replace: true }) }}
            className="flex items-center gap-2 text-blue-600 text-sm font-medium"
          >← ফিরে যান</button>
        </div>
        <ChatWindow conversation={selected} otherName={getOtherName(selected)} />
      </div>
    </div>
  )
}
