import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { conversation_id } = await req.json()
    if (!conversation_id) return new Response(JSON.stringify({ error: 'conversation_id required' }), { status: 400, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    /* ── 1. Fetch conversation + shop ── */
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id, shop_id, owner_id, customer_id, shops(shop_name, description, category, auto_reply_enabled, ai_persona, plan, plan_expires_at)')
      .eq('id', conversation_id)
      .single()

    if (convErr || !conv) return new Response(JSON.stringify({ skipped: true }), { headers: corsHeaders })
    if (!conv.shops?.auto_reply_enabled) return new Response(JSON.stringify({ skipped: true }), { headers: corsHeaders })

    /* ── 1b. Check plan & AI reply limit for free shops ── */
    const shop: any = conv.shops
    const planExpired = shop.plan_expires_at && new Date(shop.plan_expires_at) <= new Date()
    const isPaidPlan = shop.plan && shop.plan !== 'free' && !planExpired

    const FREE_AI_LIMIT = 50
    if (!isPaidPlan) {
      // Get all conversation IDs for this shop
      const { data: shopConvs } = await supabase
        .from('conversations').select('id').eq('shop_id', conv.shop_id)
      const convIds = (shopConvs || []).map((c: any) => c.id)

      const { count: aiCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_ai', true)
        .in('conversation_id', convIds.length ? convIds : [''])

      if ((aiCount ?? 0) >= FREE_AI_LIMIT) {
        await supabase.from('messages').insert({
          conversation_id,
          sender_id: conv.owner_id,
          content: '🔒 এই দোকানের বিনামূল্যে AI সীমা (৫০টি) শেষ হয়েছে। দোকানদারের সাথে সরাসরি যোগাযোগ করুন।',
          is_ai: true,
        })
        return new Response(JSON.stringify({ skipped: true, reason: 'ai_limit_reached' }), { headers: corsHeaders })
      }
    }

    /* ── 2. Fetch recent messages ── */
    const { data: messages = [] } = await supabase
      .from('messages')
      .select('content, sender_id, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(12)

    const recentMessages = [...messages].reverse()
    const lastMsg = recentMessages[recentMessages.length - 1]

    // Don't reply if last message is from owner (avoid loop)
    if (lastMsg?.sender_id === conv.owner_id) return new Response(JSON.stringify({ skipped: true }), { headers: corsHeaders })

    /* ── 3. Fetch shop products ── */
    const { data: products = [] } = await supabase
      .from('products')
      .select('name, price, description, stock_quantity')
      .eq('shop_id', conv.shop_id)
      .eq('is_active', true)
      .limit(30)

    /* ── 4. Build Claude prompt ── */
    const shopName = conv.shops?.shop_name || 'দোকান'
    const shopDesc = conv.shops?.description || ''
    const persona = conv.shops?.ai_persona || ''

    const productList = products.length > 0
      ? products.map(p => `- ${p.name}: ৳${p.price}${p.description ? ` (${p.description})` : ''}${p.stock_quantity !== null ? ` [স্টক: ${p.stock_quantity}]` : ''}`).join('\n')
      : 'পণ্যের তথ্য পাওয়া যাচ্ছে না'

    const chatHistory = recentMessages.slice(0, -1).map(m => ({
      role: m.sender_id === conv.owner_id ? 'assistant' : 'user',
      content: m.content,
    }))

    const systemPrompt = `তুমি "${shopName}" দোকানের একজন সহায়ক AI assistant।${shopDesc ? ` দোকানের বিবরণ: ${shopDesc}` : ''}${persona ? `\n\n${persona}` : ''}

তোমার কাজ: customer-দের প্রশ্নের উত্তর দেওয়া, পণ্যের তথ্য দেওয়া, এবং ক্রয়ে সাহায্য করা।

দোকানের পণ্য তালিকা:
${productList}

নিয়ম:
- সবসময় বাংলায় উত্তর দাও (প্রয়োজনে ইংরেজি শব্দ ব্যবহার করতে পারো)
- সংক্ষিপ্ত ও সহায়ক উত্তর দাও
- মূল্য, স্টক, ডেলিভারি সম্পর্কে সঠিক তথ্য দাও
- যদি কিছু না জানো, বলো "দোকানদারের সাথে সরাসরি কথা বলুন"
- অর্ডার করতে বললে WhatsApp বা সরাসরি যোগাযোগের কথা বলো`

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set')

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          ...chatHistory,
          { role: 'user', content: lastMsg.content },
        ],
      }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    const aiData = await aiRes.json()
    const replyText = aiData.content?.[0]?.text
    if (!replyText) throw new Error('Empty AI response')

    /* ── 5. Insert AI reply as owner message ── */
    const { error: insertErr } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: conv.owner_id,
        content: replyText,
        is_ai: true,
      })

    if (insertErr) throw insertErr

    await supabase
      .from('conversations')
      .update({ last_message: replyText, last_message_at: new Date().toISOString() })
      .eq('id', conversation_id)

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })

  } catch (e) {
    console.error('ai-auto-reply error:', e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})
