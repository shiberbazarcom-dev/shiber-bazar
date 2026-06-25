/**
 * Send push notification via Supabase Edge Function.
 * payload: { title, body, url, tag }
 */
export async function sendPushToUser(userId, payload) {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return

  await fetch(`${supabaseUrl}/functions/v1/send-push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ user_id: userId, payload }),
  }).catch(() => null)
}
