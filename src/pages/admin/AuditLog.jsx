import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const PAGE = 30

const ACTION_META = {
  shop_approved:        { icon: '✅', label: 'দোকান অনুমোদন',      color: 'bg-green-100  text-green-700'  },
  shop_rejected:        { icon: '❌', label: 'দোকান প্রত্যাখ্যান',  color: 'bg-red-100    text-red-700'    },
  order_status_changed: { icon: '📦', label: 'অর্ডার স্ট্যাটাস',    color: 'bg-blue-100   text-blue-700'   },
  role_changed:         { icon: '🛡️', label: 'Role পরিবর্তন',        color: 'bg-purple-100 text-purple-700' },
  shop_deleted:         { icon: '🗑️', label: 'দোকান মুছে ফেলা',      color: 'bg-red-100    text-red-700'    },
  shop_featured:        { icon: '⭐', label: 'বিশেষ চিহ্নিত',         color: 'bg-amber-100  text-amber-700'  },
  user_banned:          { icon: '🚫', label: 'ব্যবহারকারী বন্ধ',       color: 'bg-gray-100   text-gray-700'   },
  ad_created:           { icon: '📢', label: 'বিজ্ঞাপন তৈরি',         color: 'bg-pink-100   text-pink-700'   },
  ad_deleted:           { icon: '🗑️', label: 'বিজ্ঞাপন মুছে ফেলা',    color: 'bg-red-100    text-red-700'    },
  service_approved:     { icon: '🛠️', label: 'সেবা অনুমোদন',          color: 'bg-teal-100   text-teal-700'   },
  service_rejected:     { icon: '🛠️', label: 'সেবা প্রত্যাখ্যান',      color: 'bg-red-100    text-red-700'    },
}

function useAuditLogs({ page = 0, action = '' } = {}) {
  return useQuery({
    queryKey: ['audit-logs', page, action],
    queryFn: async () => {
      let q = supabase
        .from('audit_logs')
        .select('*, profiles(full_name, role)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE, (page + 1) * PAGE - 1)
      if (action) q = q.eq('action', action)
      const { data, error, count } = await q
      if (error) throw error
      return { logs: data || [], total: count || 0 }
    },
  })
}

export default function AuditLog() {
  const [page, setPage] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const { data, isLoading, refetch } = useAuditLogs({ page, action: actionFilter })

  const logs = data?.logs || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🗂️ Audit Log</h1>
          <p className="text-sm text-gray-400 mt-0.5">কে কখন কী করেছে — সম্পূর্ণ রেকর্ড</p>
        </div>
        <button onClick={() => refetch()}
          className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          🔄 রিফ্রেশ
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { val: '', label: 'সব' },
          { val: 'shop_approved',        label: '✅ অনুমোদন' },
          { val: 'shop_rejected',        label: '❌ প্রত্যাখ্যান' },
          { val: 'order_status_changed', label: '📦 অর্ডার' },
          { val: 'role_changed',         label: '🛡️ Role' },
        ].map(f => (
          <button key={f.val} onClick={() => { setActionFilter(f.val); setPage(0) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              actionFilter === f.val
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">মোট {total} টি রেকর্ড</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">
              {actionFilter ? 'এই ধরনের কোনো লগ নেই' : 'কোনো লগ নেই'}
            </p>
            <p className="text-gray-300 text-xs mt-1">
              {actionFilter
                ? 'অন্য ফিল্টার বেছে নিন'
                : 'Supabase এ migration_audit_log.sql রান করুন'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">কার্যক্রম</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">বিষয়</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">অ্যাডমিন</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">বিবরণ</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => {
                  const meta = ACTION_META[log.action] || { icon: '📝', label: log.action, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-700">{log.entity_name || '—'}</p>
                        <p className="text-xs text-gray-400">{log.entity_type}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-700">{log.profiles?.full_name || '—'}</p>
                        <p className="text-xs text-gray-400">{log.profiles?.role}</p>
                      </td>
                      <td className="px-5 py-3 max-w-xs">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {Object.entries(log.details).filter(([, v]) => v != null).map(([k, v]) => (
                              <p key={k}><span className="text-gray-400">{k}:</span> {String(v)}</p>
                            ))}
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('bn-BD')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              ← আগের
            </button>
            <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              পরের →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
