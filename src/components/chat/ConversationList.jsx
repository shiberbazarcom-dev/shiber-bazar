import { formatDistanceToNow } from 'date-fns'
import { bn } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

export default function ConversationList({ conversations, selected, onSelect }) {
  const { user } = useAuth()

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4">
        <div className="text-4xl mb-2">💬</div>
        <p className="text-sm text-center">এখনো কোনো কথোপকথন নেই</p>
        <p className="text-xs text-center mt-1">দোকানের পেজ থেকে বার্তা পাঠান</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-50">
      {conversations.map(conv => {
        const isCustomer = conv.customer_id === user?.id
        const otherName  = isCustomer ? (conv.owner?.full_name || 'দোকানদার') : (conv.customer?.full_name || 'ক্রেতা')
        const isActive   = selected?.id === conv.id
        const timeAgo    = conv.last_message_at
          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: bn })
          : ''
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              'w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors',
              isActive && 'bg-blue-50 border-l-2 border-blue-500'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
              {otherName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-semibold text-gray-800 truncate">{otherName}</p>
                <p className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{timeAgo}</p>
              </div>
              {conv.shops?.shop_name && <p className="text-xs text-blue-600 mb-0.5">{conv.shops.shop_name}</p>}
              {conv.last_message && <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>}
            </div>
          </button>
        )
      })}
    </div>
  )
}
