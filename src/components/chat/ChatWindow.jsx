import { useState, useEffect, useRef } from 'react'
import { format, formatDistance } from 'date-fns'
import { bn } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useMessages, useSendMessage, useRealtimeMessages, useMarkMessagesRead, useOtherUserPresence, syncMessages } from '../../hooks/useChat'
import { supabase } from '../../lib/supabase'

function OrderCard({ orderNumber, messageContent }) {
  const lines = (messageContent || '').split('\n')
  const get = (prefix) => {
    const line = lines.find(l => l.startsWith(prefix))
    return line ? line.slice(prefix.length).trim() : ''
  }
  const product  = get('পণ্য: ')
  const total    = get('মোট মূল্য: ')
  const name     = get('নাম: ')
  const phone    = get('ফোন: ')
  const address  = get('ঠিকানা: ')

  return (
    <div className="mt-3 rounded-2xl border border-green-200 bg-white overflow-hidden shadow-md w-full max-w-xs">
      {/* Card header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-base font-bold flex-shrink-0">✓</div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">অর্ডার নিশ্চিত হয়েছে</p>
          <p className="text-green-100 text-[11px] font-mono mt-0.5">{orderNumber}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-2">
        {product && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-400 text-xs flex-shrink-0">পণ্য</span>
            <span className="text-gray-800 text-xs font-medium text-right">{product}</span>
          </div>
        )}
        {total && (
          <div className="flex justify-between gap-2 pt-2 border-t border-gray-100">
            <span className="text-gray-400 text-xs flex-shrink-0">মোট মূল্য</span>
            <span className="text-green-700 text-xs font-bold">{total}</span>
          </div>
        )}
        {(name || phone || address) && (
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            {name    && <div className="flex justify-between gap-2"><span className="text-gray-400 text-xs flex-shrink-0">নাম</span><span className="text-gray-700 text-xs text-right">{name}</span></div>}
            {phone   && <div className="flex justify-between gap-2"><span className="text-gray-400 text-xs flex-shrink-0">ফোন</span><span className="text-gray-700 text-xs font-mono">{phone}</span></div>}
            {address && <div className="flex justify-between gap-2"><span className="text-gray-400 text-xs flex-shrink-0">ঠিকানা</span><span className="text-gray-700 text-xs text-right max-w-[65%]">{address}</span></div>}
          </div>
        )}
        <div className="flex justify-between gap-2 pt-2 border-t border-gray-100">
          <span className="text-gray-400 text-xs flex-shrink-0">স্ট্যাটাস</span>
          <span className="text-amber-600 text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded-full">Pending ⏳</span>
        </div>
      </div>

      {/* Track link footer */}
      <Link to={`/track-order?order=${orderNumber}`}
        className="flex items-center justify-center gap-1.5 py-2.5 bg-green-50 border-t border-green-100 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors">
        অর্ডার ট্র্যাক করুন →
      </Link>
    </div>
  )
}

async function callAiAutoReply(conversationId) {
  try {
    await supabase.functions.invoke('ai-auto-reply', { body: { conversation_id: conversationId } })
  } catch (_) {}
}

/* ── Canned responses for shop owners ── */
const CANNED = [
  'জী ভাই, কী সাহায্য করতে পারি?',
  'ধন্যবাদ আপনার অর্ডারের জন্য। শীঘ্রই ডেলিভারি দেওয়া হবে।',
  'আপনার অর্ডারটি গ্রহণ করা হয়েছে।',
  'দুঃখিত, এই পণ্যটি এই মুহূর্তে স্টকে নেই।',
  'ডেলিভারি সাধারণত ১-৩ কার্যদিবসের মধ্যে হয়।',
  'পেমেন্ট: নগদ অন ডেলিভারি / বিকাশ / নগদ গ্রহণযোগ্য।',
  'আপনার এলাকায় ডেলিভারি চার্জ ৬০-১০০ টাকা।',
  'পণ্যে কোনো সমস্যা হলে ৩ দিনের মধ্যে জানান, বদলে দেওয়া হবে।',
  'আজকের মধ্যে অর্ডার করলে কালকের মধ্যে পাঠানো হবে।',
  'আপনার নাম, মোবাইল নম্বর এবং ঠিকানা দিন।',
]

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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy} title="কপি করুন"
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0">
      {copied
        ? <svg viewBox="0 0 24 24" className="w-3 h-3 fill-green-500"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        : <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
      }
    </button>
  )
}

function MessageGroup({ group, isOwn, senderName, senderInitial, shopLogo, isOwnerHuman, onQuickReply }) {
  const isAiGroup = !isOwn && group.some(m => m.is_ai)
  // isOwnerHuman = messages from owner but NOT AI (real human reply after handoff)
  const isHumanOwner = !isOwn && !isAiGroup && isOwnerHuman
  const lastMsg = group[group.length - 1]
  const quickReplies = !isOwn ? (lastMsg?.quick_replies || null) : null

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2 mb-3 animate-fadeIn`}>
      {!isOwn && (
        isAiGroup && shopLogo
          ? <img src={shopLogo} alt="shop" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-auto border border-purple-200" />
          : <div className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-auto ${
              isHumanOwner ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : isAiGroup ? 'bg-gradient-to-br from-purple-500 to-violet-600'
              : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }`}>
              {isHumanOwner ? '👤' : isAiGroup ? '🏪' : senderInitial}
            </div>
      )}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-0.5 max-w-[75%]`}>
        {!isOwn && (
          <p className="text-xs text-gray-500 px-3 flex items-center gap-1">
            {isHumanOwner ? 'দোকানদার' : senderName}
            {isAiGroup && <span className="text-[10px] bg-purple-100 text-purple-600 font-semibold px-1.5 py-0.5 rounded-full">AI</span>}
            {isHumanOwner && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">দোকানদার</span>}
          </p>
        )}
        <div className="flex flex-col gap-0.5">
          {group.map((msg, idx) => {
            const orderMatch = msg.is_ai ? msg.content.match(/\b(SB\d+)\b/) : null
            const orderNumber = orderMatch?.[1] || null
            // For confirmed orders: show only the first line as text, card shows the rest
            // For other messages with SB reference: show full text
            const isConfirmation = orderNumber && msg.content.includes('✅ অর্ডার সফলভাবে')
            const displayText = isConfirmation
              ? msg.content.split('\n')[0].trim()
              : msg.content
            return (
              <div key={msg.id} className={`group flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`max-w-[280px] sm:max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isOwn
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : msg.is_ai
                      ? 'bg-purple-50 border border-purple-200 text-gray-800 rounded-bl-sm shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                }`}>
                  <p className="break-words whitespace-pre-wrap">{displayText}</p>
                  {orderNumber && <OrderCard orderNumber={orderNumber} messageContent={msg.content} />}
                </div>
                <CopyButton text={msg.content} />
                {idx === group.length - 1 && isOwn && msg.is_read && (
                  <span className="text-xs text-green-600 font-bold">✓✓</span>
                )}
              </div>
            )
          })}
        </div>
        <p className={`text-xs mt-1 px-3 ${isOwn ? 'text-gray-400' : 'text-gray-500'}`}>
          {format(new Date(lastMsg.created_at), 'h:mm a')}
        </p>

        {/* Quick Reply Buttons */}
        {quickReplies?.length > 0 && onQuickReply && (
          <div className="flex flex-wrap gap-1.5 mt-1 px-1">
            {quickReplies.map((qr, i) => (
              <button key={i} onClick={() => onQuickReply(qr)}
                className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium">
                {qr}
              </button>
            ))}
          </div>
        )}
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
  const [aiTyping, setAiTyping] = useState(false)
  const [showAiSettings, setShowAiSettings] = useState(false)
  const [aiPersona, setAiPersona] = useState('')
  const [savingPersona, setSavingPersona] = useState(false)
  const [showCanned, setShowCanned] = useState(false)
  const [aiPaused, setAiPaused] = useState(false)
  const [popularProducts, setPopularProducts] = useState([])
  const bottomRef      = useRef(null)
  const inputRef       = useRef(null)
  const typingTimerRef = useRef(null)
  const channelRef     = useRef(null)

  const otherUserId = conversation
    ? (conversation.customer_id === user?.id ? conversation.owner_id : conversation.customer_id)
    : null

  const qc = useQueryClient()
  const { data: messages = [] } = useMessages(conversation?.id)
  const sendMsg  = useSendMessage()
  const markRead = useMarkMessagesRead(conversation?.id)

  useRealtimeMessages(conversation?.id, otherName)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, otherTyping, aiTyping])
  useEffect(() => { if (conversation?.id) markRead.mutate() }, [conversation?.id]) // eslint-disable-line

  /* ── Load shop settings + conversation ai_paused state ── */
  useEffect(() => {
    if (!conversation?.shop_id) return
    supabase.from('shops').select('auto_reply_enabled, ai_persona').eq('id', conversation.shop_id).single()
      .then(({ data }) => {
        if (data) { setAutoReply(!!data.auto_reply_enabled); setAiPersona(data.ai_persona || '') }
      })
    setAiPaused(!!conversation.ai_paused)
  }, [conversation?.shop_id, conversation?.ai_paused])

  /* ── Fetch popular products for welcome screen ── */
  useEffect(() => {
    if (!conversation?.shop_id) return
    supabase.from('products')
      .select('name, price')
      .eq('shop_id', conversation.shop_id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setPopularProducts(data || []))
  }, [conversation?.shop_id])

  async function saveAiPersona() {
    if (!conversation?.shop_id) return
    setSavingPersona(true)
    await supabase.from('shops').update({ ai_persona: aiPersona }).eq('id', conversation.shop_id)
    setSavingPersona(false)
    setShowAiSettings(false)
  }

  async function toggleAutoReply() {
    if (!conversation?.shop_id || togglingAR) return
    setTogglingAR(true)
    const aiIsOn = autoReply && !aiPaused

    if (aiIsOn) {
      // Turn off — pause this conversation only
      await supabase.from('conversations')
        .update({ ai_paused: true })
        .eq('id', conversation.id)
      setAiPaused(true)
    } else {
      // Turn on — resume this conversation + ensure shop-level is enabled
      await supabase.from('conversations')
        .update({ ai_paused: false })
        .eq('id', conversation.id)
      setAiPaused(false)
      if (!autoReply) {
        await supabase.from('shops')
          .update({ auto_reply_enabled: true })
          .eq('id', conversation.shop_id)
        setAutoReply(true)
      }
    }
    setTogglingAR(false)
  }

  /* ── Typing indicator ── */
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

  async function sendContent(content) {
    if (!content || !conversation?.id) return
    setText('')
    if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.focus() }
    setShowCanned(false)
    await sendMsg.mutateAsync({ conversationId: conversation.id, content })
    if (!isOwner && autoReply) {
      setAiTyping(true)
      await callAiAutoReply(conversation.id)
      setAiTyping(false)
      // Sync after AI reply — realtime + polling also handle this, but explicit sync is faster
      syncMessages(qc, conversation.id)
    }
  }

  async function handleSend(e) {
    e?.preventDefault()
    await sendContent(text.trim())
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
        {isOwner && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={toggleAutoReply} disabled={togglingAR}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all disabled:opacity-60"
              style={
                autoReply && !aiPaused
                  ? { background:'#ede9fe', color:'#6d28d9', borderColor:'#c4b5fd' }
                  : { background:'#f3f4f6', color:'#9ca3af', borderColor:'#e5e7eb' }
              }>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${autoReply && !aiPaused ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`} />
              {togglingAR ? '...' : autoReply && !aiPaused ? 'AI চালু' : 'AI বন্ধ'}
            </button>
            {autoReply && !aiPaused && (
              <button onClick={() => setShowAiSettings(s => !s)} title="AI সেটিং"
                className="w-7 h-7 rounded-full border border-purple-200 bg-purple-50 text-purple-600 flex items-center justify-center text-xs hover:bg-purple-100 transition-colors">
                ⚙️
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Persona Settings */}
      {isOwner && showAiSettings && (
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex-shrink-0">
          <p className="text-xs font-semibold text-purple-700 mb-1.5">✨ AI-এর জন্য বিশেষ নির্দেশনা</p>
          <textarea value={aiPersona} onChange={e => setAiPersona(e.target.value)} rows={3}
            placeholder="যেমন: ডেলিভারি ৩-৫ দিন। নগদ পেমেন্ট গ্রহণযোগ্য।"
            className="w-full text-xs rounded-lg border border-purple-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => setShowAiSettings(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600">বাতিল</button>
            <button onClick={saveAiPersona} disabled={savingPersona} className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-60">
              {savingPersona ? 'সংরক্ষণ...' : '💾 সংরক্ষণ'}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 bg-gray-50">
        {/* Welcome screen — shown to customer on empty conversation */}
        {!isOwner && grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-2">
            <div className="w-full max-w-xs bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                স্বাগতম 😊
              </p>
              <p className="text-xs text-gray-500 mb-3">
                আপনি <span className="font-semibold text-blue-600">{conversation?.shops?.shop_name || otherName}</span>-এ এসেছেন।
              </p>
              {popularProducts.length > 0 ? (
                <>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">জনপ্রিয় পণ্য</p>
                  <div className="flex flex-col gap-1.5 mb-3">
                    {popularProducts.slice(0, 3).map((p, i) => (
                      <button key={i}
                        onClick={() => sendContent(`${p.name} সম্পর্কে জানতে চাই`)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 transition-colors text-left">
                        <span className="text-xs text-gray-700 font-medium">{p.name}</span>
                        <span className="text-xs text-blue-600 font-bold flex-shrink-0 ml-2">৳{p.price}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 mb-3">আপনি কোন পণ্য খুঁজছেন বলুন, আমি সাহায্য করব।</p>
              )}
              <p className="text-xs text-gray-500">আজকে কী খুঁজছেন?</p>
            </div>

            {/* Quick action chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: 'সব পণ্য দেখুন', msg: 'আপনাদের সব পণ্য দেখাবেন?' },
                { label: 'জনপ্রিয় পণ্য', msg: 'সবচেয়ে জনপ্রিয় পণ্যগুলো কী?' },
                { label: 'অর্ডার করতে চাই', msg: 'অর্ডার করতে চাই' },
                { label: 'দাম জানতে চাই', msg: 'পণ্যের দাম জানতে চাই' },
              ].map((chip, i) => (
                <button key={i} onClick={() => sendContent(chip.msg)}
                  className="text-xs px-4 py-2 rounded-full border border-blue-200 bg-white text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-medium shadow-sm">
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Owner empty state */}
        {isOwner && grouped.length === 0 && (
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
                shopLogo={conversation?.shops?.logo}
                isOwnerHuman={
                  item.senderId === conversation?.owner_id &&
                  !item.group.some(m => m.is_ai)
                }
                onQuickReply={!isOwner ? (qr) => sendContent(qr) : null}
              />
            )
          )}
        </div>

        {/* Returning customer quick chips — shown at bottom of messages */}
        {!isOwner && grouped.length > 0 && !aiPaused && (
          <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
            {['সব পণ্য দেখুন', 'অর্ডার করতে চাই', 'দাম জানতে চাই'].map((chip, i) => (
              <button key={i} onClick={() => sendContent(chip)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors">
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Human typing indicator */}
        {otherTyping && !aiTyping && (
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

        {/* AI typing indicator */}
        {aiTyping && (
          <div className="flex justify-start gap-2 mb-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">✨</div>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-purple-500 ml-1">AI উত্তর দিচ্ছে...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Canned responses panel (owner only) */}
      {isOwner && showCanned && (
        <div className="px-3 py-2 bg-white border-t border-gray-100 flex-shrink-0 max-h-40 overflow-y-auto">
          <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">দ্রুত উত্তর</p>
          <div className="flex flex-col gap-1">
            {CANNED.map((c, i) => (
              <button key={i} type="button" onClick={() => sendContent(c)}
                className="text-left text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors">
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="px-3 sm:px-4 py-3 bg-white border-t border-gray-100 flex gap-2 items-end flex-shrink-0">
        {/* Canned responses button (owner only) */}
        {isOwner && (
          <button type="button" onClick={() => setShowCanned(s => !s)}
            title="দ্রুত উত্তর"
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors border ${
              showCanned ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
            }`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
          </button>
        )}

        <textarea
          ref={inputRef}
          value={text}
          rows={1}
          onChange={e => {
            setText(e.target.value)
            broadcastTyping()
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (text.trim()) handleSend(e)
            }
          }}
          placeholder={isOwner ? 'বার্তা লিখুন... (Shift+Enter নতুন লাইন)' : 'বার্তা লিখুন...'}
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors min-w-0 resize-none overflow-hidden"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button type="submit" disabled={!text.trim() || sendMsg.isPending}
          className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0">
          {sendMsg.isPending
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
          }
        </button>
      </form>
    </div>
  )
}
