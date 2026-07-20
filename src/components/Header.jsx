const GREETINGS = [
  { before: 5, text: 'SYSTEMS NOMINAL — LATE SHIFT' },
  { before: 12, text: 'GOOD MORNING' },
  { before: 17, text: 'GOOD AFTERNOON' },
  { before: 21, text: 'GOOD EVENING' },
  { before: 24, text: 'STANDING BY' },
]

function greeting() {
  const h = new Date().getHours()
  return GREETINGS.find((g) => h < g.before)?.text ?? 'ONLINE'
}

export default function Header() {
  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="app-header hud-panel">
      <div>
        <p className="eyebrow mono">J.A.R.V.I.S. // {date}</p>
        <h1>{greeting()}, Naveen</h1>
        <p className="sub-line">All pillars monitored · Data stored on-device</p>
      </div>
      <div className="mark" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <g className="arc-spin">
            <circle cx="20" cy="20" r="17" fill="none" stroke="var(--core)" strokeWidth="1.4" opacity="0.25" />
            <path
              d="M20 3 A17 17 0 0 1 34.7 11.5"
              fill="none"
              stroke="var(--core)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M20 37 A17 17 0 0 1 5.3 28.5"
              fill="none"
              stroke="var(--moss)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
          <circle cx="20" cy="20" r="11" fill="none" stroke="var(--core)" strokeWidth="1.4" opacity="0.5" />
          <circle cx="20" cy="20" r="5.5" fill="var(--core)" opacity="0.85">
            <animate attributeName="opacity" values="0.85;0.4;0.85" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </header>
  )
}
