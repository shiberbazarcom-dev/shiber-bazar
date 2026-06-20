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
  })
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
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/* ── Start or get existing conversation with a shop ── */
export function useStartConversation() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shopId, ownerId }) => {
      if (!user) throw new Error('Login করুন')
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_id', user.id)
        .eq('shop_id', shopId)
        .maybeSingle()
      if (existing) return existing
      const { data, error } = await supabase
        .from('conversations')
        .insert({ customer_id: user.id, shop_id: shopId, owner_id: ownerId })
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
  useEffect(() => {
    if (!conversationId) return
    const ch = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['messages', conversationId] })
          qc.invalidateQueries({ queryKey: ['conversations'] })
          qc.invalidateQueries({ queryKey: ['unread-message-count'] })

          // Only react to OTHER person's messages, not my own
          if (payload.new?.sender_id !== user?.id) {
            playMessageSound()
            // In-app toast notification (auto, no permission needed)
            showChatNotification(
              senderName || 'নতুন বার্তা',
              payload.new?.content,
              conversationId,
            )
            // Browser notification (only if user enabled it)
            showBrowserNotification(
              senderName || 'নতুন বার্তা',
              payload.new?.content,
              conversationId,
            )
          }
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [conversationId, senderName, qc, user?.id])
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
          qc.invalidateQueries({ queryKey: ['conversations'] })
          qc.invalidateQueries({ queryKey: ['unread-message-count', user.id] })
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
        (payload) => {
          if (payload.new?.sender_id === user.id) return
          qc.invalidateQueries({ queryKey: ['conversations'] })
          qc.invalidateQueries({ queryKey: ['unread-message-count', user.id] })
          qc.invalidateQueries({ queryKey: ['messages', payload.new?.conversation_id] })
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id, qc]) // eslint-disable-line
}
