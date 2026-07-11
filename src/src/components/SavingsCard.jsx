import { useState } from 'react'

export default function SavingsCard({ value, streak, monthlyTotal, monthlyGoal, onPatch }) {
  const [expanded, setExpanded] = useState(false)
  const done = Number(value.amount) > 0
  const fillPct = monthlyGoal > 0 ? Math.min(100, (monthlyTotal / monthlyGoal) * 100) : 0

  return (
    <div className={`pillar-card ${done ? 'is-done' : ''}`}>
      <div className="pillar-row">
        <div className="jar" aria-hidden="true">
          <div className="jar-fill" style={{ height: `${fillPct}%` }} />
        </div>

        <div className="pillar-text" onClick={() => setExpanded((e) => !e)}>
          <span className="pillar-label">Savings</span>
          <span className="pillar-note">
            ₹{monthlyTotal.toLocaleString('en-IN')} of ₹{monthlyGoal.toLocaleString('en-IN')} this month
          </span>
        </div>

        {streak > 0 ? <span className="streak-badge mono">{streak}d</span> : null}
      </div>

      {expanded ? (
        <div className="pillar-detail">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Amount saved today, e.g. 200"
            value={value.amount || ''}
            onChange={(e) => onPatch({ amount: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  )
}
