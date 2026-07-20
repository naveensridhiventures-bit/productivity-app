import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CATEGORIES, DEFAULT_SUB_ITEMS, SEED_TASKS, DAILY_QUOTES } from '../data/defaultTasks'
import { getSyncUrl, setSyncUrl, fetchRemoteState, pushRemoteState } from '../lib/sheetSync'

// Bumped from v1 -> v2: pillars moved from a single done/note flag to
// calculated sub-items (exercises, meals, topics, goals). Old v1 data is
// intentionally not migrated — it was a much simpler shape.
const STORAGE_KEY = 'tend:v2'
const UPDATED_AT_KEY = 'tend:v2:updatedAt'

function loadUpdatedAt() {
  try {
    return Number(localStorage.getItem(UPDATED_AT_KEY)) || 0
  } catch (e) {
    return 0
  }
}

function saveUpdatedAt(ts) {
  try {
    localStorage.setItem(UPDATED_AT_KEY, String(ts))
  } catch (e) {
    // ignore
  }
}

function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyPillars(categories) {
  const p = {}
  for (const pillar of categories) {
    p[pillar.id] = { counts: {} }
  }
  return p
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // v2 data had no user-editable categories — seed them in place so
      // existing history keeps working with the new dynamic-categories UI.
      if (!parsed.categories || parsed.categories.length === 0) {
        parsed.categories = DEFAULT_CATEGORIES
      }
      return parsed
    }
  } catch (e) {
    console.warn('Failed to load tracker state', e)
  }
  return {
    categories: DEFAULT_CATEGORIES,
    recurringTasks: SEED_TASKS.map(({ id, text }) => ({ id, text })),
    subItemsConfig: {}, // pillarId -> array of custom sub-items (defaults merged in at read time)
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

// Merge default sub-items with any custom ones the user has added for a pillar.
function subItemsFor(pillarId, subItemsConfig) {
  const custom = subItemsConfig?.[pillarId] || []
  const defaults = DEFAULT_SUB_ITEMS[pillarId] || []
  return [...defaults, ...custom]
}

// A sub-item's own progress, clamped 0..1.
function itemRatio(count, target) {
  if (!target || target <= 0) return count > 0 ? 1 : 0
  return Math.min(1, (count || 0) / target)
}

// A pillar's overall completion — the weighted average of its sub-items'
// progress (weighted by target, so a 30-rep exercise counts more than a
// simple 1-tick checklist item, which feels right for "how done is this").
function pillarRatio(items, counts) {
  if (items.length === 0) return 0
  let weightSum = 0
  let scoreSum = 0
  for (const item of items) {
    const w = item.target || 1
    weightSum += w
    scoreSum += w * itemRatio(counts?.[item.id], item.target)
  }
  return weightSum === 0 ? 0 : scoreSum / weightSum
}

export function useTracker() {
  const [state, setState] = useState(loadState)
  const key = todayKey()
  const categories = state.categories && state.categories.length ? state.categories : DEFAULT_CATEGORIES

  // ---- Google Sheets sync (optional) ----
  // Everything still works fully offline on localStorage. If a sync URL is
  // configured, we additionally: pull on mount/tab-focus (replacing local
  // state only if the remote copy is newer), and debounce-push local edits
  // up to the sheet. Whole-state last-write-wins by `updatedAt` timestamp —
  // simple and predictable for a single person syncing across their own
  // couple of devices, at the cost of not merging concurrent edits.
  const [syncUrl, setSyncUrlState] = useState(getSyncUrl)
  const [syncStatus, setSyncStatus] = useState(syncUrl ? 'idle' : 'off')
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const updatedAtRef = useRef(loadUpdatedAt())
  const stateRef = useRef(state)
  const isRemoteUpdateRef = useRef(false)
  const readyRef = useRef(false)
  const pushTimerRef = useRef(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const pushNow = useCallback(async (nextState, url) => {
    if (!url) return
    setSyncStatus('syncing')
    try {
      const now = Date.now()
      updatedAtRef.current = now
      saveUpdatedAt(now)
      await pushRemoteState(url, nextState, now)
      setSyncStatus('synced')
      setLastSyncedAt(now)
    } catch (e) {
      console.warn('Sheet sync push failed', e)
      setSyncStatus('error')
    }
  }, [])

  const pullNow = useCallback(async (url) => {
    setSyncStatus('syncing')
    try {
      const remote = await fetchRemoteState(url)
      if (remote?.state && remote.updatedAt > updatedAtRef.current) {
        isRemoteUpdateRef.current = true
        updatedAtRef.current = remote.updatedAt
        saveUpdatedAt(remote.updatedAt)
        setState(remote.state)
      }
      setSyncStatus('synced')
      setLastSyncedAt(Date.now())
    } catch (e) {
      console.warn('Sheet sync pull failed', e)
      setSyncStatus('error')
    } finally {
      readyRef.current = true
    }
  }, [])

  // Point the app at a new (or no) Apps Script URL.
  const configureSync = useCallback((url) => {
    setSyncUrl(url)
    setSyncUrlState(url)
    readyRef.current = false
    setSyncStatus(url ? 'idle' : 'off')
  }, [])

  // Manual "sync now" — pull first (so a newer remote copy wins), then
  // push whatever's currently local in case there were pending edits.
  const syncNow = useCallback(async () => {
    if (!syncUrl) return
    await pullNow(syncUrl)
    await pushNow(stateRef.current, syncUrl)
  }, [syncUrl, pullNow, pushNow])

  // Initial pull, plus a re-pull whenever the tab regains focus — covers
  // "logged something on my phone, now opening the laptop" without needing
  // a manual refresh.
  useEffect(() => {
    if (!syncUrl) {
      readyRef.current = true
      return undefined
    }
    readyRef.current = false
    pullNow(syncUrl)
    function onVisible() {
      if (document.visibilityState === 'visible') pullNow(syncUrl)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [syncUrl, pullNow])

  // Persist locally on every change (always), and debounce a push to the
  // sheet (only once the initial pull has settled, and never for the
  // state change that the pull itself just caused).
  useEffect(() => {
    saveState(state)

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false
      return undefined
    }
    if (!syncUrl || !readyRef.current) return undefined

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(() => pushNow(state, syncUrl), 1500)
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    }
  }, [state, syncUrl, pushNow])

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
          [key]: { pillars: emptyPillars(categories), tasks: seededTasks },
        },
      }
    })
  }, [key])

  const today = state.days[key] || { pillars: emptyPillars(categories), tasks: [] }
  const subItemsConfig = state.subItemsConfig || {}

  const pillarItems = useMemo(() => {
    const map = {}
    for (const pillar of categories) {
      map[pillar.id] = subItemsFor(pillar.id, subItemsConfig)
    }
    return map
  }, [subItemsConfig, categories])

  // Set an exact count for one sub-item within a pillar, today.
  const setSubCount = useCallback(
    (pillarId, subId, count) => {
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(categories), tasks: [] }
        const pillar = day.pillars[pillarId] || { counts: {} }
        const clamped = Math.max(0, Math.round(count * 100) / 100)
        return {
          ...prev,
          days: {
            ...prev.days,
            [key]: {
              ...day,
              pillars: {
                ...day.pillars,
                [pillarId]: { counts: { ...pillar.counts, [subId]: clamped } },
              },
            },
          },
        }
      })
    },
    [key]
  )

  // Nudge a sub-item's count by its step (positive or negative).
  const bumpSubCount = useCallback(
    (pillarId, subId, delta) => {
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(categories), tasks: [] }
        const pillar = day.pillars[pillarId] || { counts: {} }
        const current = pillar.counts?.[subId] || 0
        const next = Math.max(0, Math.round((current + delta) * 100) / 100)
        return {
          ...prev,
          days: {
            ...prev.days,
            [key]: {
              ...day,
              pillars: {
                ...day.pillars,
                [pillarId]: { counts: { ...pillar.counts, [subId]: next } },
              },
            },
          },
        }
      })
    },
    [key]
  )

  // Add a custom sub-item (e.g. "Pull-ups") to a pillar. Persists across days.
  const addSubItem = useCallback((pillarId, { label, unit, target, step }) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setState((prev) => ({
      ...prev,
      subItemsConfig: {
        ...prev.subItemsConfig,
        [pillarId]: [
          ...(prev.subItemsConfig?.[pillarId] || []),
          { id, label, unit: unit || '', target: Number(target) || 1, step: Number(step) || 1, custom: true },
        ],
      },
    }))
  }, [])

  // Remove a custom sub-item. Default sub-items can't be removed, only edited.
  const removeSubItem = useCallback((pillarId, subId) => {
    setState((prev) => ({
      ...prev,
      subItemsConfig: {
        ...prev.subItemsConfig,
        [pillarId]: (prev.subItemsConfig?.[pillarId] || []).filter((i) => i.id !== subId),
      },
    }))
  }, [])

  // Change a sub-item's daily target (default or custom).
  const updateSubItemTarget = useCallback((pillarId, subId, target) => {
    setState((prev) => {
      const isCustom = (prev.subItemsConfig?.[pillarId] || []).some((i) => i.id === subId)
      if (isCustom) {
        return {
          ...prev,
          subItemsConfig: {
            ...prev.subItemsConfig,
            [pillarId]: prev.subItemsConfig[pillarId].map((i) =>
              i.id === subId ? { ...i, target: Number(target) || 1 } : i
            ),
          },
        }
      }
      // Overriding a default target — store it as a target-only override.
      return {
        ...prev,
        targetOverrides: {
          ...(prev.targetOverrides || {}),
          [pillarId]: { ...(prev.targetOverrides?.[pillarId] || {}), [subId]: Number(target) || 1 },
        },
      }
    })
  }, [])

  // Add a brand-new main category (e.g. "Meditation"). Starts with no
  // sub-items — the person builds it out with "+ Add sub-category" just
  // like the defaults.
  const addCategory = useCallback(({ label, tagline, icon, accent }) => {
    const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setState((prev) => {
      const base = prev.categories && prev.categories.length ? prev.categories : DEFAULT_CATEGORIES
      return {
        ...prev,
        categories: [
          ...base,
          {
            id,
            label: label || 'New category',
            tagline: tagline || '',
            icon: icon || 'star',
            accent: accent || 'core',
            custom: true,
          },
        ],
      }
    })
    return id
  }, [])

  // Rename / restyle any category, default or custom.
  const updateCategory = useCallback((categoryId, patch) => {
    setState((prev) => {
      const base = prev.categories && prev.categories.length ? prev.categories : DEFAULT_CATEGORIES
      return {
        ...prev,
        categories: base.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)),
      }
    })
  }, [])

  // Remove a category entirely (default or custom). Past logged history for
  // it stays in storage untouched — it just stops appearing going forward.
  const removeCategory = useCallback((categoryId) => {
    setState((prev) => {
      const base = prev.categories && prev.categories.length ? prev.categories : DEFAULT_CATEGORIES
      return {
        ...prev,
        categories: base.filter((c) => c.id !== categoryId),
      }
    })
  }, [])

  const addTask = useCallback(
    (text, recurring) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(categories), tasks: [] }
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
        const day = prev.days[key] || { pillars: emptyPillars(categories), tasks: [] }
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
        const day = prev.days[key] || { pillars: emptyPillars(categories), tasks: [] }
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

  // Apply any target overrides on top of the merged default+custom items.
  const effectiveItems = useCallback(
    (pillarId) => {
      const overrides = state.targetOverrides?.[pillarId] || {}
      return pillarItems[pillarId].map((item) =>
        overrides[item.id] != null ? { ...item, target: overrides[item.id] } : item
      )
    },
    [pillarItems, state.targetOverrides]
  )

  // Today's ratio (0..1) and done flag per pillar, calculated from sub-items.
  const pillarProgress = useMemo(() => {
    const result = {}
    for (const pillar of categories) {
      const items = effectiveItems(pillar.id)
      const counts = today.pillars[pillar.id]?.counts || {}
      const ratio = pillarRatio(items, counts)
      result[pillar.id] = { ratio, done: ratio >= 1, items, counts }
    }
    return result
  }, [today, effectiveItems])

  // Consecutive days (ending today or yesterday) a pillar was fully completed.
  const streaks = useMemo(() => {
    const result = {}
    for (const pillar of categories) {
      const items = effectiveItems(pillar.id)
      let count = 0
      let cursor = new Date()
      const todayDone = pillarProgress[pillar.id].done
      if (!todayDone) {
        cursor.setDate(cursor.getDate() - 1)
      }
      while (true) {
        const k = todayKey(cursor)
        const rec = state.days[k]
        if (rec && pillarRatio(items, rec.pillars[pillar.id]?.counts) >= 1) {
          count += 1
          cursor.setDate(cursor.getDate() - 1)
        } else {
          break
        }
      }
      result[pillar.id] = count
    }
    return result
  }, [state.days, pillarProgress, effectiveItems])

  const completion = useMemo(() => {
    const pillarsDone = categories.filter((p) => pillarProgress[p.id].done).length
    const pillarRatioSum = categories.reduce((sum, p) => sum + pillarProgress[p.id].ratio, 0)
    const tasksTotal = today.tasks.length
    const tasksDone = today.tasks.filter((t) => t.done).length
    const totalUnits = categories.length + tasksTotal
    const doneUnits = pillarRatioSum + tasksDone
    return {
      pillarsDone,
      pillarsTotal: categories.length,
      tasksDone,
      tasksTotal,
      ratio: totalUnits === 0 ? 0 : doneUnits / totalUnits,
    }
  }, [today, pillarProgress])

  // Last 7 days of pillar completion, oldest first — for the weekly trail.
  const weekTrail = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const k = todayKey(d)
      const rec = state.days[k]
      const doneCount = rec
        ? categories.filter((p) => pillarRatio(effectiveItems(p.id), rec.pillars[p.id]?.counts) >= 1).length
        : 0
      days.push({ key: k, isToday: k === key, doneCount })
    }
    return days
  }, [state.days, key, effectiveItems])

  const quote = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000)
    return DAILY_QUOTES[dayIndex % DAILY_QUOTES.length]
  }, [])

  const allPillarsDone = categories.every((p) => pillarProgress[p.id].done)

  // Attach a photo (e.g. a Cloudinary URL) to a pillar for today. Used by
  // the "Daily Snapshot" panel — purely optional visual evidence per pillar.
  const setPillarPhoto = useCallback(
    (pillarId, photo) => {
      setState((prev) => {
        const day = prev.days[key] || { pillars: emptyPillars(categories), tasks: [] }
        const pillar = day.pillars[pillarId] || { counts: {} }
        return {
          ...prev,
          days: {
            ...prev.days,
            [key]: {
              ...day,
              pillars: {
                ...day.pillars,
                [pillarId]: { ...pillar, photo: photo || null },
              },
            },
          },
        }
      })
    },
    [key]
  )

  // Exposes effective (default + custom + overrides) sub-items for any
  // pillar — needed by the report generator so downloads match what's
  // actually shown on screen.
  const itemsForPillar = useCallback((pillarId) => effectiveItems(pillarId), [effectiveItems])

  return {
    today,
    todayKey: key,
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    pillarProgress,
    setSubCount,
    bumpSubCount,
    addSubItem,
    removeSubItem,
    updateSubItemTarget,
    addTask,
    toggleTask,
    removeTask,
    streaks,
    completion,
    weekTrail,
    quote,
    allPillarsDone,
    setPillarPhoto,
    itemsForPillar,
    history: state.days, // full day-by-day history, for weekly/monthly reports
    rawState: state, // entire persisted object, for full JSON backup/export
    sync: {
      url: syncUrl,
      configure: configureSync,
      status: syncStatus,
      lastSyncedAt,
      syncNow,
    },
  }
}
