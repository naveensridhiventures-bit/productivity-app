import { useState } from 'react'
import { PILLARS } from '../data/defaultTasks'
import {
  exportDailyReport,
  exportPillarReport,
  exportWeeklyReport,
  exportRangeReport,
  exportJSONBackup,
} from '../lib/report'

function toKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function mondayOf(d) {
  const day = d.getDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return monday
}

export default function Reports({
  pillarProgress,
  itemsForPillar,
  streaks,
  today,
  completion,
  history,
  weekTrail,
  rawState,
}) {
  const todayStr = toKey(new Date())
  const [from, setFrom] = useState(todayStr)
  const [to, setTo] = useState(todayStr)

  function applyPreset(preset) {
    const now = new Date()
    if (preset === 'today') {
      setFrom(todayStr)
      setTo(todayStr)
    } else if (preset === 'week') {
      setFrom(toKey(mondayOf(now)))
      setTo(todayStr)
    } else if (preset === 'last7') {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      setFrom(toKey(d))
      setTo(todayStr)
    } else if (preset === 'month') {
      setFrom(toKey(new Date(now.getFullYear(), now.getMonth(), 1)))
      setTo(todayStr)
    } else if (preset === 'last30') {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      setFrom(toKey(d))
      setTo(todayStr)
    }
  }

  return (
    <section className="reports-section">
      <h2 className="section-title">Reports</h2>
      <div className="reports-panel">
        <div className="reports-grid">
          <button
            className="report-btn report-btn-full"
            onClick={() => exportDailyReport({ pillarProgress, itemsForPillar, streaks, today, completion })}
          >
            ⬇ Full daily report (PDF)
          </button>

          {PILLARS.map((pillar) => (
            <button
              key={pillar.id}
              className="report-btn"
              onClick={() =>
                exportPillarReport(
                  pillar,
                  pillarProgress[pillar.id],
                  streaks[pillar.id],
                  itemsForPillar(pillar.id)
                )
              }
            >
              <span>{pillar.label} report</span>
              <span className="report-icon mono">↓</span>
            </button>
          ))}

          <button
            className="report-btn"
            onClick={() => exportWeeklyReport({ history, itemsForPillar, weekTrail })}
          >
            <span>7-day rollup</span>
            <span className="report-icon mono">↓</span>
          </button>

          <button className="report-btn" onClick={() => exportJSONBackup(rawState)}>
            <span>Raw data backup (.json)</span>
            <span className="report-icon mono">↓</span>
          </button>
        </div>

        <div className="range-picker">
          <p className="range-label">Custom range — daily, weekly, monthly, whatever you pick</p>
          <div className="range-presets">
            <button type="button" className="range-preset-btn" onClick={() => applyPreset('today')}>Today</button>
            <button type="button" className="range-preset-btn" onClick={() => applyPreset('week')}>This week</button>
            <button type="button" className="range-preset-btn" onClick={() => applyPreset('last7')}>Last 7 days</button>
            <button type="button" className="range-preset-btn" onClick={() => applyPreset('month')}>This month</button>
            <button type="button" className="range-preset-btn" onClick={() => applyPreset('last30')}>Last 30 days</button>
          </div>
          <div className="range-dates">
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
            />
            <span className="range-dash mono">to</span>
            <input
              type="date"
              value={to}
              min={from}
              max={todayStr}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
            />
          </div>
          <button
            type="button"
            className="add-btn range-download-btn"
            onClick={() => exportRangeReport({ history, itemsForPillar, from, to })}
          >
            ⬇ Download PDF for this range
          </button>
        </div>

        <p className="reports-note">
          Every report is generated on-device from what's currently logged — nothing leaves your browser.
        </p>
      </div>
    </section>
  )
}
