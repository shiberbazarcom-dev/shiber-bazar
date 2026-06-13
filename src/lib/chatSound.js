import toast from 'react-hot-toast'

/* ── Chat message sound (Web Audio API — no external file needed) ── */
export function playMessageSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    // Two-tone "ding" — high then slightly lower
    const tones = [
      { freq: 1046, start: 0,    dur: 0.12 },
      { freq:  784, start: 0.13, dur: 0.18 },
    ]

    tones.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)

      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)

      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    })
  } catch {}
}

/* ── In-app toast notification (auto, no permission needed) ── */
export function showChatNotification(senderName, messageText, conversationId) {
  // Only show in-app if tab is NOT visible (if visible, user already sees it)
  if (document.visibilityState === 'visible') return

  const body = messageText?.length > 60
    ? messageText.slice(0, 60) + '…'
    : (messageText || 'নতুন বার্তা')

  toast.success(
    `💬 ${senderName}\n${body}`,
    {
      duration: 5000,
      position: 'bottom-right',
    }
  )

  // Optional: navigate on click by setting window location
  // User can also just see the toast and click chat icon manually
}

/* ── Browser notification (only if user explicitly enabled) ── */
export function showBrowserNotification(senderName, messageText, conversationId) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return

  const body = messageText?.length > 80
    ? messageText.slice(0, 80) + '…'
    : (messageText || 'নতুন বার্তা')

  const n = new Notification(`💬 ${senderName}`, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag:   `chat-${conversationId}`,
    renotify: true,
  })

  n.onclick = () => {
    window.focus()
    window.location.href = `/dashboard/chat/${conversationId}`
    n.close()
  }
}

/* ── Ask permission (optional, call once when user opens chat) ── */
export async function requestChatNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}
