import { useState } from 'react'

export default function TaskList({ tasks, onToggle, onRemove, onAdd }) {
  const [text, setText] = useState('')
  const [recurring, setRecurring] = useState(false)

  function submit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed, recurring)
    setText('')
    setRecurring(false)
  }

  return (
    <section className="task-list">
      <h2 className="section-title">Today's tasks</h2>

      {tasks.length === 0 ? (
        <p className="empty-note">Nothing added yet — put something below.</p>
      ) : (
        <ul className="task-items">
          {tasks.map((t) => (
            <li key={t.id} className={t.done ? 'is-done' : ''}>
              <button
                className="task-check"
                onClick={() => onToggle(t.id)}
                aria-pressed={t.done}
                aria-label={`Mark ${t.text} ${t.done ? 'not done' : 'done'}`}
              >
                {t.done ? (
                  <svg width="14" height="14" viewBox="0 0 18 18">
                    <path
                      d="M4 9.5L7.5 13L14 5.5"
                      fill="none"
                      stroke="var(--surface)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
              <span className="task-text">{t.text}</span>
              {t.recurring ? <span className="task-tag mono">daily</span> : null}
              <button
                className="task-remove"
                onClick={() => onRemove(t.id)}
                aria-label={`Remove ${t.text}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="add-task-row" onSubmit={submit}>
        <input
          type="text"
          placeholder="Add a task for today…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="recurring-toggle">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          repeat daily
        </label>
        <button type="submit" className="add-btn">Add</button>
      </form>
    </section>
  )
}
