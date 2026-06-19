import { useEffect, useRef } from 'react'

/**
 * Custom confirm modal — replaces browser confirm()
 * Usage:
 *   <ConfirmModal
 *     open={open}
 *     title="মুছে ফেলবেন?"
 *     message="এই তথ্য পুনরুদ্ধার করা যাবে না।"
 *     confirmLabel="হ্যাঁ, মুছুন"
 *     confirmVariant="danger"   // "danger" | "primary"
 *     onConfirm={handleDelete}
 *     onCancel={() => setOpen(false)}
 *   />
 */
export default function ConfirmModal({
  open,
  title = 'নিশ্চিত করুন',
  message,
  confirmLabel = 'হ্যাঁ',
  cancelLabel = 'বাতিল',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])

  if (!open) return null

  const confirmCls = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400'
    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fadeIn">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
            confirmVariant === 'danger' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {confirmVariant === 'danger' ? '🗑️' : '❓'}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base">{title}</h3>
            {message && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ${confirmCls}`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                অপেক্ষা করুন...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
