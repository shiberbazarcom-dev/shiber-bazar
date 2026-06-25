import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ── Wrap raw 32-byte EC key into PKCS8 DER ── */
function rawToPkcs8(rawKey: Uint8Array): Uint8Array {
  const prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06,
    0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01,
    0x01, 0x04, 0x20,
  ])
  const pkcs8 = new Uint8Array(prefix.length + rawKey.length)
  pkcs8.set(prefix)
  pkcs8.set(rawKey, prefix.length)
  return pkcs8
}

/* ── VAPID JWT ── */
async function buildVapidJwt(audience: string, subject: string, privateKeyB64: string): Promise<string> {
  const header  = { alg: 'ES256', typ: 'JWT' }
  const now     = Math.floor(Date.now() / 1000)
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject }

  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const signingInput = `${b64url(header)}.${b64url(payload)}`

  const raw   = Uint8Array.from(atob(privateKeyB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
  const pkcs8 = rawToPkcs8(raw)

  const key = await crypto.subtle.importKey(
    'pkcs8', pkcs8,
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

/* ── Send push to one subscription endpoint ── */
async function sendWebPush(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  payload?: object,
): Promise<Response> {
  const url      = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt      = await buildVapidJwt(audience, 'mailto:admin@shiberbazar.com', vapidPrivateKey)

  const headers: Record<string, string> = {
    'TTL': '86400',
    'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
  }

  let body: BodyInit | undefined
  if (payload) {
    body = JSON.stringify(payload)
    headers['Content-Type'] = 'application/json'
    headers['Content-Encoding'] = 'aesgcm'
  }

  return fetch(endpoint, { method: 'POST', headers, body })
}

/* ── Push to all subscriptions of given user IDs ── */
async function pushToUsers(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
  vapidPublic: string,
  vapidPrivate: string,
  payload?: object,
) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, user_id')
    .in('user_id', userIds)

  if (!subs || subs.length === 0) return { sent: 0, reason: 'no subscriptions' }

  const results = await Promise.allSettled(
    subs.map(async (sub: { endpoint: string; user_id: string }) => {
      const res = await sendWebPush(sub.endpoint, vapidPublic, vapidPrivate, payload)
      if (res.status === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
      return res.status
    })
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.length - sent
  console.log(`send-push: sent=${sent} failed=${failed}`)
  return { sent, failed }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey)

    /* ── Case 1: Direct user_id push (from Vercel auto-reply) ── */
    if (body.user_id) {
      const result = await pushToUsers(supabase, [body.user_id], vapidPublic, vapidPrivate, body.payload)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    /* ── Case 2: DB Webhook — new order ── */
    const order = body.record ?? body
    if (!order?.id) {
      return new Response(JSON.stringify({ error: 'No order data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let recipientIds: string[] = []

    if (order.shop_id) {
      const { data: shop } = await supabase
        .from('shops').select('owner_id').eq('id', order.shop_id).single()
      if (shop?.owner_id) recipientIds.push(shop.owner_id)
    }

    if (!order.shop_id || order.status === 'pending') {
      const { data: admins } = await supabase
        .from('profiles').select('id').in('role', ['super_admin', 'market_manager'])
      if (admins) recipientIds.push(...admins.map((a: { id: string }) => a.id))
    }

    recipientIds = [...new Set(recipientIds)]
    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no recipients' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const orderPayload = {
      title: `🛒 নতুন অর্ডার`,
      body:  `${order.customer_name || 'Customer'} — ৳${order.total_amount || ''}`,
      url:   '/dashboard/orders',
      tag:   `order-${order.order_number || order.id}`,
    }

    const result = await pushToUsers(supabase, recipientIds, vapidPublic, vapidPrivate, orderPayload)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
