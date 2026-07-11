import { PILLARS } from '../data/defaultTasks'

const SIZE = 172
const STROKE = 10
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R
const BUD_ANGLES = [-90, 0, 90, 180] // top, right, bottom, left

export default function ProgressRing({ ratio, pillarsDone, dayLabel }) {
  const offset = CIRC * (1 - ratio)

  return (
    <div className="ring-wrap">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--line)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--moss)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {PILLARS.map((pillar, i) => {
          const angle = (BUD_ANGLES[i] * Math.PI) / 180
          const bx = SIZE / 2 + R * Math.cos(angle)
          const by = SIZE / 2 + R * Math.sin(angle)
          const isDone = pillarsDone.includes(pillar.id)
          return (
            <circle
              key={pillar.id}
              cx={bx}
              cy={by}
              r={6}
              fill={isDone ? 'var(--gold)' : 'var(--surface)'}
              stroke={isDone ? 'var(--gold)' : 'var(--ink-faint)'}
              strokeWidth={2}
            />
          )
        })}
      </svg>
      <div className="ring-center">
        <span className="ring-percent mono">{Math.round(ratio * 100)}%</span>
        <span className="ring-label">{dayLabel}</span>
      </div>
    </div>
  )
}
