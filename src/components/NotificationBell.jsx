import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  useNotifications, 
  useUnreadNotificationCount, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  useRealtimeNotifications 
} from '../hooks/useNotifications'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const { data: notifications = [], isError: notifError } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  // ALL hooks must be called unconditionally — Rules of Hooks
  // Subscribe to real-time updates (no-ops gracefully if table missing)
  useRealtimeNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // notifications table may not exist yet — render nothing rather than crash
  // (must come AFTER all hooks — Rules of Hooks)
  if (notifError) return null
  
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id)
    }
    setIsOpen(false)
  }
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'shop_approved':
      case 'service_approved':
        return '✅'
      case 'shop_rejected':
      case 'service_rejected':
        return '❌'
      case 'new_shop_request':
        return '🏪'
      case 'order_received':
        return '🛒'
      default:
        return '🔔'
    }
  }
  
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60))
      return `${minutes} মিনিট আগে`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ঘণ্টা আগে`
    } else {
      return `${Math.floor(diffInHours / 24)} দিন আগে`
    }
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">বিজ্ঞপ্তি</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                সব পড়া হয়েছে
              </button>
            )}
          </div>
          
          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-4xl">🔔</span>
                <p className="text-gray-500 text-sm mt-2">কোনো বিজ্ঞপ্তি নেই</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-brand-600 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <Link
                to="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                সব বিজ্ঞপ্তি দেখুন
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
