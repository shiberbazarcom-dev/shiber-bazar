import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { bn } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext'
import { useMessages, useSendMessage, useRealtimeMessages, useMarkMessagesRead } from '../../hooks/useChat'

function MessageBubble({ msg, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
      }`}>
        <p className="break-words">{msg.content}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'} text-right`}>
          {format(new Date(msg.created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  )
}

export default function ChatWindow({ conversation, otherName }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const { data: messages = [] } = useMessages(conversation?.id)
  const sendMsg  = useSendMessage()
  const markRead = useMarkMessagesRead(conversation?.id)

  useRealtimeMessages(conversation?.id, otherName)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])
  useEffect(() => { if (conversation?.id) markRead.mutate() }, [conversation?.id]) // eslint-disable-line

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !conversation?.id) return
    const content = text.trim()
    setText('')
    inputRef.current?.focus()
    await sendMsg.mutateAsync({ conversationId: conversation.id, content })
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-sm">একটি কথোপকথন নির্বাচন করুন</p>
        </div>
      </div>
    )
  }

  const grouped = []
  let lastDate = null
  messages.forEach(msg => {
    const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd')
    if (dateKey !== lastDate) {
      grouped.push({ type: 'date', key: dateKey, label: format(new Date(msg.created_at), 'd MMMM yyyy', { locale: bn }) })
      lastDate = dateKey
    }
    grouped.push({ type: 'msg', ...msg })
  })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
          {otherName?.[0] || '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{otherName}</p>
          <p className="text-xs text-gray-400">{conversation.shops?.shop_name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 space-y-0.5">
        {grouped.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">কথোপকথন শুরু করুন!</div>
        )}
        {grouped.map(item =>
          item.type === 'date' ? (
            <div key={item.key} className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 px-2">{item.label}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          ) : (
            <MessageBubble key={item.id} msg={item} isOwn={item.sender_id === user?.id} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="বার্তা লিখুন..."
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMsg.isPending}
          className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {sendMsg.isPending
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
          }
        </button>
      </form>
    </div>
  )
}
