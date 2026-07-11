import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isNotificationSupported,
  getPermission,
  requestPermission,
  fireNotification,
} from '../lib/notifications'

// Bumped from v1 -> v2: one global time -> one time per pillar.
const STORAGE_KEY = 'tend:reminders:v2'
const HEARTBEAT_MS = 6 * 60 * 60 * 1000 // re-check at least this often, in case the tab was asleep

// Sensible defaults — morning workout, midday food check, evening
// learning, end-of-day savings. All start disabled; the person opts each
// one in individually.
const DEFAULT_PILLAR_TIMES = {
  workout: '07:00',
  food: '13:00',
  learning: '18:00',
  savings: '21:00',
}

function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function normalizeSettings(partial) {
  const pillars = {}
  for (const id of Object.keys(DEFAULT_PILLAR_TIMES)) {
    const existing = partial?.pillars?.[id] || {}
    pillars[id] = {
      enabled: existing.enabled ?? false,
      time: existing.time || DEFAULT_PILLAR_TIMES[id],
    }
  }
  return { pillars, lastFiredKeys: partial?.lastFiredKeys || {} }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeSettings(JSON.parse(raw))
  } catch (e) {
    console.warn('Failed to load reminder settings', e)
  }
  return normalizeSettings({})
}

function saveSettings(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch (e) {
    console.warn('Failed to save reminder settings', e)
  }
}

function todayTarget(now, time) {
  const [h, m] = time.split(':').map(Number)
  const t = new Date(now)
  t.setHours(h, m, 0, 0)
  return t
}

// `pillars` is the live [{ id, label, done }] list — passed fresh on every
// render and mirrored into a ref, so the setTimeout closure always reads
// today's actual completion state without needing to be rebuilt constantly.
export function useReminders(pillars) {
  const [settings, setSettings] = useState(loadSettings)
  const [permission, setPermission] = useState(getPermission())
  const pillarsRef = useRef(pillars)
  const timerRef = useRef(null)

  useEffect(() => {
    pillarsRef.current = pillars
  }, [pillars])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const updatePillar = useCallback((pillarId, patch) => {
    setSettings((prev) => ({
      ...prev,
      pillars: { ...prev.pillars, [pillarId]: { ...prev.pillars[pillarId], ...patch } },
    }))
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    const result = await requestPermission()
    setPermission(result)
    return result
  }, [])

  const sendTest = useCallback(() => {
    fireNotification('Tend — signal check', {
      body: "Notifications are online. Each pillar you arm will nudge you at its own time if it's still open.",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'tend-test',
    })
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const anyEnabled = Object.values(settings.pillars).some((p) => p.enabled)
    if (!anyEnabled || !isNotificationSupported() || Notification.permission !== 'granted') {
      return undefined
    }

    function checkAndFire() {
      const now = new Date()
      const key = todayKey(now)

      Object.entries(settings.pillars).forEach(([pillarId, cfg]) => {
        if (!cfg.enabled) return
        const target = todayTarget(now, cfg.time)
        const reached = now >= target
        const alreadyFired = settings.lastFiredKeys[pillarId] === key
        if (!reached || alreadyFired) return

        const pillar = pillarsRef.current.find((p) => p.id === pillarId)
        if (pillar && !pillar.done) {
          fireNotification(`Tend — ${pillar.label} still open`, {
            body: `Past your ${cfg.time} check-in and ${pillar.label.toLowerCase()} isn't done yet.`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `tend-reminder-${pillarId}`,
          })
        }
        setSettings((prev) => ({
          ...prev,
          lastFiredKeys: { ...prev.lastFiredKeys, [pillarId]: key },
        }))
      })

      scheduleNext()
    }

    function scheduleNext() {
      const now = new Date()
      const key = todayKey(now)
      let soonest = null

      Object.entries(settings.pillars).forEach(([pillarId, cfg]) => {
        if (!cfg.enabled) return
        const firedToday = settings.lastFiredKeys[pillarId] === key
        let target = todayTarget(now, cfg.time)
        if (firedToday || target <= now) target = new Date(target.getTime() + 24 * 60 * 60 * 1000)
        if (!soonest || target < soonest) soonest = target
      })

      if (!soonest) return
      const ms = Math.min(soonest - now, HEARTBEAT_MS)
      timerRef.current = setTimeout(checkAndFire, Math.max(ms, 1000))
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
  }, [settings, permission])

  return {
    settings,
    updatePillar,
    permission,
    requestPermission: requestNotificationPermission,
    sendTest,
    supported: isNotificationSupported(),
  }
}
