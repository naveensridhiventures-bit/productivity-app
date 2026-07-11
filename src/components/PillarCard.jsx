import { useState } from 'react'

const ICONS = {
  dumbbell: (
    <path
      d="M4 12h2M18 12h2M6 8.5v7M18 8.5v7M8.5 12h7M2 10.5v3M22 10.5v3"
      fill="none"
      strokeLinecap="round"
    />
  ),
  bowl: (
    <>
      <path d="M3 11h18a9 6 0 0 1-18 0z" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11c0-3 1.5-6 5-6M12 5v-2" fill="none" strokeLinecap="round" />
    </>
  ),
  book: (
    <>
      <path
        d="M4 4.5C4 4 5 3.5 8 3.5c2.5 0 3.5.7 4 1.3V19c-.5-.6-1.5-1.3-4-1.3-3 0-4 .5-4 1V4.5z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 4.5c0-.5-1-1-4-1-2.5 0-3.5.7-4 1.3V19c.5-.6 1.5-1.3 4-1.3 3 0 4 .5 4 1V4.5z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  piggy: (
    <>
      <path
        d="M5 12c0-3.5 3.1-6 7-6s7 2.5 7 6-3.1 6-7 6-7-2.5-7-6z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 8V5.5M17.5 10.5 20 9M4 11l-2-.5v3l2-.5M10 18v2M14 18v2" fill="none" strokeLinecap="round" />
      <circle cx="15.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
}

function formatCount(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export default function PillarCard({
  pillar,
  progress,
  streak,
  onBump,
  onSetCount,
  onAddSubItem,
  onRemoveSubItem,
}) {
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newUnit, setNewUnit] = useState('')

  const { ratio, done, items, counts } = progress
  const pct = Math.round(ratio * 100)

  function submitCustom(e) {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    onAddSubItem({
      label,
      unit: newUnit.trim(),
      target: Number(newTarget) || 1,
      step: 1,
    })
    setNewLabel('')
    setNewTarget('')
    setNewUnit('')
    setAdding(false)
  }

  return (
    <div className={`pillar-card accent-${pillar.accent} ${done ? 'is-done' : ''}`}>
      <div className="pillar-row" onClick={() => setExpanded((e) => !e)}>
        <div className="pillar-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {ICONS[pillar.icon]}
          </svg>
        </div>

        <div className="pillar-text">
          <div className="pillar-heading">
            <span className="pillar-label">{pillar.label}</span>
            {done ? <span className="done-check">✓</span> : null}
          </div>
          <span className="pillar-tagline">{pillar.tagline}</span>
        </div>

        <div className="pillar-side">
          {streak > 0 ? <span className="streak-badge mono">🔥{streak}d</span> : null}
          <span className="pillar-pct mono">{pct}%</span>
        </div>
      </div>

      <div className="pillar-progress-track">
        <div className="pillar-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {expanded ? (
        <div className="pillar-detail">
          <ul className="subitem-list">
            {items.map((item) => {
              const count = counts?.[item.id] || 0
              const itemPct = Math.min(100, Math.round((count / (item.target || 1)) * 100))
              const isChecklist = item.target === 1 && item.step === 1 && !item.unit
              return (
                <li key={item.id} className={`subitem-row ${count >= item.target ? 'is-complete' : ''}`}>
                  <div className="subitem-info">
                    <span className="subitem-label">{item.label}</span>
                    <span className="subitem-target mono">
                      {formatCount(count)}
                      {item.unit ? ` ${item.unit}` : ''} / {formatCount(item.target)}
                      {item.unit ? ` ${item.unit}` : ''}
                    </span>
                  </div>

                  {isChecklist ? (
                    <button
                      className={`subitem-check ${count >= 1 ? 'is-checked' : ''}`}
                      onClick={() => onSetCount(item.id, count >= 1 ? 0 : 1)}
                      aria-pressed={count >= 1}
                      aria-label={`Mark ${item.label} done`}
                    >
                      {count >= 1 ? '✓' : ''}
                    </button>
                  ) : (
                    <div className="subitem-stepper">
                      <button
                        className="stepper-btn"
                        onClick={() => onBump(item.id, -item.step)}
                        aria-label={`Decrease ${item.label}`}
                      >
                        −
                      </button>
                      <span className="stepper-value mono">{formatCount(count)}</span>
                      <button
                        className="stepper-btn"
                        onClick={() => onBump(item.id, item.step)}
                        aria-label={`Increase ${item.label}`}
                      >
                        +
                      </button>
                    </div>
                  )}

                  <div className="subitem-mini-track">
                    <div className="subitem-mini-fill" style={{ width: `${itemPct}%` }} />
                  </div>

                  {item.custom ? (
                    <button
                      className="subitem-remove"
                      onClick={() => onRemoveSubItem(item.id)}
                      aria-label={`Remove ${item.label}`}
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>

          {adding ? (
            <form className="add-subitem-form" onSubmit={submitCustom}>
              <input
                type="text"
                placeholder="e.g. Pull-ups"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="target"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
              />
              <input
                type="text"
                placeholder="unit"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
              />
              <button type="submit" className="add-btn small">Add</button>
              <button type="button" className="cancel-btn" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button className="add-subitem-btn" onClick={() => setAdding(true)}>
              + Add sub-category
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
