import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { playMessageSound, showChatNotification, showBrowserNotification } from '../lib/chatSound'

/* ── Update current user's last_seen (call on mount + interval) ── */
export function useUpdateLastSeen() {
  const { user } = useAuth()
  useEffect(() => {
    if (!user) return
    const update = () =>
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
    update()
    const iv = setInterval(update, 30000) // every 30s
    const onVisible = () => { if (!document.hidden) update() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVisible) }
  }, [user])
}

/* ── Fetch other user's last_seen with realtime ── */
export function useOtherUserPresence(userId) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['presence', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data } = await supabase
        .from('profiles')
        .select('last_seen')
        .eq('id', userId)
        .single()
      return data?.last_seen || null
    },
    enabled: !!userId,
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (!userId) return
    const ch = supabase
      .channel(`presence-${userId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ['presence', userId] }))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [userId, qc])

  return data || null
}

/* ── All conversations for current user (with unread count) ── */
export function useConversations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          customer:customer_id ( id, full_name ),
          owner:owner_id       ( id, full_name ),
          shops                ( id, shop_name, logo )
        `)
        .or(`customer_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })
      if (error) throw error
      const convs = data || []
      if (!convs.length) return convs

      // Fetch unread counts in one query
      const { data: unread } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convs.map(c => c.id))
        .neq('sender_id', user.id)
        .eq('is_read', false)

      const unreadMap = {}
      unread?.forEach(m => { unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1 })
      return convs.map(c => ({ ...c, unread_count: unreadMap[c.id] || 0 }))
    },
    enabled: !!user,
    staleTime: 0,  // conversations sidebar must always be fresh
  })
}

/* ── Messages in one conversation ── */
export function useMessages(conversationId) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id ( id, full_name ), quick_replies')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) throw error
      return data || []
    },
    enabled: !!conversationId && !!user,
    staleTime: 0,
    gcTime: 1000 * 60,
    // Polling fallback: if realtime misses an event, polling catches it within 2s
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
  })
}

/* ── Fetch messages directly and update cache ── */
export async function syncMessages(qc, conversationId) {
  const { data } = await supabase
    .from('messages')
    .select('*, sender:sender_id ( id, full_name ), quick_replies')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)
  if (data) qc.setQueryData(['messages', conversationId], data)
}

/* ── Send a message ── */
export function useSendMessage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ conversationId, content }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, content })
        .select()
        .single()
      if (error) throw error
      await supabase
        .from('conversations')
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq('id', conversationId)
      return data
    },
    // Step 1: show message INSTANTLY before network response
    onMutate: async ({ conversationId, content }) => {
      await qc.cancelQueries({ queryKey: ['messages', conversationId] })
      const prev = qc.getQueryData(['messages', conversationId]) || []
      const tempId = `temp-${Date.now()}`
      const tempMsg = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        created_at: new Date().toISOString(),
        is_read: false,
        is_ai: false,
        sender: { id: user.id, full_name: user.user_metadata?.full_name || '' },
        quick_replies: null,
        _temp: true,
      }
      qc.setQueryData(['messages', conversationId], [...prev, tempMsg])
      return { prev, tempId }
    },
    // Step 2: replace temp message with real DB message + sync
    onSuccess: async (newMsg, { conversationId }, ctx) => {
      qc.setQueryData(['messages', conversationId], (old = []) =>
        old.map(m => m.id === ctx?.tempId ? { ...newMsg, sender: m.sender } : m)
      )
      // Background sync to get full sender join & any AI messages
      syncMessages(qc, conversationId)
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    // Step 3: rollback on error
    onError: (_err, { conversationId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['messages', conversationId], ctx.prev)
    },
  })
}

/* ── Start or get existing conversation with a shop ── */
export function useStartConversation() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shopId }) => {
      if (!user) throw new Error('Login করুন')

      // ── Resolve owner from DB — never trust client-supplied ownerId ───────
      const { data: shop, error: shopErr } = await supabase
        .from('shops')
        .select('id, owner_id')
        .eq('id', shopId)
        .single()
      if (shopErr || !shop) throw new Error('দোকানটি পাওয়া যায়নি')
      const resolvedOwnerId = shop.owner_id
      // ── End owner resolution ──────────────────────────────────────────────

      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_id', user.id)
        .eq('shop_id', shopId)
        .maybeSingle()
      if (existing) return existing
      const { data, error } = await supabase
        .from('conversations')
        .insert({ customer_id: user.id, shop_id: shopId, owner_id: resolvedOwnerId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

/* ── Mark messages as read ── */
export function useMarkMessagesRead(conversationId) {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!conversationId || !user) return
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unread-message-count'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/* ── Unread message count ── */
export function useUnreadMessageCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['unread-message-count', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`customer_id.eq.${user.id},owner_id.eq.${user.id}`)
      if (!convs?.length) return 0
      const convIds = convs.map(c => c.id)
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .neq('sender_id', user.id)
        .eq('is_read', false)
      return count || 0
    },
    enabled: !!user,
    refetchInterval: 30000,
  })
}

/* ── Realtime: new messages in a conversation ── */
export function useRealtimeMessages(conversationId, senderName = '') {
  const { user } = useAuth()
  const qc = useQueryClient()
  // Store senderName in a ref so it never causes re-subscription
  const senderNameRef = useRef(senderName)
  useEffect(() => { senderNameRef.current = senderName }, [senderName])

  useEffect(() => {
    if (!conversationId) return
    const ch = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const incoming = payload.new
          // Sync messages immediately — no staleTime gate
          await syncMessages(qc, conversationId)

          if (incoming?.sender_id !== user?.id) {
            playMessageSound()
            showChatNotification(senderNameRef.current || 'নতুন বার্তা', incoming?.content, conversationId)
            showBrowserNotification(senderNameRef.current || 'নতুন বার্তা', incoming?.content, conversationId)
          }
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
    // Only re-subscribe when conversationId or user changes — NOT senderName
  }, [conversationId, user?.id, qc])
}

/* ── Realtime: conversation list updates (used in Chat page) ── */
export function useRealtimeConversations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`conversations-user-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          // refetchQueries = immediate fetch (not background like invalidateQueries)
          qc.refetchQueries({ queryKey: ['conversations', user.id] })
          qc.invalidateQueries({ queryKey: ['unread-message-count', user.id] })
          // Invalidate all active messages queries as a safety net:
          // conversations table updates reliably; messages realtime can be delayed.
          qc.invalidateQueries({ queryKey: ['messages'] })
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id, qc]) // eslint-disable-line
}

/* ── Realtime: global new message listener (used in DashboardLayout only) ── */
export function useGlobalMessageListener() {
  const { user } = useAuth()
  const qc = useQueryClient()
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`global-messages-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const convId = payload.new?.conversation_id
          // Always refresh conversations sidebar (unread counts etc.)
          qc.refetchQueries({ queryKey: ['conversations', user.id] })
          qc.invalidateQueries({ queryKey: ['unread-message-count', user.id] })
          // Sync message list for the affected conversation
          // (handles cases where useRealtimeMessages filtered subscription misses it)
          if (convId) await syncMessages(qc, convId)
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id, qc]) // eslint-disable-line
}
