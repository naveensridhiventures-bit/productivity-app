import { useCallback, useEffect, useRef, useState } from 'react'
import { isNotificationSupported, getPermission, fireNotification } from '../lib/notifications'
import { playRingtone } from '../lib/ringtones'

const STORAGE_KEY = 'tend:alarms:v1'
const HEARTBEAT_MS = 60 * 1000 // re-check at least once a minute

function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function loadAlarms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load alarms', e)
  }
  return []
}

function saveAlarms(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('Failed to save alarms', e)
  }
}

function targetFor(now, time) {
  const [h, m] = time.split(':').map(Number)
  const t = new Date(now)
  t.setHours(h, m, 0, 0)
  return t
}

// General-purpose alarms — a name, a note, a time, a ringtone. Independent
// of the daily-pillar tracking; this is closer to a phone's alarm clock,
// just themed to match the rest of the app.
export function useAlarms() {
  const [alarms, setAlarms] = useState(loadAlarms)
  const [permission, setPermission] = useState(getPermission())
  const [activeAlarm, setActiveAlarm] = useState(null) // the alarm currently popped up, if any
  const stopSoundRef = useRef(null)
  const timerRef = useRef(null)
  const alarmsRef = useRef(alarms)

  useEffect(() => {
    alarmsRef.current = alarms
  }, [alarms])

  useEffect(() => {
    saveAlarms(alarms)
  }, [alarms])

  const addAlarm = useCallback((alarm) => {
    const id = `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setAlarms((prev) => [
      ...prev,
      {
        id,
        label: alarm.label || 'Alarm',
        note: alarm.note || '',
        time: alarm.time || '08:00',
        ringtone: alarm.ringtone || 'chime',
        enabled: true,
        lastFiredKey: null,
        snoozeUntil: null,
      },
    ])
    return id
  }, [])

  const updateAlarm = useCallback((id, patch) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }, [])

  const removeAlarm = useCallback((id) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleAlarm = useCallback((id, enabled) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)))
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if (!isNotificationSupported()) return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const stopRinging = useCallback(() => {
    if (stopSoundRef.current) {
      stopSoundRef.current()
      stopSoundRef.current = null
    }
  }, [])

  const dismiss = useCallback(() => {
    stopRinging()
    setActiveAlarm(null)
  }, [stopRinging])

  const snooze = useCallback(
    (minutes = 5) => {
      if (activeAlarm) {
        const until = Date.now() + minutes * 60 * 1000
        updateAlarm(activeAlarm.id, { snoozeUntil: until })
      }
      stopRinging()
      setActiveAlarm(null)
    },
    [activeAlarm, updateAlarm, stopRinging]
  )

  // The scheduling loop — same shape as useReminders, generalized to an
  // arbitrary list of alarms instead of the four fixed pillars.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const anyEnabled = alarms.some((a) => a.enabled)
    if (!anyEnabled) return undefined

    function checkAndFire() {
      const now = new Date()
      const key = todayKey(now)

      for (const alarm of alarmsRef.current) {
        if (!alarm.enabled) continue
        if (alarm.snoozeUntil && now.getTime() < alarm.snoozeUntil) continue

        const target = alarm.snoozeUntil && now.getTime() >= alarm.snoozeUntil
          ? new Date(alarm.snoozeUntil)
          : targetFor(now, alarm.time)
        const reached = now >= target
        const alreadyFired = !alarm.snoozeUntil && alarm.lastFiredKey === key
        if (!reached || alreadyFired) continue

        setActiveAlarm(alarm)
        stopRinging()
        stopSoundRef.current = playRingtone(alarm.ringtone)

        if (isNotificationSupported() && Notification.permission === 'granted') {
          fireNotification(`⏰ ${alarm.label}`, {
            body: alarm.note || 'Alarm is ringing.',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `tend-alarm-${alarm.id}`,
          })
        }

        updateAlarm(alarm.id, { lastFiredKey: key, snoozeUntil: null })
        break // one popup at a time, in case two alarms land together
      }

      timerRef.current = setTimeout(checkAndFire, HEARTBEAT_MS)
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
  }, [alarms])

  return {
    alarms,
    addAlarm,
    updateAlarm,
    removeAlarm,
    toggleAlarm,
    permission,
    requestPermission: requestNotificationPermission,
    supported: isNotificationSupported(),
    activeAlarm,
    dismiss,
    snooze,
  }
}
