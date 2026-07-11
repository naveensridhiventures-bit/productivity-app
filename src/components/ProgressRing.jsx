import { PILLARS } from '../data/defaultTasks'

const SIZE = 200
const STROKE = 9
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R
const BUD_ANGLES = [-90, 0, 90, 180] // top, right, bottom, left
const DECOR_R = R + 14

export default function ProgressRing({ ratio, pillarsDone, dayLabel }) {
  const offset = CIRC * (1 - ratio)
  const tickCount = 60

  return (
    <div className="ring-wrap">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* rotating tick-mark decor ring, purely aesthetic HUD detail */}
        <g className="ring-decor">
          {Array.from({ length: tickCount }).map((_, i) => {
            const angle = (i / tickCount) * 2 * Math.PI
            const x1 = SIZE / 2 + DECOR_R * Math.cos(angle)
            const y1 = SIZE / 2 + DECOR_R * Math.sin(angle)
            const x2 = SIZE / 2 + (DECOR_R - 4) * Math.cos(angle)
            const y2 = SIZE / 2 + (DECOR_R - 4) * Math.sin(angle)
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--core)"
                strokeWidth="1"
                opacity={i % 5 === 0 ? 0.5 : 0.15}
              />
            )
          })}
        </g>

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
          stroke="var(--core)"
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
          const color = `var(--${pillar.accent})`
          return (
            <circle
              key={pillar.id}
              cx={bx}
              cy={by}
              r={isDone ? 7 : 6}
              fill={isDone ? color : 'var(--surface-solid)'}
              stroke={isDone ? color : 'var(--ink-faint)'}
              strokeWidth={2}
              style={{ transition: 'r 0.25s ease, fill 0.25s ease' }}
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
