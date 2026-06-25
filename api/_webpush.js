import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:admin@shiberbazar.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

/**
 * Send encrypted push notification to a user's all registered devices.
 * payload: { title, body, url, tag }
 */
export async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const payloadStr = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payloadStr,
      ).catch(err => {
        // 410 Gone = subscription expired — remove it
        if (err.statusCode === 410) {
          supabase.from('push_subscriptions').delete()
            .eq('endpoint', sub.endpoint).catch(() => null)
        }
      })
    )
  )
}
