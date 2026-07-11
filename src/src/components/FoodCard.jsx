import { FOOD_ITEMS } from '../data/defaultTasks'

export default function FoodCard({ value, streak, onToggleItem }) {
  const items = value.items || {}
  const done = FOOD_ITEMS.every((f) => items[f.id])

  return (
    <div className={`pillar-card ${done ? 'is-done' : ''}`}>
      <div className="pillar-row">
        <div className="pillar-text">
          <span className="pillar-label">Food intake</span>
        </div>
        {streak > 0 ? <span className="streak-badge mono">{streak}d</span> : null}
      </div>

      <div className="food-chips">
        {FOOD_ITEMS.map((f) => {
          const checked = !!items[f.id]
          return (
            <button
              key={f.id}
              className={`food-chip ${checked ? 'is-checked' : ''}`}
              onClick={() => onToggleItem(f.id)}
              aria-pressed={checked}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
