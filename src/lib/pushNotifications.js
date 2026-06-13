import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export async function subscribeToPush(userId) {
  if (!isPushSupported()) throw new Error('Push not supported')
  if (!VAPID_PUBLIC_KEY)  throw new Error('VAPID key not configured')

  const registration = await navigator.serviceWorker.ready
  const existing     = await registration.pushManager.getSubscription()
  if (existing) await existing.unsubscribe()

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  const { endpoint, keys } = subscription.toJSON()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'user_id,endpoint' })
  if (error) throw error
  return subscription
}

export async function unsubscribeFromPush(userId) {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    const { endpoint } = subscription.toJSON()
    await subscription.unsubscribe()
    await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint)
  }
}

export async function hasActivePushSubscription() {
  if (!isPushSupported()) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const sub          = await registration.pushManager.getSubscription()
    return !!sub && Notification.permission === 'granted'
  } catch { return false }
}
