import { supabase } from './supabase'

/* ─── Plan helpers ─────────────────────────────── */
export function isPro(shop)      { return shop?.plan === 'pro' || shop?.plan === 'business' }
export function isBusiness(shop) { return shop?.plan === 'business' }

/* ─── Monthly window ──────────────────────────── */
function monthStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

/* ─── Broadcast count this month for a shop ───── */
export async function getBroadcastCountThisMonth(shopId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, created_at, data')
    .eq('type', 'broadcast')
    .gte('created_at', monthStart())
  if (error) return 0

  // deduplicate by minute (same logic as fetchHistory)
  const seen = new Set()
  let count = 0
  for (const n of data || []) {
    if (n.data?.shop_id !== shopId) continue
    const key = Math.floor(new Date(n.created_at) / 60000)
    if (!seen.has(key)) { seen.add(key); count++ }
  }
  return count
}

/* ─── AI description count this month ─────────── */
export async function getAiDescCountThisMonth(shopId) {
  const { count, error } = await supabase
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('type', 'product_description')
    .gte('created_at', monthStart())
  return error ? 0 : (count || 0)
}

/* ─── Log AI usage ─────────────────────────────── */
export async function logAiUsage({ shopId, userId, type }) {
  await supabase.from('ai_usage').insert({ shop_id: shopId, user_id: userId, type })
}

/* ─── AI chat count this month for a shop ───────
   Counts is_ai=true messages in conversations belonging to this shop */
export async function getAiChatCountThisMonth(shopId) {
  // get conversation ids for this shop
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .eq('shop_id', shopId)
  if (!convs?.length) return 0

  const convIds = convs.map(c => c.id)
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convIds)
    .eq('is_ai', true)
    .gte('created_at', monthStart())
  return error ? 0 : (count || 0)
}
