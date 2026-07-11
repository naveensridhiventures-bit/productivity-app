import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isNotificationSupported,
  getPermission,
  requestPermission,
  fireNotification,
} from '../lib/notifications'

const STORAGE_KEY = 'tend:reminders:v1'
const HEARTBEAT_MS = 6 * 60 * 60 * 1000 // re-check at least this often, in case the tab was asleep

function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { enabled: false, time: '19:00', lastFiredKey: null, ...JSON.parse(raw) }
  } catch (e) {
    console.warn('Failed to load reminder settings', e)
  }
  return { enabled: false, time: '19:00', lastFiredKey: null }
}

function saveSettings(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch (e) {
    console.warn('Failed to save reminder settings', e)
  }
}

function nextTargetFrom(now, time, pushToTomorrow) {
  const [h, m] = time.split(':').map(Number)
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (pushToTomorrow || target <= now) target.setDate(target.getDate() + 1)
  return target
}

// `openPillars` is the live list of pillar labels not yet done today —
// passed in fresh on every render and mirrored into a ref, so the
// setTimeout closure always reads the latest value without needing to be
// torn down and rebuilt every time a pillar gets checked off.
export function useReminders(openPillars) {
  const [settings, setSettings] = useState(loadSettings)
  const [permission, setPermission] = useState(getPermission())
  const openRef = useRef(openPillars)
  const timerRef = useRef(null)

  useEffect(() => {
    openRef.current = openPillars
  }, [openPillars])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const update = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    const result = await requestPermission()
    setPermission(result)
    return result
  }, [])

  const sendTest = useCallback(() => {
    fireNotification('Tend — signal check', {
      body: "Notifications are online. You'll get a nudge like this if a pillar is still open at your reminder time.",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'tend-test',
    })
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!settings.enabled || !isNotificationSupported() || Notification.permission !== 'granted') {
      return undefined
    }

    function scheduleNext(pushToTomorrow) {
      const now = new Date()
      const target = nextTargetFrom(now, settings.time, pushToTomorrow)
      const ms = Math.min(target - now, HEARTBEAT_MS)
      timerRef.current = setTimeout(checkAndFire, Math.max(ms, 1000))
    }

    function checkAndFire() {
      const now = new Date()
      const key = todayKey(now)
      const target = nextTargetFrom(now, settings.time, false)
      const reachedTime = target <= now || todayKey(target) !== key

      if (reachedTime && settings.lastFiredKey !== key) {
        const open = openRef.current
        if (open.length > 0) {
          fireNotification('Tend — still open today', {
            body: `${open.join(', ')} still need tending.`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'tend-daily-reminder',
          })
        }
        setSettings((prev) => ({ ...prev, lastFiredKey: key }))
        scheduleNext(true)
      } else {
        scheduleNext(false)
      }
    }

    checkAndFire()

    function onVisible() {
      if (document.visibilityState === 'visible') checkAndFire()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.enabled, settings.time, settings.lastFiredKey, permission])

  return {
    settings,
    update,
    permission,
    requestPermission: requestNotificationPermission,
    sendTest,
    supported: isNotificationSupported(),
  }
}
