import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { computeCategoryStats, computeDailyTrend, buildInsightMessages } from '../lib/insights'
import { exportExcelWorkbook } from '../lib/excelExport'

const ACCENT_HEX = {
  clay: '#FF5C6A',
  gold: '#FFB63D',
  sky: '#7C6CFF',
  moss: '#3CF2A6',
  core: '#38D6FF',
}

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: 'All time', value: 0 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date mono">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="chart-tooltip-row" style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  )
}

export default function Analytics({ categories, itemsForPillar, history }) {
  const [range, setRange] = useState(30)

  const categoryStats = useMemo(
    () => computeCategoryStats(categories, itemsForPillar, history, range || undefined),
    [categories, itemsForPillar, history, range]
  )
  const trend = useMemo(
    () => computeDailyTrend(categories, itemsForPillar, history, range || undefined),
    [categories, itemsForPillar, history, range]
  )
  const insightMessages = useMemo(() => buildInsightMessages(categoryStats), [categoryStats])

  const barData = categoryStats.map((c) => ({ name: c.label, pct: c.avgPct, fill: ACCENT_HEX[c.accent] || ACCENT_HEX.core }))
  const radarData = categoryStats.map((c) => ({ name: c.label, pct: c.avgPct }))
  const hasAnyData = Object.keys(history).length > 0

  return (
    <section className="analytics-section">
      <h2 className="section-title">Analytics</h2>
      <div className="analytics-panel hud-panel">
        <div className="analytics-range-row">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`range-preset-btn ${range === opt.value ? 'is-active' : ''}`}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {!hasAnyData ? (
          <p className="empty-note">Log a day or two and your charts will appear here.</p>
        ) : (
          <>
            <div className="insight-cards">
              {insightMessages.map((msg, i) => (
                <p key={i} className="insight-card">{msg}</p>
              ))}
            </div>

            <div className="chart-block">
              <p className="chart-title mono">AVERAGE COMPLETION BY CATEGORY</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,214,255,0.12)" />
                  <XAxis dataKey="name" tick={{ fill: '#7FA8B8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#7FA8B8', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56,214,255,0.06)' }} />
                  <Bar dataKey="pct" name="Avg %" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-block">
              <p className="chart-title mono">OVERALL TREND</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,214,255,0.12)" />
                  <XAxis dataKey="date" tick={{ fill: '#7FA8B8', fontSize: 10 }} minTickGap={24} />
                  <YAxis tick={{ fill: '#7FA8B8', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="pct" name="Overall %" stroke="#38D6FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {categoryStats.length >= 3 ? (
              <div className="chart-block">
                <p className="chart-title mono">STRENGTHS &amp; WEAK SPOTS</p>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="rgba(56,214,255,0.18)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#7FA8B8', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#3E5A68', fontSize: 9 }} />
                    <Radar name="Avg %" dataKey="pct" stroke="#38D6FF" fill="#38D6FF" fillOpacity={0.35} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </>
        )}

        <button
          type="button"
          className="add-btn range-download-btn"
          onClick={() => exportExcelWorkbook({ categories, itemsForPillar, history })}
        >
          ⬇ Export full data to Excel (.xlsx)
        </button>
        <p className="reports-note">
          Every sheet — overview, per-category, tasks — is built from what's logged on this device.
        </p>
      </div>
    </section>
  )
}
