import { Link } from 'react-router-dom'

const STATUS_CONFIG = {
  pending_approval: {
    label: 'অনুমোদনের অপেক্ষায়',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: '⏳',
  },
  approved: {
    label: 'অনুমোদিত',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: '✅',
  },
  rejected: {
    label: 'প্রত্যাখ্যাত',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: '❌',
  },
  suspended: {
    label: 'স্থগিত',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: '🚫',
  },
}

export default function ShopStatusBadge({ status, showLabel = true, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_approval
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

// Pending shop warning message component
export function PendingShopWarning() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⏳</span>
        <div>
          <h4 className="font-semibold text-amber-800 mb-1">অনুমোদনের অপেক্ষায়</h4>
          <p className="text-amber-700 text-sm">
            আপনার দোকান অনুমোদনের অপেক্ষায় আছে। সুপার অ্যাডমিন অনুমোদন দিলে আপনি পণ্য যোগ করতে পারবেন।
          </p>
        </div>
      </div>
    </div>
  )
}

// Rejected shop message component
export function RejectedShopWarning({ shopId }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">❌</span>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 mb-1">দোকান প্রত্যাখ্যাত হয়েছে</h4>
          <p className="text-red-700 text-sm mb-3">
            আপনার দোকান অনুমোদিত হয়নি। অনুগ্রহ করে তথ্য সংশোধন করে পুনরায় জমা দিন।
          </p>
          <Link
            to={`/dashboard/edit-shop/${shopId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            দোকান সম্পাদনা করুন
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Approved shop success message
export function ApprovedShopMessage() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🎉</span>
        <div>
          <h4 className="font-semibold text-green-800 mb-1">দোকান অনুমোদিত!</h4>
          <p className="text-green-700 text-sm">
            আপনার দোকান অনুমোদিত হয়েছে। এখন আপনি পণ্য যোগ করতে পারবেন।
          </p>
        </div>
      </div>
    </div>
  )
}

// Status-based action wrapper
export function ShopActionWrapper({ shop, children }) {
  if (shop.status === 'pending_approval') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <div className="text-center">
            <span className="text-3xl">🔒</span>
            <p className="text-sm text-gray-500 mt-1">অনুমোদনের অপেক্ষায়</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (shop.status === 'rejected') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <div className="text-center">
            <span className="text-3xl">🚫</span>
            <p className="text-sm text-gray-500 mt-1">প্রত্যাখ্যাত</p>
          </div>
        </div>
      </div>
    )
  }
  
  return children
}
