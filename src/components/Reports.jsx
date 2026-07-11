import { PILLARS } from '../data/defaultTasks'
import {
  exportDailyReport,
  exportPillarReport,
  exportWeeklyReport,
  exportJSONBackup,
} from '../lib/report'

export default function Reports({
  pillarProgress,
  itemsForPillar,
  streaks,
  today,
  completion,
  history,
  weekTrail,
  rawState,
}) {
  return (
    <section className="reports-section">
      <h2 className="section-title">Reports</h2>
      <div className="reports-panel">
        <div className="reports-grid">
          <button
            className="report-btn report-btn-full"
            onClick={() => exportDailyReport({ pillarProgress, itemsForPillar, streaks, today, completion })}
          >
            ⬇ Full daily report (PDF)
          </button>

          {PILLARS.map((pillar) => (
            <button
              key={pillar.id}
              className="report-btn"
              onClick={() =>
                exportPillarReport(
                  pillar,
                  pillarProgress[pillar.id],
                  streaks[pillar.id],
                  itemsForPillar(pillar.id)
                )
              }
            >
              <span>{pillar.label} report</span>
              <span className="report-icon mono">↓</span>
            </button>
          ))}

          <button
            className="report-btn"
            onClick={() => exportWeeklyReport({ history, itemsForPillar, weekTrail })}
          >
            <span>7-day rollup</span>
            <span className="report-icon mono">↓</span>
          </button>

          <button className="report-btn" onClick={() => exportJSONBackup(rawState)}>
            <span>Raw data backup (.json)</span>
            <span className="report-icon mono">↓</span>
          </button>
        </div>
        <p className="reports-note">
          Every report is generated on-device from what's currently logged — nothing leaves your browser.
        </p>
      </div>
    </section>
  )
}
