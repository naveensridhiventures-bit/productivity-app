import { useState } from 'react'

export default function PillarCard({ pillar, value, streak, weeklyDone, weeklyTarget, onToggle, onPatch }) {
  const [expanded, setExpanded] = useState(false)
  const done = !!value.done

  return (
    <div className={`pillar-card ${done ? 'is-done' : ''}`}>
      <div className="pillar-row">
        <button
          className="pillar-check"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={`Mark ${pillar.label} ${done ? 'not done' : 'done'}`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            {done ? (
              <path
                d="M4 9.5L7.5 13L14 5.5"
                fill="none"
                stroke="var(--surface)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </svg>
        </button>

        <div className="pillar-text" onClick={() => setExpanded((e) => !e)}>
          <span className="pillar-label">{pillar.label}</span>
          {value.note ? <span className="pillar-note">{value.note}</span> : null}
        </div>

        {streak > 0 ? <span className="streak-badge mono">{streak}d</span> : null}
      </div>

      {typeof weeklyTarget === 'number' ? (
        <div className="weekly-bar">
          <div className="weekly-bar-track">
            <div
              className="weekly-bar-fill"
              style={{ width: `${Math.min(100, (weeklyDone / weeklyTarget) * 100)}%` }}
            />
          </div>
          <span className="weekly-bar-label mono">
            {weeklyDone}/{weeklyTarget} this week
          </span>
        </div>
      ) : null}

      {expanded ? (
        <div className="pillar-detail">
          <input
            type="text"
            placeholder={pillar.placeholder}
            value={value.note || ''}
            onChange={(e) => onPatch({ note: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  )
}
