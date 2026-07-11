import { useCallback, useEffect, useMemo, useState } from 'react'
import { PILLARS, FOOD_ITEMS, SEED_TASKS, DEFAULT_GOALS } from '../data/defaultTasks'

const STORAGE_KEY = 'tend:v2'

function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyFoodItems() {
  const items = {}
  for (const f of FOOD_ITEMS) items[f.id] = false
  return items
}

function emptyPillars() {
  const p = {}
  for (const pillar of PILLARS) {
    if (pillar.isChecklist) p[pillar.id] = { items: emptyFoodItems() }
    else if (pillar.isAmount) p[pillar.id] = { done: false, amount: '' }
    else p[pillar.id] = { done: false, note: '' }
  }
  return p
}

// A pillar counts as "done" for the day — food derives from its checklist,
// savings from a positive amount, others from the explicit toggle.
export function isPillarDone(pillar, value) {
  if (!value) return false
  if (pillar.isChecklist) return Object.values(value.items || {}).every(Boolean)
  if (pillar.isAmount) return Number(value.amount) > 0
  return !!value.done
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { goals: DEFAULT_GOALS, ...parsed }
    }
  } catch (e) {
    console.warn('Failed to load tracker state', e)
  }
  return {
    recurringTasks: SEED_TASKS.map(({ id, text }) => ({ id, text })),
    days: {},
    goals: DEFAULT_GOALS,
  }
}

// This hook is the single seam between the UI and storage.
// Today it persists to localStorage; swapping saveState/loadState for
// calls into a Google Apps Script web app (same pattern as
// sridhi-attendance2026's useSheetSynced) is a drop-in change.
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save tracker state', e)
  }
}

function startOfWeek(d) {
  const date = new Date(d)
  const day = date.getDay() // 0 = Sunday
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
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
  const goals = state.goals || DEFAULT_GOALS

  const withDay = useCallback(
    (updater) => {
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(), tasks: [] }
        return { ...prev, days: { ...prev.days, [key]: updater(day) } }
      })
    },
    [key]
  )

  const setPillar = useCallback(
    (pillarId, patch) => {
      withDay((day) => ({
        ...day,
        pillars: {
          ...day.pillars,
          [pillarId]: { ...day.pillars[pillarId], ...patch },
        },
      }))
    },
    [withDay]
  )

  const togglePillarDone = useCallback(
    (pillarId) => {
      withDay((day) => {
        const current = day.pillars[pillarId]
        return {
          ...day,
          pillars: {
            ...day.pillars,
            [pillarId]: { ...current, done: !current.done },
          },
        }
      })
    },
    [withDay]
  )

  const toggleFoodItem = useCallback(
    (itemId) => {
      withDay((day) => {
        const current = day.pillars.food
        return {
          ...day,
          pillars: {
            ...day.pillars,
            food: { items: { ...current.items, [itemId]: !current.items[itemId] } },
          },
        }
      })
    },
    [withDay]
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
          days: { ...prev.days, [key]: { ...day, tasks: [...day.tasks, newTask] } },
        }
      })
    },
    [key]
  )

  const toggleTask = useCallback(
    (taskId) => {
      withDay((day) => ({
        ...day,
        tasks: day.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      }))
    },
    [withDay]
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

  const setGoal = useCallback((pillarId, patch) => {
    setState((prev) => ({
      ...prev,
      goals: { ...prev.goals, [pillarId]: { ...prev.goals[pillarId], ...patch } },
    }))
  }, [])

  // Consecutive days (ending today or yesterday) a pillar was completed.
  const streaks = useMemo(() => {
    const result = {}
    for (const pillar of PILLARS) {
      let count = 0
      let cursor = new Date()
      const todayDone = isPillarDone(pillar, today.pillars[pillar.id])
      if (!todayDone) cursor.setDate(cursor.getDate() - 1)
      while (true) {
        const k = todayKey(cursor)
        const rec = state.days[k]
        if (rec && isPillarDone(pillar, rec.pillars[pillar.id])) {
          count += 1
          cursor.setDate(cursor.getDate() - 1)
        } else break
      }
      result[pillar.id] = count
    }
    return result
  }, [state.days, today])

  const completion = useMemo(() => {
    const pillarsDone = PILLARS.filter((p) => isPillarDone(p, today.pillars[p.id])).length
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
      isComplete: totalUnits > 0 && doneUnits === totalUnits,
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
        ? PILLARS.filter((p) => isPillarDone(p, rec.pillars[p.id])).length
        : 0
      days.push({ key: k, isToday: k === key, doneCount })
    }
    return days
  }, [state.days, key])

  // How many days this week (Sun-Sat) workout/learning were completed.
  const weeklyProgress = useMemo(() => {
    const start = startOfWeek(new Date())
    const result = {}
    for (const pillar of PILLARS) {
      if (!pillar.hasWeeklyTarget) continue
      let count = 0
      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        if (d > new Date()) continue
        const rec = state.days[todayKey(d)]
        if (rec && isPillarDone(pillar, rec.pillars[pillar.id])) count += 1
      }
      result[pillar.id] = count
    }
    return result
  }, [state.days])

  // Sum of savings logged so far this calendar month.
  const monthlySavings = useMemo(() => {
    const now = new Date()
    let total = 0
    for (const [k, rec] of Object.entries(state.days)) {
      const d = new Date(k)
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        total += Number(rec.pillars?.savings?.amount) || 0
      }
    }
    return total
  }, [state.days])

  // Grid data for the month heatmap in History — one entry per day of the
  // given month, doneCount 0-4.
  const getMonthGrid = useCallback(
    (year, month) => {
      const firstDay = new Date(year, month, 1)
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const grid = []
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
        const k = todayKey(date)
        const rec = state.days[k]
        const doneCount = rec
          ? PILLARS.filter((p) => isPillarDone(p, rec.pillars[p.id])).length
          : 0
        grid.push({ key: k, date: d, weekday: date.getDay(), doneCount, isFuture: date > new Date() })
      }
      return { grid, leadingBlank: firstDay.getDay() }
    },
    [state.days]
  )

  return {
    today,
    goals,
    setPillar,
    togglePillarDone,
    toggleFoodItem,
    addTask,
    toggleTask,
    removeTask,
    setGoal,
    streaks,
    completion,
    weekTrail,
    weeklyProgress,
    monthlySavings,
    getMonthGrid,
  }
}
