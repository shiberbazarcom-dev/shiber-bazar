import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('লগইন হচ্ছে...')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setMessage('সমস্যা হয়েছে। আবার চেষ্টা করুন।')
        setTimeout(() => navigate('/login', { replace: true }), 2000)
        return
      }
      if (session) {
        navigate('/', { replace: true })
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            navigate('/', { replace: true })
          }
        })
        const timer = setTimeout(() => {
          navigate('/login', { replace: true })
        }, 4000)
        return () => {
          subscription.unsubscribe()
          clearTimeout(timer)
        }
      }
    })
  }, []) // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}
