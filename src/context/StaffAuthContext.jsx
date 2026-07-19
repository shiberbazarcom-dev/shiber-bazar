import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logStaffActivity } from '../lib/staffLog'

const StaffAuthContext = createContext(null)
const STORAGE_KEY = 'sb_staff_session'

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
    const { data, error } = await supabase.rpc('staff_verify_token', { p_token: token })
    if (error || !data) return null
    return data
  }

  const loginWithPin = useCallback(async (shopCode, pin) => {
    const { data, error } = await supabase.rpc('staff_login_pin', {
      p_shop_code: shopCode.trim(),
      p_pin: pin.trim(),
    })
    if (error || !data) throw new Error(error?.message?.includes('shop_not_found') ? 'shop_not_found' : 'invalid_credentials')

    const sessionData = { ...data, token: data.token }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData))
    setStaffSession(sessionData)
    logStaffActivity(sessionData, 'login', { method: 'pin' })
    return sessionData
  }, [])

  const loginWithInvite = useCallback(async (inviteToken, pin) => {
    const { data, error } = await supabase.rpc('staff_login_invite', {
      p_token: inviteToken.trim(),
      p_pin: pin.trim(),
    })
    if (error || !data) throw new Error('invalid_token')

    const sessionData = { ...data, token: data.token }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData))
    setStaffSession(sessionData)
    logStaffActivity(sessionData, 'login', { method: 'invite' })
    return sessionData
  }, [])

  const logout = useCallback(() => {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (session) logStaffActivity(session, 'logout')
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
