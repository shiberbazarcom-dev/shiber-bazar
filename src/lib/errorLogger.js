import { supabase } from './supabase'

/**
 * Log an error to the error_logs Supabase table.
 * Silently fails — never throws, so it can't cause a second crash.
 */
export async function logError({ severity = 'error', message, stack, component, extra = {} } = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('error_logs').insert({
      severity,
      message: String(message || 'Unknown error').slice(0, 2000),
      stack: stack ? String(stack).slice(0, 5000) : null,
      url: window.location.href,
      component: component || null,
      user_agent: navigator.userAgent || null,
      user_id: user?.id || null,
      extra: Object.keys(extra).length ? extra : null,
    })
  } catch {
    // Silently fail — logging must never crash the app
  }
}

/**
 * Install global window error handlers.
 * Call once from main.jsx after the app mounts.
 */
export function installGlobalErrorHandlers() {
  // Uncaught JS errors
  window.addEventListener('error', (event) => {
    logError({
      severity: 'error',
      message: event.message || 'Uncaught error',
      stack: event.error?.stack || null,
      component: 'window.onerror',
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    })
  })

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    logError({
      severity: 'error',
      message: reason?.message || String(reason) || 'Unhandled promise rejection',
      stack: reason?.stack || null,
      component: 'unhandledrejection',
    })
  })
}
