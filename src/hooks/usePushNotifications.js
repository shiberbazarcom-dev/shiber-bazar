import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { isPushSupported, getPushPermission, subscribeToPush, unsubscribeFromPush, hasActivePushSubscription } from '../lib/pushNotifications'
import toast from 'react-hot-toast'

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState(getPushPermission())
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    hasActivePushSubscription().then(setSubscribed)
  }, [user])

  const subscribe = useCallback(async () => {
    if (!user) { toast.error('Login করুন'); return }
    if (!isPushSupported()) { toast.error('এই browser এ push notification সমর্থিত নয়'); return }
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { toast.error('Notification অনুমতি দেওয়া হয়নি'); return }
      await subscribeToPush(user.id)
      setSubscribed(true)
      toast.success('Push notification চালু হয়েছে! 🔔')
    } catch (err) {
      toast.error('Notification চালু করা যায়নি')
      console.error(err)
    } finally { setLoading(false) }
  }, [user])

  const unsubscribe = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      await unsubscribeFromPush(user.id)
      setSubscribed(false)
      toast.success('Push notification বন্ধ হয়েছে')
    } catch { toast.error('Notification বন্ধ করা যায়নি') }
    finally { setLoading(false) }
  }, [user])

  const toggle = useCallback(() => {
    if (subscribed) unsubscribe()
    else subscribe()
  }, [subscribed, subscribe, unsubscribe])

  return { permission, subscribed, loading, toggle, subscribe, unsubscribe, isSupported: isPushSupported() }
}
