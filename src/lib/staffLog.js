import { supabase } from './supabase'

async function getIP() {
  try {
    const r = await fetch('https://api.ipify.org?format=json')
    const j = await r.json()
    return j.ip
  } catch {
    return 'unknown'
  }
}

export async function logStaffActivity(staffSession, action, details = {}) {
  if (!staffSession?.staff_id) return
  try {
    const ip = await getIP()
    await supabase.from('staff_activity_logs').insert({
      staff_id:   staffSession.staff_id,
      shop_id:    staffSession.shop_id,
      staff_name: staffSession.name,
      staff_role: staffSession.role,
      action,
      details,
      ip_address: ip,
      user_agent: navigator.userAgent,
    })
  } catch {}
}
