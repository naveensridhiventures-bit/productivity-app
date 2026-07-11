const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

export default function Tabs({ active, onChange }) {
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab-btn ${active === t.id ? 'is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
