import { useCallback, useEffect, useMemo, useState } from 'react'
import { PILLARS, SEED_TASKS } from '../data/defaultTasks'

const STORAGE_KEY = 'tend:v1'

function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyPillars() {
  const p = {}
  for (const pillar of PILLARS) {
    p[pillar.id] = pillar.isAmount ? { done: false, amount: '' } : { done: false, note: '' }
  }
  return p
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load tracker state', e)
  }
  return {
    recurringTasks: SEED_TASKS.map(({ id, text }) => ({ id, text })),
    days: {},
  }
}

// This hook is the single seam between the UI and storage.
// Today it persists to localStorage; swapping saveState/loadState for
// calls into a Google Apps Script web app (same pattern as
// sridhi-attendance2026's useSheetSynced) is a drop-in change — the
// shape of `state` below is deliberately a plain, sheet-friendly object.
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save tracker state', e)
  }
}

export function useTracker() {
  const [state, setState] = useState(loadState)
  const key = todayKey()

  useEffect(() => {
    saveState(state)
  }, [state])

  // Ensure today's record exists, seeded from recurring tasks.
  useEffect(() => {
    setState((prev) => {
      if (prev.days[key]) return prev
      const seededTasks = prev.recurringTasks.map((t) => ({
        id: t.id,
        text: t.text,
        done: false,
        recurring: true,
      }))
      return {
        ...prev,
        days: {
          ...prev.days,
          [key]: { pillars: emptyPillars(), tasks: seededTasks },
        },
      }
    })
  }, [key])

  const today = state.days[key] || { pillars: emptyPillars(), tasks: [] }

  const setPillar = useCallback(
    (pillarId, patch) => {
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(), tasks: [] }
        return {
          ...prev,
          days: {
            ...prev.days,
            [key]: {
              ...day,
              pillars: {
                ...day.pillars,
                [pillarId]: { ...day.pillars[pillarId], ...patch },
              },
            },
          },
        }
      })
    },
    [key]
  )

  const togglePillarDone = useCallback(
    (pillarId) => {
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(), tasks: [] }
        const current = day.pillars[pillarId]
        return {
          ...prev,
          days: {
            ...prev.days,
            [key]: {
              ...day,
              pillars: {
                ...day.pillars,
                [pillarId]: { ...current, done: !current.done },
              },
            },
          },
        }
      })
    },
    [key]
  )

  const addTask = useCallback(
    (text, recurring) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(), tasks: [] }
        const newTask = { id, text, done: false, recurring: !!recurring }
        const nextRecurring = recurring
          ? [...prev.recurringTasks, { id, text }]
          : prev.recurringTasks
        return {
          ...prev,
          recurringTasks: nextRecurring,
          days: {
            ...prev.days,
            [key]: { ...day, tasks: [...day.tasks, newTask] },
          },
        }
      })
    },
    [key]
  )

  const toggleTask = useCallback(
    (taskId) => {
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(), tasks: [] }
        return {
          ...prev,
          days: {
            ...prev.days,
            [key]: {
              ...day,
              tasks: day.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            },
          },
        }
      })
    },
    [key]
  )

  const removeTask = useCallback(
    (taskId) => {
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(), tasks: [] }
        return {
          ...prev,
          recurringTasks: prev.recurringTasks.filter((t) => t.id !== taskId),
          days: {
            ...prev.days,
            [key]: { ...day, tasks: day.tasks.filter((t) => t.id !== taskId) },
          },
        }
      })
    },
    [key]
  )

  // Consecutive days (ending today or yesterday) a pillar was completed.
  const streaks = useMemo(() => {
    const result = {}
    for (const pillar of PILLARS) {
      let count = 0
      let cursor = new Date()
      // If today isn't done yet, start counting from yesterday so the
      // streak doesn't look broken before the day is even over.
      if (!today.pillars[pillar.id]?.done) {
        cursor.setDate(cursor.getDate() - 1)
      }
      while (true) {
        const k = todayKey(cursor)
        const rec = state.days[k]
        if (rec && rec.pillars[pillar.id]?.done) {
          count += 1
          cursor.setDate(cursor.getDate() - 1)
        } else {
          break
        }
      }
      result[pillar.id] = count
    }
    return result
  }, [state.days, today])

  const completion = useMemo(() => {
    const pillarsDone = PILLARS.filter((p) => today.pillars[p.id]?.done).length
    const tasksTotal = today.tasks.length
    const tasksDone = today.tasks.filter((t) => t.done).length
    const totalUnits = PILLARS.length + tasksTotal
    const doneUnits = pillarsDone + tasksDone
    return {
      pillarsDone,
      pillarsTotal: PILLARS.length,
      tasksDone,
      tasksTotal,
      ratio: totalUnits === 0 ? 0 : doneUnits / totalUnits,
    }
  }, [today])

  // Last 7 days of pillar completion, oldest first — for the weekly trail.
  const weekTrail = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const k = todayKey(d)
      const rec = state.days[k]
      const doneCount = rec
        ? PILLARS.filter((p) => rec.pillars[p.id]?.done).length
        : 0
      days.push({ key: k, isToday: k === key, doneCount })
    }
    return days
  }, [state.days, key])

  return {
    today,
    setPillar,
    togglePillarDone,
    addTask,
    toggleTask,
    removeTask,
    streaks,
    completion,
    weekTrail,
  }
}
