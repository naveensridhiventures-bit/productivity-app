import * as XLSX from 'xlsx'

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

/**
 * Export every logged day to a real .xlsx workbook — every category's daily
 * completion %, every sub-item's raw counts, and the day's tasks — so the
 * data lives somewhere durable and Excel-native, not just in the browser.
 */
export function exportExcelWorkbook({ categories, itemsForPillar, history }) {
  const wb = XLSX.utils.book_new()
  const days = Object.keys(history).sort()

  // ---- Overview sheet: one row per day, one column per category (%) ----
  const overviewRows = days.map((day) => {
    const rec = history[day]
    const row = { Date: day }
    for (const cat of categories) {
      const items = itemsForPillar(cat.id)
      const ratio = pillarRatioLocal(items, rec.pillars?.[cat.id]?.counts)
      row[cat.label] = Math.round(ratio * 100)
    }
    const tasks = rec.tasks || []
    row['Tasks done'] = tasks.filter((t) => t.done).length
    row['Tasks total'] = tasks.length
    return row
  })
  const overviewSheet = XLSX.utils.json_to_sheet(overviewRows)
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview')

  // ---- One sheet per category: day, each sub-item's logged count, % ----
  for (const cat of categories) {
    const items = itemsForPillar(cat.id)
    const rows = days.map((day) => {
      const rec = history[day]
      const counts = rec.pillars?.[cat.id]?.counts || {}
      const row = { Date: day }
      for (const item of items) {
        row[`${item.label}${item.unit ? ` (${item.unit})` : ''}`] = counts[item.id] || 0
      }
      row['Completion %'] = Math.round(pillarRatioLocal(items, counts) * 100)
      return row
    })
    const sheet = XLSX.utils.json_to_sheet(rows)
    // Sheet names max 31 chars, no special characters.
    const sheetName = cat.label.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || cat.id
    XLSX.utils.book_append_sheet(wb, sheet, sheetName)
  }

  // ---- Tasks sheet: every task logged on every day ----
  const taskRows = []
  for (const day of days) {
    const tasks = history[day].tasks || []
    for (const t of tasks) {
      taskRows.push({ Date: day, Task: t.text, Done: t.done ? 'Yes' : 'No', Recurring: t.recurring ? 'Yes' : 'No' })
    }
  }
  const taskSheet = XLSX.utils.json_to_sheet(taskRows)
  XLSX.utils.book_append_sheet(wb, taskSheet, 'Tasks')

  XLSX.writeFile(wb, `tend-data-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
