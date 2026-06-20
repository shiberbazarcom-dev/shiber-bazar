import { useState, useEffect, useRef } from 'react'
import { format, formatDistance } from 'date-fns'
import { bn } from 'date-fns/locale'
import { useAuth } from '../../context/AuthContext'
import { useMessages, useSendMessage, useRealtimeMessages, useMarkMessagesRead, useOtherUserPresence } from '../../hooks/useChat'
import { supabase } from '../../lib/supabase'

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
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-0.5 max-w-[75%]`}>
        {!isOwn && <p className="text-xs text-gray-500 px-3">{senderName}</p>}
        <div className="flex flex-col gap-0.5">
          {group.map((msg, idx) => (
            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`max-w-[280px] sm:max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
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
  const [otherTyping, setOtherTyping] = useState(false)
  const [autoReply, setAutoReply] = useState(false)
  const [togglingAR, setTogglingAR] = useState(false)
  const bottomRef      = useRef(null)
  const inputRef       = useRef(null)
  const typingTimerRef = useRef(null)
  const channelRef     = useRef(null)

  const otherUserId = conversation
    ? (conversation.customer_id === user?.id ? conversation.owner_id : conversation.customer_id)
    : null

  const { data: messages = [] } = useMessages(conversation?.id)
  const sendMsg  = useSendMessage()
  const markRead = useMarkMessagesRead(conversation?.id)

  useRealtimeMessages(conversation?.id, otherName)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length, otherTyping])
  useEffect(() => { if (conversation?.id) markRead.mutate() }, [conversation?.id]) // eslint-disable-line

  /* ── Load auto_reply_enabled from shop ── */
  useEffect(() => {
    if (!isOwner || !conversation?.shop_id) return
    supabase
      .from('shops')
      .select('auto_reply_enabled')
      .eq('id', conversation.shop_id)
      .single()
      .then(({ data }) => { if (data) setAutoReply(!!data.auto_reply_enabled) })
  }, [isOwner, conversation?.shop_id])

  /* ── Toggle auto-reply (saves to DB) ── */
  async function toggleAutoReply() {
    if (!conversation?.shop_id || togglingAR) return
    const next = !autoReply
    setTogglingAR(true)
    const { error } = await supabase
      .from('shops')
      .update({ auto_reply_enabled: next })
      .eq('id', conversation.shop_id)
    if (!error) setAutoReply(next)
    setTogglingAR(false)
  }

  /* ── Typing indicator via Supabase broadcast ── */
  useEffect(() => {
    if (!conversation?.id || !user?.id) return
    const ch = supabase.channel(`typing:${conversation.id}`)
    channelRef.current = ch
    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.user_id === user.id) return
      setOtherTyping(true)
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => setOtherTyping(false), 3000)
    }).subscribe()
    return () => { clearTimeout(typingTimerRef.current); supabase.removeChannel(ch) }
  }, [conversation?.id, user?.id])

  function broadcastTyping() {
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: user?.id } })
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
          <p className="font-semibold text-gray-800 text-sm truncate">{otherName}</p>
          <PresenceStatus userId={otherUserId} />
        </div>

        {/* Auto-reply toggle — shop owner only */}
        {isOwner && (
          <button
            onClick={toggleAutoReply}
            disabled={togglingAR}
            title={autoReply ? 'AI auto-reply চালু আছে — বন্ধ করতে ক্লিক করুন' : 'AI auto-reply চালু করুন'}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex-shrink-0 disabled:opacity-60"
            style={autoReply
              ? { background: '#ede9fe', color: '#6d28d9', borderColor: '#c4b5fd' }
              : { background: '#f3f4f6', color: '#9ca3af', borderColor: '#e5e7eb' }}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${autoReply ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`} />
            {togglingAR ? '...' : autoReply ? 'AI চালু' : 'AI বন্ধ'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 bg-gray-50">
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

        {/* Typing indicator */}
        {otherTyping && (
          <div className="flex justify-start gap-2 mb-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {(otherName || '?')[0].toUpperCase()}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-3 sm:px-4 py-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={text}
          onChange={e => { setText(e.target.value); broadcastTyping() }}
          placeholder="বার্তা লিখুন..."
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors min-w-0"
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
