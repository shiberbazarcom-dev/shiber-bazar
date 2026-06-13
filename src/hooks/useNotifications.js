import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { playMessageSound } from '../lib/chatSound'
import toast from 'react-hot-toast'

/* ── Fetch user's notifications ── */
export function useMyNotifications() {
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

/* ── Realtime notifications — auto toast on new notification ── */
export function useRealtimeNotifications() {
  const { user } = useAuth()
  const qc = useQueryClient()

  useEffect(() => {
    if (!user) return

    const ch = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new

          // Play sound
          playMessageSound()

          // Show in-app toast based on notification type
          if (notif.type === 'order_confirmed') {
            toast.success(
              `✅ অর্ডার নিশ্চিত\n${notif.message || 'আপনার অর্ডার গ্রহণ করা হয়েছে'}`,
              { duration: 5000, position: 'bottom-right' }
            )
          } else if (notif.type === 'order_delivered') {
            toast.success(
              `🎉 অর্ডার পৌঁছেছে\n${notif.message || 'আপনার অর্ডার পৌঁছে গেছে'}`,
              { duration: 5000, position: 'bottom-right' }
            )
          } else if (notif.type === 'order_rejected') {
            toast.error(
              `❌ অর্ডার বাতিল\n${notif.message || 'আপনার অর্ডার বাতিল করা হয়েছে'}`,
              { duration: 5000, position: 'bottom-right' }
            )
          } else if (notif.type === 'new_order') {
            toast.success(
              `📦 নতুন অর্ডার\n${notif.message || 'নতুন অর্ডার এসেছে'}`,
              { duration: 5000, position: 'bottom-right' }
            )
          } else {
            // Generic notification
            toast.success(
              `${notif.title || 'নতুন বার্তা'}\n${notif.message || ''}`,
              { duration: 5000, position: 'bottom-right' }
            )
          }

          // Invalidate query to fetch new notification
          qc.invalidateQueries({ queryKey: ['notifications', user.id] })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [user?.id, qc])
}
