import { supabase } from './supabase'

export async function logAudit({ action, entityType, entityId, entityName, details = {} }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      details,
    })
  } catch {
    // audit failures should never crash the main action
  }
}
