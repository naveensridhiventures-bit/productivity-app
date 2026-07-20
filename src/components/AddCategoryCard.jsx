import { useState } from 'react'
import { ICON_OPTIONS, ACCENT_OPTIONS } from '../data/defaultTasks'

const ICON_GLYPH = {
  dumbbell: '🏋',
  bowl: '🥣',
  book: '📖',
  piggy: '🐷',
  star: '★',
  flag: '⚑',
  bolt: '⚡',
  target: '◎',
}

export default function AddCategoryCard({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [tagline, setTagline] = useState('')
  const [icon, setIcon] = useState('star')
  const [accent, setAccent] = useState('core')

  function submit(e) {
    e.preventDefault()
    const clean = label.trim()
    if (!clean) return
    onAdd({ label: clean, tagline: tagline.trim(), icon, accent })
    setLabel('')
    setTagline('')
    setIcon('star')
    setAccent('core')
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="add-category-card" onClick={() => setOpen(true)}>
        <span className="add-category-plus">+</span>
        <span>New category</span>
      </button>
    )
  }

  return (
    <form className={`add-category-card is-open accent-${accent}`} onSubmit={submit}>
      <input
        type="text"
        placeholder="Category name — e.g. Meditation"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        autoFocus
      />
      <input
        type="text"
        placeholder="Tagline — e.g. Ten quiet minutes"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
      />

      <div className="icon-picker">
        {ICON_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt}
            className={`icon-picker-btn ${icon === opt ? 'is-selected' : ''}`}
            onClick={() => setIcon(opt)}
            aria-label={opt}
          >
            {ICON_GLYPH[opt]}
          </button>
        ))}
      </div>

      <div className="accent-picker">
        {ACCENT_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt}
            className={`accent-picker-btn accent-${opt} ${accent === opt ? 'is-selected' : ''}`}
            onClick={() => setAccent(opt)}
            aria-label={opt}
          />
        ))}
      </div>

      <div className="category-edit-actions">
        <button type="submit" className="add-btn small">Create</button>
        <button type="button" className="cancel-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
