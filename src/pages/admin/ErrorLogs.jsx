import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const SEV_COLOR = {
  crash:   { bg: '#fef2f2', text: '#dc2626', badge: '#fee2e2' },
  error:   { bg: '#fff7ed', text: '#ea580c', badge: '#ffedd5' },
  warning: { bg: '#fefce8', text: '#ca8a04', badge: '#fef9c3' },
}

const SEV_LABEL = { crash: '💥 Crash', error: '🔴 Error', warning: '⚠️ Warning' }

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `${diff}s আগে`
  if (diff < 3600) return `${Math.floor(diff / 60)}m আগে`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h আগে`
  return `${Math.floor(diff / 86400)}d আগে`
}

export default function ErrorLogs() {
  const [logs, setLogs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')   // all | crash | error | warning
  const [expanded, setExpanded] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [stats, setStats]       = useState({ crash: 0, error: 0, warning: 0 })

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (filter !== 'all') q = q.eq('severity', filter)
    const { data, error } = await q
    if (!error && data) {
      setLogs(data)
      // recalculate stats from ALL logs (not just filtered)
      const { data: all } = await supabase
        .from('error_logs')
        .select('severity')
      if (all) {
        const s = { crash: 0, error: 0, warning: 0 }
        all.forEach(r => { if (s[r.severity] !== undefined) s[r.severity]++ })
        setStats(s)
      }
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('error_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'error_logs' }, () => {
        fetchLogs()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchLogs])

  async function deleteLog(id) {
    setDeleting(id)
    await supabase.from('error_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  async function clearAll() {
    if (!window.confirm('সব error log মুছে ফেলবেন?')) return
    const ids = logs.map(l => l.id)
    await supabase.from('error_logs').delete().in('id', ids)
    setLogs([])
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🐛 Error Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">App-এর সব crash, error ও warning এখানে দেখা যাবে</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            🔄 রিফ্রেশ
          </button>
          {logs.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              🗑️ সব মুছুন
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { key: 'crash',   icon: '💥', label: 'Crash',   color: '#dc2626' },
          { key: 'error',   icon: '🔴', label: 'Error',   color: '#ea580c' },
          { key: 'warning', icon: '⚠️', label: 'Warning', color: '#ca8a04' },
        ].map(({ key, icon, label, color }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold" style={{ color }}>{stats[key]}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'crash', 'error', 'warning'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? '📋 সব' : SEV_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-700 font-semibold text-lg">কোনো error নেই!</p>
          <p className="text-gray-400 text-sm mt-1">App সুন্দরভাবে চলছে</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => {
            const c = SEV_COLOR[log.severity] || SEV_COLOR.error
            const isOpen = expanded === log.id
            return (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Main row */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  {/* Severity badge */}
                  <span
                    className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5"
                    style={{ background: c.badge, color: c.text }}
                  >
                    {SEV_LABEL[log.severity]}
                  </span>

                  {/* Message + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{log.message}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                      <span>🕐 {timeAgo(log.created_at)}</span>
                      {log.component && <span>📦 {log.component}</span>}
                      {log.url && (
                        <span className="truncate max-w-[200px]">
                          🔗 {log.url.replace(window.location.origin, '')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand + delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteLog(log.id) }}
                      disabled={deleting === log.id}
                      className="text-gray-300 hover:text-red-500 transition text-lg leading-none"
                      title="মুছুন"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3 text-xs">
                    {log.stack && (
                      <div>
                        <p className="font-semibold text-gray-600 mb-1">Stack Trace:</p>
                        <pre className="bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed text-[11px]">
                          {log.stack}
                        </pre>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {log.url && (
                        <div>
                          <span className="font-semibold text-gray-500">URL: </span>
                          <span className="text-gray-700 break-all">{log.url}</span>
                        </div>
                      )}
                      {log.user_agent && (
                        <div>
                          <span className="font-semibold text-gray-500">Browser: </span>
                          <span className="text-gray-700">{log.user_agent.split(' ').slice(-1)[0]}</span>
                        </div>
                      )}
                      {log.user_id && (
                        <div>
                          <span className="font-semibold text-gray-500">User ID: </span>
                          <span className="text-gray-700 font-mono">{log.user_id}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-500">Time: </span>
                        <span className="text-gray-700">
                          {new Date(log.created_at).toLocaleString('bn-BD')}
                        </span>
                      </div>
                    </div>
                    {log.extra && (
                      <div>
                        <p className="font-semibold text-gray-600 mb-1">Extra Info:</p>
                        <pre className="bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700 text-[11px]">
                          {JSON.stringify(log.extra, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
