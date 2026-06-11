import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import { queryClient } from './lib/queryClient.js'
import { logError, installGlobalErrorHandlers } from './lib/errorLogger.js'
import './index.css'

// ── Sentry error monitoring ──
// Activate only when VITE_SENTRY_DSN env var is set (Vercel → Settings → Environment Variables)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,       // 10% performance traces (free quota সাশ্রয়)
    environment: import.meta.env.MODE,  // 'production' বা 'development'
  })
}

// ── Service Worker: register + force update on every page load ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      // Force check for a newer SW every single load (not just on cache miss)
      reg.update()
      // When a new SW finishes installing, reload the page immediately
      // so users never get stuck with a stale SW controlling the page
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // New SW is active — reload to use fresh assets
            window.location.reload()
          }
        })
      })
    } catch {
      // SW registration failed silently (e.g. in unsupported env)
    }
  })
}

// ── Global error boundary to prevent blank screen on component crash ──
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, errorInfo) {
    // Sentry-তে error পাঠাও
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: errorInfo })
    }
    // Admin panel-এ error log করো
    logError({
      severity: 'crash',
      message: error?.message || String(error),
      stack: error?.stack || null,
      component: errorInfo?.componentStack?.split('\n')[1]?.trim() || 'ErrorBoundary',
      extra: { componentStack: errorInfo?.componentStack },
    })
    console.error('[App crash]', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif', background: '#f5f5f5', padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            maxWidth: '400px', width: '100%', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
              কিছু একটা সমস্যা হয়েছে
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              পেজটি লোড করতে সমস্যা হয়েছে। পেজ রিলোড করুন।
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#2563EB', color: 'white', border: 'none',
                borderRadius: '12px', padding: '12px 28px', fontSize: '14px',
                fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              🔄 রিলোড করুন
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Install global error handlers (window.onerror + unhandledrejection)
installGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
