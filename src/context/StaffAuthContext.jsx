import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const StaffAuthContext = createContext(null)

const STORAGE_KEY = 'sb_staff_session'

export function StaffAuthProvider({ children }) {
  const [staffSession, setStaffSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) { setLoading(false); return }
    try {
      const saved = JSON.parse(raw)
      // Re-verify with DB
      supabase.rpc('staff_verify_token', { p_token: saved.token }).then(({ data }) => {
        if (data) {
          setStaffSession({ ...data, token: saved.token })
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
        setLoading(false)
      })
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      setLoading(false)
    }
  }, [])

  const loginWithPin = useCallback(async (shopCode, pin) => {
    const { data, error } = await supabase.rpc('staff_login_pin', {
      p_shop_code: shopCode.trim(),
      p_pin: pin.trim(),
    })
    if (error) throw error
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setStaffSession(data)
    return data
  }, [])

  const loginWithInvite = useCallback(async (token, pin) => {
    const { data, error } = await supabase.rpc('staff_login_invite', {
      p_token: token.trim(),
      p_pin: pin.trim(),
    })
    if (error) throw error
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setStaffSession(data)
    return data
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
