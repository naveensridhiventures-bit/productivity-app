// Thin wrapper around the browser Notification API. Kept separate from
// useReminders so the scheduling logic doesn't need to know about feature
// detection or the service-worker-vs-plain-Notification split.

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPermission() {
  return isNotificationSupported() ? Notification.permission : 'unsupported'
}

export async function requestPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch (e) {
    // Older Safari uses the callback form instead of a Promise.
    return new Promise((resolve) => Notification.requestPermission(resolve))
  }
}

// Fire a notification. Prefers the service worker registration (works even
// when the PWA tab isn't focused, as long as the browser is running) and
// falls back to a plain `new Notification(...)` for browsers/dev servers
// where no service worker is registered yet.
export async function fireNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.()
    if (reg?.showNotification) {
      await reg.showNotification(title, options)
      return
    }
  } catch (e) {
    // fall through to the plain Notification below
  }
  try {
    new Notification(title, options)
  } catch (e) {
    console.warn('Failed to fire notification', e)
  }
}
