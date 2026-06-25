import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore — Deno npm specifier
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!

    webpush.setVapidDetails('mailto:admin@shiberbazar.com', vapidPublic, vapidPrivate)

    const supabase = createClient(supabaseUrl, serviceKey)

    /* ── Resolve recipient user IDs ── */
    let userIds: string[] = []
    let payload: object

    if (body.user_id) {
      /* Case 1: direct call from Vercel (message or order push) */
      userIds = [body.user_id]
      payload = body.payload ?? {
        title: '🛍️ শিবের বাজার',
        body:  'নতুন বার্তা বা অর্ডার এসেছে।',
        url:   '/dashboard',
        tag:   'shiber-bazar',
      }
    } else {
      /* Case 2: DB Webhook — new order INSERT */
      const order = body.record ?? body
      if (!order?.id) {
        return new Response(JSON.stringify({ error: 'No order data' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (order.shop_id) {
        const { data: shop } = await supabase
          .from('shops').select('owner_id').eq('id', order.shop_id).single()
        if (shop?.owner_id) userIds.push(shop.owner_id)
      }

      if (!order.shop_id || order.status === 'pending') {
        const { data: admins } = await supabase
          .from('profiles').select('id').in('role', ['super_admin', 'market_manager'])
        if (admins) userIds.push(...admins.map((a: { id: string }) => a.id))
      }

      userIds = [...new Set(userIds)]
      payload = {
        title: '🛒 নতুন অর্ডার এসেছে',
        body:  `${order.customer_name || 'Customer'} — ৳${order.total_amount || ''}`,
        url:   '/dashboard/orders',
        tag:   `order-${order.order_number || order.id}`,
      }
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no recipients' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    /* ── Fetch subscriptions ── */
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds)

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    /* ── Send encrypted push ── */
    const payloadStr = JSON.stringify(payload)
    const results = await Promise.allSettled(
      subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr,
        ).catch(async (err: { statusCode?: number }) => {
          console.error('push failed:', err)
          if (err?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        })
      )
    )

    const sent   = results.filter(r => r.status === 'fulfilled' && r.value !== undefined).length
    const failed = results.length - sent
    console.log(`send-push done: sent=${sent} failed=${failed}`)

    return new Response(JSON.stringify({ sent: results.length, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
