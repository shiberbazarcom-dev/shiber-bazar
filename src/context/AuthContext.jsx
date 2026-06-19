import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) loadProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data)
    setLoading(false)
  }

  /* ── Helpers ── */
  // Convert a BD phone number to a synthetic email for Supabase Auth
  function phoneToEmail(phone) {
    const digits = String(phone).replace(/\D/g, '')
    return `${digits}@users.shiberbazar.com`
  }

  /* ── Auth actions ── */
  // Register with phone + password (email is auto-generated internally)
  async function signUp({ fullName, phone, password }) {
    const email = phoneToEmail(phone)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (!error && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id, full_name: fullName, phone, role: 'user',
      })
    }
    return { data, error }
  }

  // Sign in with phone + password
  async function signInPhone(phone, password) {
    const email = phoneToEmail(phone)
    return await supabase.auth.signInWithPassword({ email, password })
  }

  // Keep email-based sign-in for admin accounts / Google users
  async function signInEmail(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signInGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', user.id).select().single()
    if (!error) setProfile(data)
    return { data, error }
  }

  /* ── Computed ── */
  const role       = profile?.role || 'user'
  const isAdmin    = ['super_admin', 'market_manager'].includes(role)
  const isOwner    = ['shop_owner', 'super_admin', 'market_manager'].includes(role)
  const isSuperAdmin = role === 'super_admin'

  return (
    <AuthContext.Provider value={{
      user, profile, loading, role,
      isAdmin, isOwner, isSuperAdmin,
      signUp, signInEmail, signInPhone, signInGoogle,
      signOut, logout: signOut,          // alias for components that use `logout`
      updateProfile, loadProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
