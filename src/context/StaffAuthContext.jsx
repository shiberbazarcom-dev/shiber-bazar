import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const StaffAuthContext = createContext(null)
const STORAGE_KEY = 'sb_staff_session'

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function randomHex(bytes = 32) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

export function StaffAuthProvider({ children }) {
  const [staffSession, setStaffSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) { setLoading(false); return }
    try {
      const saved = JSON.parse(raw)
      verifyToken(saved.token).then(data => {
        if (data) setStaffSession({ ...data, token: saved.token })
        else localStorage.removeItem(STORAGE_KEY)
        setLoading(false)
      })
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setLoading(false)
    }
  }, [])

  async function verifyToken(token) {
    const { data: session } = await supabase
      .from('staff_sessions')
      .select('staff_id, staff:shop_staff(id, name, role, shop_id, is_active, shops(id, shop_name, slug))')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!session?.staff?.is_active) return null
    const s = session.staff
    const shop = Array.isArray(s.shops) ? s.shops[0] : s.shops
    return {
      staff_id:  s.id,
      name:      s.name,
      role:      s.role,
      shop_id:   s.shop_id,
      shop_name: shop?.shop_name || '',
    }
  }

  const loginWithPin = useCallback(async (shopCode, pin) => {
    // 1. Find shop by slug or id
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('id, shop_name, slug')
      .or(`slug.ilike.${shopCode.trim()},id.eq.${shopCode.trim()}`)
      .eq('status', 'approved')
      .maybeSingle()

    if (shopErr || !shop) throw new Error('shop_not_found')

    // 2. Hash PIN with shop_id (same as add-staff flow)
    const pinHash = await sha256Hex(pin.trim() + shop.id)

    // 3. Find matching staff
    const { data: staff, error: staffErr } = await supabase
      .from('shop_staff')
      .select('id, name, role, shop_id')
      .eq('shop_id', shop.id)
      .eq('pin_hash', pinHash)
      .eq('is_active', true)
      .maybeSingle()

    if (staffErr || !staff) throw new Error('invalid_credentials')

    // 4. Create session
    const token = randomHex(32)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error: sessErr } = await supabase
      .from('staff_sessions')
      .insert({ staff_id: staff.id, token, expires_at: expiresAt })

    if (sessErr) throw sessErr

    const sessionData = {
      token,
      staff_id:  staff.id,
      name:      staff.name,
      role:      staff.role,
      shop_id:   shop.id,
      shop_name: shop.shop_name,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData))
    setStaffSession(sessionData)
    return sessionData
  }, [])

  const loginWithInvite = useCallback(async (inviteToken, pin) => {
    // 1. Find staff by invite token
    const { data: staff, error: staffErr } = await supabase
      .from('shop_staff')
      .select('id, name, role, shop_id, shops(id, shop_name)')
      .eq('invite_token', inviteToken.trim())
      .eq('is_active', true)
      .maybeSingle()

    if (staffErr || !staff) throw new Error('invalid_token')

    const shop = Array.isArray(staff.shops) ? staff.shops[0] : staff.shops

    // 2. Hash new PIN
    const pinHash = await sha256Hex(pin.trim() + staff.shop_id)

    // 3. Update staff: set PIN hash, clear invite token
    const { error: updateErr } = await supabase
      .from('shop_staff')
      .update({ pin_hash: pinHash, invite_token: null, last_login_at: new Date().toISOString() })
      .eq('id', staff.id)

    if (updateErr) throw updateErr

    // 4. Create session
    const token = randomHex(32)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('staff_sessions').insert({ staff_id: staff.id, token, expires_at: expiresAt })

    const sessionData = {
      token,
      staff_id:  staff.id,
      name:      staff.name,
      role:      staff.role,
      shop_id:   staff.shop_id,
      shop_name: shop?.shop_name || '',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData))
    setStaffSession(sessionData)
    return sessionData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setStaffSession(null)
  }, [])

  return (
    <StaffAuthContext.Provider value={{ staffSession, loading, loginWithPin, loginWithInvite, logout }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

export function useStaffAuth() {
  return useContext(StaffAuthContext)
}
