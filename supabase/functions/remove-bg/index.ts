import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const FREE_LIMIT = 2
const PRO_LIMIT  = 50

/* ── Remove.bg: accepts image_url ── */
async function removeViaRemoveBg(imageUrl: string, apiKey: string): Promise<ArrayBuffer> {
  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, size: 'auto', type: 'product' }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`remove.bg ${res.status}: ${err}`)
  }
  return res.arrayBuffer()
}

/* ── HuggingFace fallback: fetch image → send binary ── */
async function removeViaHuggingFace(imageUrl: string, apiKey: string): Promise<ArrayBuffer> {
  // First fetch the image
  const imgFetch = await fetch(imageUrl)
  if (!imgFetch.ok) throw new Error(`Could not fetch image: ${imgFetch.status}`)
  const imgBuffer = await imgFetch.arrayBuffer()

  const res = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imgBuffer,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HuggingFace ${res.status}: ${err}`)
  }
  return res.arrayBuffer()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    /* ── 0. Auth ── */
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
    const { shop_id, image_url } = await req.json()
    if (!shop_id || !image_url)
      return new Response(JSON.stringify({ error: 'shop_id and image_url required' }), { status: 400, headers: corsHeaders })

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
      return new Response(JSON.stringify({ error: 'limit_reached', used, limit, isPro }), { status: 429, headers: corsHeaders })
    }

    /* ── 2. Remove background — remove.bg first, HuggingFace fallback ── */
    const removeBgKey = Deno.env.get('REMOVE_BG_API_KEY')
    const hfKey       = Deno.env.get('HUGGINGFACE_API_KEY')

    let resultBuffer: ArrayBuffer
    let usedApi = 'huggingface'

    try {
      if (!hfKey) throw new Error('no HuggingFace key')
      resultBuffer = await removeViaHuggingFace(image_url, hfKey)
    } catch (primaryErr: any) {
      console.warn('HuggingFace failed:', primaryErr.message, '— trying remove.bg...')
      if (!removeBgKey) throw new Error('HuggingFace failed and no remove.bg key available')
      resultBuffer = await removeViaRemoveBg(image_url, removeBgKey)
      usedApi = 'removebg'
    }

    /* ── 3. Upload PNG to Supabase Storage ── */
    const storagePath = `${user.id}/bg-removed-${Date.now()}.png`
    const { error: uploadErr } = await supabase.storage
      .from('shop-images')
      .upload(storagePath, resultBuffer, { contentType: 'image/png', upsert: true })
    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

    const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(storagePath)

    /* ── 4. Increment counter ── */
    await supabase.from('shops').update({ bg_remove_count: used + 1 }).eq('id', shop_id)

    return new Response(JSON.stringify({ success: true, url: publicUrl, used: used + 1, limit, api: usedApi }), { headers: corsHeaders })

  } catch (e: any) {
    console.error('remove-bg error:', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})
