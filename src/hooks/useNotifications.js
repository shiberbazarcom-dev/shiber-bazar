import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

/* ── Pleasant 3-note chime (WebAudio — no sound file needed) ── */
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const notes = [523.25, 659.25, 783.99] // C5 → E5 → G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.start(t)
      osc.stop(t + 0.6)
    })
    setTimeout(() => ctx.close(), 1500)
  } catch { /* autoplay blocked আগে user interaction না হলে — নীরবে ignore */ }
}

/* ── Get user's notifications ── */
export function useNotifications() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/* ── Get unread notification count ── */
export function useUnreadNotificationCount() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      if (error) throw error
      return count || 0
    },
    enabled: !!user,
  })
}

/* ── Mark notification as read ── */
export function useMarkNotificationRead() {
  const qc = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

/* ── Mark all notifications as read ── */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

/* ── Create notification (admin/system use) ── */
export function useCreateNotification() {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, title, message, type, metadata = {} }) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          metadata,
          is_read: false,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

/* ── Delete notification ── */
export function useDeleteNotification() {
  const qc = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

/* ── Real-time notifications subscription ── */
export function useRealtimeNotifications() {
  const { user } = useAuth()
  const qc = useQueryClient()
  
  useEffect(() => {
    if (!user) return
    
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['notifications'] })
          qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })

          /* New notification → chime + toast (approve হলে celebratory) */
          if (payload.eventType === 'INSERT' && payload.new) {
            playChime()
            const n = payload.new
            const isGood = (n.type || '').includes('approved')
            toast(
              `${n.title || 'নতুন নোটিফিকেশন'}${n.message ? `\n${n.message}` : ''}`,
              {
                duration: 5000,
                icon: isGood ? '🎉' : '🔔',
                style: { background: isGood ? '#16a34a' : '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '13px' },
              }
            )
          }
        }
      )
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [user, qc])
}

/* ── Get pending shops count (for admin sidebar) ── */
export function usePendingShopsCount() {
  return useQuery({
    queryKey: ['pending-shops-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval')
      if (error) throw error
      return count || 0
    },
  })
}

/* ── Real-time pending shops count for admin ── */
export function useRealtimePendingShopsCount() {
  const qc = useQueryClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('pending-shops-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shops',
          filter: 'status=eq.pending_approval',
        },
        () => {
          qc.invalidateQueries({ queryKey: ['pending-shops-count'] })
        }
      )
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [qc])
}
