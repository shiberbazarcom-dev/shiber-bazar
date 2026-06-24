import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function usePlan() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-plan', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shops')
        .select('plan, plan_expires_at')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!user,
  })
}

export function isPlanActive(shop, requiredPlan = 'pro') {
  if (!shop?.plan || shop.plan === 'free') return false
  const expired = shop.plan_expires_at && new Date(shop.plan_expires_at) <= new Date()
  if (expired) return false
  if (requiredPlan === 'pro') return shop.plan === 'pro' || shop.plan === 'business'
  if (requiredPlan === 'business') return shop.plan === 'business'
  return false
}

function LockScreen({ title, description, features, requiredPlan = 'pro' }) {
  const isPro = requiredPlan === 'pro'
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isPro ? 'bg-blue-50' : 'bg-purple-50'}`}>
          <svg className={`w-8 h-8 ${isPro ? 'text-blue-600' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-1">{description}</p>
        <p className={`text-sm font-semibold mb-6 ${isPro ? 'text-blue-600' : 'text-purple-600'}`}>
          {isPro ? 'Pro ও Business plan-এ পাওয়া যায়' : 'Business plan-এ পাওয়া যায়'}
        </p>
        {features?.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            {features.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center flex-shrink-0 ${isPro ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>✓</span>
                {f}
              </div>
            ))}
          </div>
        )}
        <Link to="/pricing"
          className={`block w-full py-3 rounded-xl text-white text-sm font-bold transition-colors ${isPro ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
          Plan দেখুন ও Upgrade করুন
        </Link>
        <p className="text-xs text-gray-400 mt-3">
          ইতিমধ্যে upgrade করেছেন?{' '}
          <button onClick={() => window.location.reload()} className="text-blue-500 hover:underline">Refresh করুন</button>
        </p>
      </div>
    </div>
  )
}

export function ProGate({ children, title, description, features }) {
  const { data: shop, isLoading } = usePlan()
  if (isLoading) return null
  if (!isPlanActive(shop, 'pro')) {
    return <LockScreen title={title} description={description} features={features} requiredPlan="pro" />
  }
  return children
}

export function BusinessGate({ children, title, description, features }) {
  const { data: shop, isLoading } = usePlan()
  if (isLoading) return null
  if (!isPlanActive(shop, 'business')) {
    return <LockScreen title={title} description={description} features={features} requiredPlan="business" />
  }
  return children
}
