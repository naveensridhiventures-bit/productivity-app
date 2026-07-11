import { useState } from 'react'
import { PILLARS } from '../data/defaultTasks'

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function HistoryView({ getMonthGrid, streaks, monthlySavings, goals }) {
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const { grid, leadingBlank } = getMonthGrid(cursor.year, cursor.month)

  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth()
  const fullyTendedDays = grid.filter((d) => d.doneCount === PILLARS.length).length
  const bestStreak = Math.max(0, ...Object.values(streaks))

  function shiftMonth(delta) {
    setCursor((prev) => {
      let month = prev.month + delta
      let year = prev.year
      if (month < 0) { month = 11; year -= 1 }
      if (month > 11) { month = 0; year += 1 }
      return { year, month }
    })
  }

  return (
    <section className="history-view">
      <div className="history-summary">
        <div>
          <span className="summary-num mono">{fullyTendedDays}</span>
          <span className="summary-label">fully tended this month</span>
        </div>
        <div>
          <span className="summary-num mono">{bestStreak}d</span>
          <span className="summary-label">longest active streak</span>
        </div>
        <div>
          <span className="summary-num mono">₹{monthlySavings.toLocaleString('en-IN')}</span>
          <span className="summary-label">saved of ₹{goals.savings.monthlyGoal.toLocaleString('en-IN')} goal</span>
        </div>
      </div>

      <div className="month-nav">
        <button onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
        <h2>{MONTH_NAMES[cursor.month]} {cursor.year}</h2>
        <button onClick={() => shiftMonth(1)} disabled={isCurrentMonth} aria-label="Next month">›</button>
      </div>

      <div className="heatmap">
        <div className="heatmap-weekdays">
          {WEEKDAY_LETTERS.map((l, i) => (
            <span key={i} className="mono">{l}</span>
          ))}
        </div>
        <div className="heatmap-grid">
          {Array.from({ length: leadingBlank }).map((_, i) => (
            <div key={`blank-${i}`} className="heatmap-cell is-blank" />
          ))}
          {grid.map((d) => (
            <div
              key={d.key}
              className={`heatmap-cell level-${d.isFuture ? 0 : d.doneCount}`}
              title={`${d.key}: ${d.doneCount}/${PILLARS.length} tended`}
            >
              <span className="mono">{d.date}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
