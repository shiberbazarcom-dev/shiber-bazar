import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_LIMIT = 2
const PRO_LIMIT  = 50

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    /* ── 0. Auth check ── */
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer '))
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await callerClient.auth.getUser()
    if (authErr || !user)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    /* ── 1. Plan check ── */
    const { shop_id, image_base64 } = await req.json()
    if (!shop_id || !image_base64)
      return new Response(JSON.stringify({ error: 'shop_id and image_base64 required' }), { status: 400, headers: corsHeaders })

    const { data: shop } = await supabase
      .from('shops')
      .select('id, owner_id, plan, plan_expires_at, bg_remove_count')
      .eq('id', shop_id)
      .single()

    if (!shop || shop.owner_id !== user.id)
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })

    const planExpired = shop.plan_expires_at && new Date(shop.plan_expires_at) <= new Date()
    const isPro  = shop.plan && shop.plan !== 'free' && !planExpired
    const isBiz  = shop.plan === 'business' && !planExpired
    const limit  = isBiz ? 9999 : isPro ? PRO_LIMIT : FREE_LIMIT
    const used   = shop.bg_remove_count ?? 0

    if (used >= limit) {
      return new Response(JSON.stringify({
        error: 'limit_reached',
        used,
        limit,
        isPro,
      }), { status: 429, headers: corsHeaders })
    }

    /* ── 2. Call Replicate cjwbw/rembg ── */
    const replicateKey = Deno.env.get('REPLICATE_API_TOKEN')
    if (!replicateKey) throw new Error('REPLICATE_API_TOKEN not set')

    // Start prediction
    const startRes = await fetch('https://api.replicate.com/v1/models/cjwbw/rembg/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { image: image_base64 }
      }),
    })

    const startData = await startRes.json()
    console.log('Replicate start:', JSON.stringify(startData))

    if (!startRes.ok || startData.error) {
      throw new Error(`Replicate start error: ${startData.error || startRes.status}`)
    }

    const predictionId = startData.id
    if (!predictionId) throw new Error('No prediction ID returned')

    // Poll for result (max 60s)
    let output: string | null = null
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const pollRes  = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Token ${replicateKey}` }
      })
      const polled = await pollRes.json()
      console.log(`Poll ${i}: status=${polled.status}`)

      if (polled.status === 'succeeded') {
        output = typeof polled.output === 'string' ? polled.output : polled.output?.[0]
        break
      }
      if (polled.status === 'failed') {
        throw new Error(`Replicate failed: ${polled.error || 'unknown'}`)
      }
    }

    if (!output) throw new Error('Replicate timed out — no output')

    /* ── 3. Download PNG + upload to Supabase Storage ── */
    const imgRes  = await fetch(output)
    const imgBlob = await imgRes.arrayBuffer()

    const storagePath = `${user.id}/bg-removed-${Date.now()}.png`
    const { error: uploadErr } = await supabase.storage
      .from('shop-images')
      .upload(storagePath, imgBlob, { contentType: 'image/png', upsert: true })
    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

    const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(storagePath)

    /* ── 4. Increment counter ── */
    await supabase.from('shops').update({ bg_remove_count: used + 1 }).eq('id', shop_id)

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      used: used + 1,
      limit,
    }), { headers: corsHeaders })

  } catch (e: any) {
    console.error('remove-bg error:', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})
