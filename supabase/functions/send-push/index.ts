import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ── VAPID JWT signing (Web Push Protocol) ── */
async function buildVapidJwt(audience: string, subject: string, privateKeyB64: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject }

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // Import the VAPID private key (raw EC key, base64url encoded)
  const raw = Uint8Array.from(atob(privateKeyB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw', raw,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  )

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return `${signingInput}.${sigB64}`
}

/* ── Send a single Web Push message ── */
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
) {
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`

  const jwt = await buildVapidJwt(audience, 'mailto:admin@shiberbazar.com', vapidPrivateKey)

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
      'Content-Encoding': 'aes128gcm',
    },
    body: new TextEncoder().encode(payload),
  })

  return response
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    // Support both direct call and Supabase webhook (record is in body.record)
    const order = body.record ?? body

    if (!order || !order.id) {
      return new Response(JSON.stringify({ error: 'No order data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey)

    // Find shop owner(s) for this order
    let shopOwnerIds: string[] = []

    if (order.shop_id) {
      const { data: shop } = await supabase
        .from('shops')
        .select('owner_id')
        .eq('id', order.shop_id)
        .single()
      if (shop?.owner_id) shopOwnerIds.push(shop.owner_id)
    }

    // Also notify all admins for unassigned orders
    if (!order.shop_id || order.status === 'pending') {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['super_admin', 'market_manager'])
      if (admins) shopOwnerIds.push(...admins.map((a: { id: string }) => a.id))
    }

    // Deduplicate
    shopOwnerIds = [...new Set(shopOwnerIds)]

    if (shopOwnerIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no recipients' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch push subscriptions for these users
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', shopOwnerIds)

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const notifPayload = JSON.stringify({
      title: '🛍️ শিবের বাজার — নতুন অর্ডার!',
      body: `${order.customer_name || 'একজন গ্রাহক'} — ৳${order.total_amount ?? ''}`,
      url: order.shop_id ? '/dashboard/orders' : '/admin/orders',
    })

    // Send push to all subscriptions
    const results = await Promise.allSettled(
      subs.map(sub => sendWebPush(sub, notifPayload, vapidPublic, vapidPrivate))
    )

    const sent    = results.filter(r => r.status === 'fulfilled').length
    const failed  = results.length - sent

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
