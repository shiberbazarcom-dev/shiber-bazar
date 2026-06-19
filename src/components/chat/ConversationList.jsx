import { formatDistanceToNow } from 'date-fns'
import { bn } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

function EmptyState({ isOwner }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
      {/* Illustration */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="text-4xl">💬</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center border-2 border-white">
          <span className="text-sm">✨</span>
        </div>
      </div>

      <h3 className="font-bold text-gray-700 text-sm mb-1">
        কোনো কথোপকথন নেই
      </h3>

      {isOwner ? (
        <>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
            ক্রেতারা আপনার দোকানের পেজ থেকে বার্তা পাঠালে এখানে দেখাবে।
          </p>
          <div className="mt-4 px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">💡 টিপস</p>
            <p className="text-xs text-blue-500 mt-0.5">দোকানের লিংক শেয়ার করুন বেশি বার্তা পেতে</p>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
            কোনো দোকানের সাথে কথা বলতে দোকানের পেজে যান।
          </p>
          <Link
            to="/shops"
            className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            🏪 দোকান খুঁজুন
          </Link>
        </>
      )}
    </div>
  )
}

export default function ConversationList({ conversations, selected, onSelect, isOwner = false }) {
  const { user } = useAuth()

  if (!conversations?.length) {
    return <EmptyState isOwner={isOwner} />
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
