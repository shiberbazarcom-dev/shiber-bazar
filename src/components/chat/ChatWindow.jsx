import { useState, useEffect, useRef } from 'react'
import { format, formatDistance } from 'date-fns'
import { bn } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext'
import { useMessages, useSendMessage, useRealtimeMessages, useMarkMessagesRead, useOtherUserPresence } from '../../hooks/useChat'
import { supabase } from '../../lib/supabase'

const AUTO_REPLY_KEY = 'chat_auto_reply'

function PresenceStatus({ userId }) {
  const lastSeen = useOtherUserPresence(userId)
  if (!lastSeen) return null
  const diff = Date.now() - new Date(lastSeen).getTime()
  if (diff < 90000) return (
    <p className="text-xs text-green-500 font-medium flex items-center gap-1">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />অনলাইন
    </p>
  )
  return <p className="text-xs text-gray-400">শেষ দেখা {formatDistance(new Date(lastSeen), new Date(), { addSuffix: true, locale: bn })}</p>
}

function MessageGroup({ group, isOwn, senderName, senderInitial }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2 mb-3 animate-fadeIn`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-auto">
          {senderInitial}
        </div>
      )}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-0.5 max-w-[70%]`}>
        {!isOwn && <p className="text-xs text-gray-500 px-3">{senderName}</p>}
        <div className="flex flex-col gap-0.5">
          {group.map((msg, idx) => (
            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                isOwn ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
              }`}>
                <p className="break-words whitespace-pre-wrap">{msg.content}</p>
              </div>
              {idx === group.length - 1 && isOwn && msg.is_read && (
                <span className="text-xs text-green-600 font-bold">✓✓</span>
              )}
            </div>
          ))}
        </div>
        <p className={`text-xs mt-1 px-3 ${isOwn ? 'text-gray-400' : 'text-gray-500'}`}>
          {format(new Date(group[group.length - 1].created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  )
}

export default function ChatWindow({ conversation, otherName }) {
  const { user, isOwner } = useAuth()
  const [text, setText] = useState('')
  const [autoReply, setAutoReply] = useState(() => localStorage.getItem(AUTO_REPLY_KEY) === 'true')
  const [aiTyping, setAiTyping] = useState(false)
  const [shopProducts, setShopProducts] = useState([])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const lastMsgIdRef = useRef(null)
  const replyingRef  = useRef(false)

  const otherUserId = conversation
    ? (conversation.customer_id === user?.id ? conversation.owner_id : conversation.customer_id)
    : null

  const { data: messages = [] } = useMessages(conversation?.id)
  const sendMsg  = useSendMessage()
  const markRead = useMarkMessagesRead(conversation?.id)

  useRealtimeMessages(conversation?.id, otherName)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])
  useEffect(() => { if (conversation?.id) markRead.mutate() }, [conversation?.id]) // eslint-disable-line

  /* ── Load shop products for AI context ── */
  useEffect(() => {
    const shopId = conversation?.shop_id
    if (!shopId) return
    supabase
      .from('products')
      .select('name, price, unit, description')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .limit(50)
      .then(({ data }) => {
        if (data?.length) setShopProducts(data)
      })
  }, [conversation?.shop_id])

  /* ── Auto-reply: fires when new customer message arrives ── */
  useEffect(() => {
    if (!isOwner || !autoReply || !conversation?.id || messages.length === 0) return

    const last = messages[messages.length - 1]
    if (!last) return
    if (last.sender_id === user?.id) return           // own message, skip
    if (last.id === lastMsgIdRef.current) return      // already handled
    if (replyingRef.current) return                   // already replying

    lastMsgIdRef.current = last.id
    replyingRef.current  = true
    setAiTyping(true)

    fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'smart_reply',
        customerMessage: last.content,
        shopName: conversation?.shops?.shop_name || 'আমাদের দোকান',
        productList: shopProducts.length
          ? shopProducts.map(p => `${p.name}: ৳${p.price}${p.unit ? `/${p.unit}` : ''}${p.description ? ` (${p.description})` : ''}`).join(', ')
          : '',
      }),
    })
      .then(r => r.json())
      .then(data => {
        const reply = data.replies?.[0]
        if (reply) return sendMsg.mutateAsync({ conversationId: conversation.id, content: reply })
      })
      .catch(() => {})
      .finally(() => { setAiTyping(false); replyingRef.current = false })
  }, [messages]) // eslint-disable-line

  const toggleAutoReply = () => {
    const next = !autoReply
    setAutoReply(next)
    localStorage.setItem(AUTO_REPLY_KEY, String(next))
  }

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

  // Group messages by sender and date
  const grouped = []
  let lastDate = null, lastSenderId = null, currentGroup = []

  messages.forEach((msg) => {
    const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd')
    if (dateKey !== lastDate) {
      if (currentGroup.length > 0) { grouped.push({ type: 'group', group: currentGroup, senderId: lastSenderId }); currentGroup = [] }
      grouped.push({ type: 'date', key: dateKey, label: format(new Date(msg.created_at), 'd MMMM yyyy', { locale: bn }) })
      lastDate = dateKey; lastSenderId = null
    }
    if (msg.sender_id !== lastSenderId) {
      if (currentGroup.length > 0) grouped.push({ type: 'group', group: currentGroup, senderId: lastSenderId })
      currentGroup = [msg]; lastSenderId = msg.sender_id
    } else {
      currentGroup.push(msg)
    }
  })
  if (currentGroup.length > 0) grouped.push({ type: 'group', group: currentGroup, senderId: lastSenderId })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
          {otherName?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{otherName}</p>
          <PresenceStatus userId={otherUserId} />
        </div>

        {/* Auto-reply toggle — shop owner only */}
        {isOwner && (
          <button onClick={toggleAutoReply}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all"
            style={autoReply
              ? { background: '#ede9fe', color: '#6d28d9', borderColor: '#c4b5fd' }
              : { background: '#f3f4f6', color: '#9ca3af', borderColor: '#e5e7eb' }}>
            <span className={`w-2 h-2 rounded-full ${autoReply ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`} />
            AI {autoReply ? 'চালু' : 'বন্ধ'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {grouped.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">কথোপকথন শুরু করুন!</div>
        )}
        <div className="space-y-2">
          {grouped.map((item, idx) =>
            item.type === 'date' ? (
              <div key={item.key} className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-500 px-2 font-medium">{item.label}</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
            ) : (
              <MessageGroup
                key={`group-${idx}`}
                group={item.group}
                isOwn={item.senderId === user?.id}
                senderName={item.group[0].sender?.full_name || 'ব্যবহারকারী'}
                senderInitial={(item.group[0].sender?.full_name || '?')[0].toUpperCase()}
              />
            )
          )}
        </div>

        {/* AI typing indicator */}
        {aiTyping && (
          <div className="flex justify-start gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              AI
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
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
