// Pure number-crunching for the Analytics dashboard — no React, no DOM,
// so it's easy to unit-reason about and reuse from the Excel export too.

function itemRatioLocal(count, target) {
  if (!target || target <= 0) return count > 0 ? 1 : 0
  return Math.min(1, (count || 0) / target)
}

function pillarRatioLocal(items, counts) {
  if (!items || items.length === 0) return 0
  let weightSum = 0
  let scoreSum = 0
  for (const item of items) {
    const w = item.target || 1
    weightSum += w
    scoreSum += w * itemRatioLocal(counts?.[item.id], item.target)
  }
  return weightSum === 0 ? 0 : scoreSum / weightSum
}

function sortedKeysInRange(history, days) {
  const keys = Object.keys(history).sort()
  if (!days) return keys
  return keys.slice(Math.max(0, keys.length - days))
}

/**
 * Per-category stats over the last `days` logged days:
 * average completion %, best/worst day, and a trend (comparing the first
 * half of the window against the second half).
 */
export function computeCategoryStats(categories, itemsForPillar, history, days = 30) {
  const keys = sortedKeysInRange(history, days)
  const half = Math.floor(keys.length / 2)
  const firstHalf = keys.slice(0, half)
  const secondHalf = keys.slice(half)

  return categories.map((cat) => {
    const items = itemsForPillar(cat.id)
    const ratios = keys.map((k) => pillarRatioLocal(items, history[k]?.pillars?.[cat.id]?.counts))
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

    const overallAvg = avg(ratios)
    const firstAvg = avg(firstHalf.map((k) => pillarRatioLocal(items, history[k]?.pillars?.[cat.id]?.counts)))
    const secondAvg = avg(secondHalf.map((k) => pillarRatioLocal(items, history[k]?.pillars?.[cat.id]?.counts)))
    const daysCompleted = ratios.filter((r) => r >= 1).length

    return {
      id: cat.id,
      label: cat.label,
      accent: cat.accent,
      avgPct: Math.round(overallAvg * 100),
      daysCompleted,
      daysLogged: keys.length,
      trend: secondAvg - firstAvg, // positive = improving, negative = slipping
      series: keys.map((k, i) => ({ date: k, pct: Math.round(ratios[i] * 100) })),
    }
  })
}

/** Overall completion (all categories + tasks combined) per day, for a trend line. */
export function computeDailyTrend(categories, itemsForPillar, history, days = 30) {
  const keys = sortedKeysInRange(history, days)
  return keys.map((k) => {
    const rec = history[k]
    if (!rec) return { date: k, pct: 0 }
    const cats = categories.map((cat) =>
      pillarRatioLocal(itemsForPillar(cat.id), rec.pillars?.[cat.id]?.counts)
    )
    const catAvg = cats.length ? cats.reduce((a, b) => a + b, 0) / cats.length : 0
    const tasks = rec.tasks || []
    const taskRatio = tasks.length ? tasks.filter((t) => t.done).length / tasks.length : null
    const combined = taskRatio == null ? catAvg : (catAvg + taskRatio) / 2
    return { date: k, pct: Math.round(combined * 100) }
  })
}

/** Human-readable callouts: strongest area, weakest area, trend direction, consistency. */
export function buildInsightMessages(categoryStats) {
  if (categoryStats.length === 0) {
    return ['Log a few days across your categories and insights will show up here.']
  }
  const withData = categoryStats.filter((c) => c.daysLogged > 0)
  if (withData.length === 0) {
    return ['No logged days yet — start checking things off and this panel fills in automatically.']
  }

  const strongest = [...withData].sort((a, b) => b.avgPct - a.avgPct)[0]
  const weakest = [...withData].sort((a, b) => a.avgPct - b.avgPct)[0]
  const improving = [...withData].sort((a, b) => b.trend - a.trend)[0]
  const slipping = [...withData].sort((a, b) => a.trend - b.trend)[0]

  const messages = []
  messages.push(`💪 Strongest area: ${strongest.label} at ${strongest.avgPct}% average completion.`)
  if (weakest.id !== strongest.id) {
    messages.push(`🎯 Room to grow: ${weakest.label} is your lowest at ${weakest.avgPct}% — a good place to focus next.`)
  }
  if (improving.trend > 0.05) {
    messages.push(`📈 ${improving.label} is trending up recently — keep the momentum.`)
  }
  if (slipping.trend < -0.05 && slipping.id !== improving.id) {
    messages.push(`📉 ${slipping.label} has slipped compared to earlier — worth a check-in.`)
  }
  return messages
}
