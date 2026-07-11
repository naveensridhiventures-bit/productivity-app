import { useEffect, useMemo } from 'react'

const COLORS = ['var(--moss)', 'var(--gold)', 'var(--clay)', 'var(--sky)']

export default function Celebration({ onDone }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
      })),
    []
  )

  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="celebration" role="status" aria-live="polite">
      <div className="confetti-field" aria-hidden="true">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        ))}
      </div>
      <div className="celebration-card">
        <span className="celebration-emoji">🌿</span>
        <p className="celebration-text">All four tended today.</p>
      </div>
    </div>
  )
}
