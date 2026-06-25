import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function addPadding(b64: string): string {
  return b64 + '=='.slice(0, (4 - b64.length % 4) % 4)
}

function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = addPadding(b64url.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

function bytesToB64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/* ── VAPID JWT using JWK import (works reliably in Deno) ── */
async function buildVapidJwt(
  audience: string,
  subject: string,
  vapidPrivateB64url: string,
  vapidPublicB64url: string,
): Promise<string> {
  // Extract x, y from uncompressed public key (04 || x[32] || y[32])
  const pubBytes = b64urlToBytes(vapidPublicB64url)
  const x = bytesToB64url(pubBytes.slice(1, 33))
  const y = bytesToB64url(pubBytes.slice(33, 65))

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d:   vapidPrivateB64url.replace(/=/g, ''),
    x,
    y,
    key_ops: ['sign'],
  }

  const key = await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const now     = Math.floor(Date.now() / 1000)
  const header  = { alg: 'ES256', typ: 'JWT' }
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject }

  const enc = (obj: object) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const signingInput = `${enc(header)}.${enc(payload)}`

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput),
  )

  const sigB64url = bytesToB64url(new Uint8Array(sig))
  return `${signingInput}.${sigB64url}`
}

/* ── Send ping push ── */
async function sendWebPush(
  endpoint: string,
  vapidPublic: string,
  vapidPrivate: string,
): Promise<Response> {
  const url      = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt      = await buildVapidJwt(audience, 'mailto:admin@shiberbazar.com', vapidPrivate, vapidPublic)

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'TTL': '86400',
      'Authorization': `vapid t=${jwt},k=${vapidPublic}`,
    },
  })
}

/* ── Push to all subscriptions of given user IDs ── */
async function pushToUsers(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
  vapidPublic: string,
  vapidPrivate: string,
) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, user_id')
    .in('user_id', userIds)

  if (!subs || subs.length === 0) return { sent: 0, reason: 'no subscriptions' }

  const results = await Promise.allSettled(
    subs.map(async (sub: { endpoint: string; user_id: string }) => {
      try {
        const res = await sendWebPush(sub.endpoint, vapidPublic, vapidPrivate)
        console.log(`push status ${res.status} endpoint=${sub.endpoint.slice(0, 50)}`)
        if (res.status === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          console.error(`push failed ${res.status}: ${txt}`)
        }
        return res.status
      } catch (err) {
        console.error('push exception:', String(err))
        throw err
      }
    })
  )

  const sent   = results.filter(r => r.status === 'fulfilled' && (r.value as number) < 300).length
  const failed = results.length - sent
  console.log(`send-push done: sent=${sent} failed=${failed}`)
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
      const result = await pushToUsers(supabase, [body.user_id], vapidPublic, vapidPrivate)
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

    const result = await pushToUsers(supabase, recipientIds, vapidPublic, vapidPrivate)
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
