import { jsPDF } from 'jspdf'
import { PILLARS } from '../data/defaultTasks'

const INK = [16, 24, 32]
const CORE = [15, 130, 168]
const MUTED = [110, 130, 140]
const LINE = [210, 220, 224]

function fmt(n) {
  if (n == null) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function fmtDate(d = new Date()) {
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ---- shared page chrome -------------------------------------------------

function newDoc(title, subtitle) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...INK)
  doc.rect(0, 0, pageWidth, 78, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('TEND', 40, 34)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(150, 220, 235)
  doc.text('J.A.R.V.I.S. DAILY-PRACTICE REPORT', 40, 50)

  doc.setFontSize(9)
  doc.setTextColor(190, 200, 205)
  doc.text(title, 40, 65)
  if (subtitle) doc.text(subtitle, pageWidth - 40, 65, { align: 'right' })

  return { doc, pageWidth, y: 100 }
}

function sectionHeading(doc, text, x, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...CORE)
  doc.text(text.toUpperCase(), x, y)
  doc.setDrawColor(...CORE)
  doc.setLineWidth(1)
  doc.line(x, y + 4, x + 60, y + 4)
  return y + 20
}

function keyValRow(doc, label, value, x, y, width) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(label, x, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...INK)
  doc.text(String(value), x + width, y)
  return y + 16
}

function pillarTable(doc, items, counts, x, y, width) {
  doc.setDrawColor(...LINE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text('SUB-CATEGORY', x, y)
  doc.text('LOGGED', x + width * 0.5, y)
  doc.text('TARGET', x + width * 0.68, y)
  doc.text('%', x + width * 0.9, y)
  y += 6
  doc.line(x, y, x + width, y)
  y += 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const item of items) {
    const count = counts?.[item.id] || 0
    const pct = Math.min(100, Math.round((count / (item.target || 1)) * 100))
    doc.setTextColor(...INK)
    doc.text(String(item.label), x, y)
    doc.setTextColor(...MUTED)
    doc.text(`${fmt(count)}${item.unit ? ' ' + item.unit : ''}`, x + width * 0.5, y)
    doc.text(`${fmt(item.target)}${item.unit ? ' ' + item.unit : ''}`, x + width * 0.68, y)
    doc.setTextColor(pct >= 100 ? 30 : 160, pct >= 100 ? 140 : 100, pct >= 100 ? 90 : 40)
    doc.text(`${pct}%`, x + width * 0.9, y)
    y += 16
  }
  return y + 6
}

function footer(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`Generated ${new Date().toLocaleString('en-IN')} · Tend`, 40, h - 24)
    doc.text(`Page ${i} of ${pageCount}`, w - 40, h - 24, { align: 'right' })
  }
}

// ---- report builders -----------------------------------------------------

/** Full report: every pillar + every sub-category + today's tasks. */
export function exportDailyReport({ pillarProgress, itemsForPillar, streaks, today, completion }) {
  const { doc, pageWidth } = newDoc('Full Daily Report', fmtDate())
  let y = 100
  const x = 40
  const width = pageWidth - 80

  y = keyValRow(doc, 'Overall completion today', `${Math.round(completion.ratio * 100)}%`, x, y, 220)
  y = keyValRow(doc, 'Pillars completed', `${completion.pillarsDone} / ${completion.pillarsTotal}`, x, y, 220)
  y = keyValRow(doc, 'Tasks completed', `${completion.tasksDone} / ${completion.tasksTotal}`, x, y, 220)
  y += 10

  for (const pillar of PILLARS) {
    const progress = pillarProgress[pillar.id]
    const items = itemsForPillar(pillar.id)
    if (y > 680) { doc.addPage(); y = 60 }
    y = sectionHeading(doc, `${pillar.label} — ${Math.round(progress.ratio * 100)}% · streak ${streaks[pillar.id]}d`, x, y)
    y = pillarTable(doc, items, progress.counts, x, y, width)
    y += 8
  }

  if (y > 650) { doc.addPage(); y = 60 }
  y = sectionHeading(doc, "Today's tasks", x, y)
  if (today.tasks.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text('No tasks logged for today.', x, y)
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    for (const t of today.tasks) {
      doc.setTextColor(...INK)
      doc.text(`${t.done ? '[x]' : '[ ]'} ${t.text}${t.recurring ? '  (daily)' : ''}`, x, y)
      y += 15
    }
  }

  footer(doc)
  doc.save(`tend-full-report-${today && new Date().toISOString().slice(0, 10)}.pdf`)
}

/** Single pillar + its sub-categories only. */
export function exportPillarReport(pillar, progress, streak, items) {
  const { doc, pageWidth } = newDoc(`${pillar.label} Report`, fmtDate())
  let y = 100
  const x = 40
  const width = pageWidth - 80

  y = keyValRow(doc, 'Completion today', `${Math.round(progress.ratio * 100)}%`, x, y, 220)
  y = keyValRow(doc, 'Current streak', `${streak} day${streak === 1 ? '' : 's'}`, x, y, 220)
  y = keyValRow(doc, 'Status', progress.done ? 'Complete' : 'In progress', x, y, 220)
  y += 10

  y = sectionHeading(doc, 'Sub-categories', x, y)
  y = pillarTable(doc, items, progress.counts, x, y, width)

  footer(doc)
  doc.save(`tend-${pillar.id}-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/** 7-day rollup across all pillars, using the tracker's raw history object. */
export function exportWeeklyReport({ history, itemsForPillar, weekTrail }) {
  const { doc, pageWidth } = newDoc('7-Day Report', fmtDate())
  let y = 100
  const x = 40
  const width = pageWidth - 80

  y = sectionHeading(doc, 'Daily completion overview', x, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const day of weekTrail) {
    doc.setTextColor(...MUTED)
    doc.text(day.key, x, y)
    doc.setTextColor(...INK)
    doc.text(`${day.doneCount} / ${PILLARS.length} pillars complete${day.isToday ? '  (today)' : ''}`, x + 120, y)
    y += 15
  }
  y += 10

  for (const pillar of PILLARS) {
    if (y > 650) { doc.addPage(); y = 60 }
    y = sectionHeading(doc, `${pillar.label} — 7-day sub-category totals`, x, y)
    const items = itemsForPillar(pillar.id)
    const totals = {}
    for (const day of weekTrail) {
      const rec = history[day.key]
      const counts = rec?.pillars?.[pillar.id]?.counts || {}
      for (const item of items) {
        totals[item.id] = (totals[item.id] || 0) + (counts[item.id] || 0)
      }
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    for (const item of items) {
      doc.setTextColor(...INK)
      doc.text(String(item.label), x, y)
      doc.setTextColor(...MUTED)
      doc.text(`${fmt(totals[item.id] || 0)}${item.unit ? ' ' + item.unit : ''} total this week`, x + width * 0.5, y)
      y += 15
    }
    y += 8
  }

  footer(doc)
  doc.save(`tend-weekly-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/** Raw JSON export of all locally stored data — full backup / portability. */
export function exportJSONBackup(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tend-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
