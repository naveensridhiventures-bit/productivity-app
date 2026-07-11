const GREETINGS = [
  { before: 5, text: 'Still up?' },
  { before: 12, text: 'Good morning' },
  { before: 17, text: 'Good afternoon' },
  { before: 21, text: 'Good evening' },
  { before: 24, text: 'Winding down' },
]

function greeting() {
  const h = new Date().getHours()
  return GREETINGS.find((g) => h < g.before)?.text ?? 'Hello'
}

export default function Header() {
  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow mono">{date}</p>
        <h1>{greeting()}, Iqshaana</h1>
      </div>
      <div className="mark" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 34 34">
          <circle cx="17" cy="17" r="15" fill="none" stroke="var(--moss)" strokeWidth="2" opacity="0.35" />
          <circle cx="17" cy="17" r="10.5" fill="none" stroke="var(--moss)" strokeWidth="2" opacity="0.6" />
          <circle cx="17" cy="17" r="6" fill="var(--moss)" />
        </svg>
      </div>
    </header>
  )
}
