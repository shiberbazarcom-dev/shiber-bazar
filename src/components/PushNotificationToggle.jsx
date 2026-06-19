import { usePushNotifications } from '../hooks/usePushNotifications'

export default function PushNotificationToggle() {
  const { subscribed, loading, toggle, isSupported, permission } = usePushNotifications()
  if (!isSupported) return null
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🔔</div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Push Notification</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {permission === 'denied' ? 'Browser সেটিংস থেকে অনুমতি দিন'
              : subscribed ? 'অর্ডার আপডেট ও নোটিফিকেশন পাচ্ছেন'
              : 'অর্ডার আপডেট সরাসরি পাবেন'}
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={loading || permission === 'denied'}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 ${subscribed ? 'bg-purple-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${subscribed ? 'translate-x-6' : 'translate-x-0'}`} />
        {loading && <span className="absolute inset-0 flex items-center justify-center"><span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" /></span>}
      </button>
    </div>
  )
}
