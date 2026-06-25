import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ── Wrap raw 32-byte EC key into PKCS8 DER (required by WebCrypto) ── */
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

/* ── VAPID JWT signing ── */
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

/* ── Send a ping push (no encrypted payload — keeps it simple & reliable) ── */
async function sendWebPush(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<Response> {
  const url      = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt      = await buildVapidJwt(audience, 'mailto:admin@shiberbazar.com', vapidPrivateKey)

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'TTL': '86400',
      'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
    },
    // No body — browser push server delivers a "ping", sw.js shows fallback notification
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body  = await req.json()
    // Supabase DB webhook wraps row in { type, record, ... }
    const order = body.record ?? body

    if (!order || !order.id) {
      return new Response(JSON.stringify({ error: 'No order data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey)

    // Collect recipient user IDs
    let recipientIds: string[] = []

    // Shop owner (if order is already assigned to a shop)
    if (order.shop_id) {
      const { data: shop } = await supabase
        .from('shops').select('owner_id').eq('id', order.shop_id).single()
      if (shop?.owner_id) recipientIds.push(shop.owner_id)
    }

    // Admins always get notified for new (pending) orders
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

    // Fetch push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint')
      .in('user_id', recipientIds)

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = await Promise.allSettled(
      subs.map(sub => sendWebPush(sub.endpoint, vapidPublic, vapidPrivate))
    )

    const sent   = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - sent

    console.log(`send-push: sent=${sent} failed=${failed} order=${order.id}`)

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
