import { DAILY_QUOTES } from '../data/defaultTasks'

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

function dayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function Header() {
  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const quote = DAILY_QUOTES[dayOfYear() % DAILY_QUOTES.length]

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow mono">{date}</p>
        <h1>{greeting()}, Iqshaana</h1>
        <p className="quote-line">{quote}</p>
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
