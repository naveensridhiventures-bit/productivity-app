const STATUS_COPY = {
  off: 'Not connected — this device only, fully offline.',
  idle: 'Connected. Waiting for first sync…',
  syncing: 'Syncing…',
  synced: 'Synced.',
  error: "Couldn't reach the sheet — check that apps-script/Code.gs is deployed and public.",
}

// The endpoint lives in src/lib/sheetSync.js, not a form the person fills
// in — so this panel is just a status readout plus a manual "sync now".
export default function SheetSync({ url, status, lastSyncedAt, syncNow }) {
  const connected = Boolean(url)

  return (
    <section className="sync-section">
      <h2 className="section-title">Sheets sync</h2>
      <div className="hud-panel sync-panel">
        <p className={`reminders-status ${status === 'error' ? 'is-warn' : ''}`}>
          {STATUS_COPY[status] || STATUS_COPY.off}
          {status === 'synced' && lastSyncedAt
            ? ` (${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
            : ''}
        </p>

        {connected ? (
          <button type="button" className="report-btn" onClick={syncNow}>
            <span>Sync now</span>
            <span className="report-icon mono">↻</span>
          </button>
        ) : (
          <p className="sync-hint">
            To turn this on, deploy <code>apps-script/Code.gs</code> to a Google Sheet and paste the web
            app URL into <code>src/lib/sheetSync.js</code> — it's fixed there in source rather than typed
            into the app, on purpose.
          </p>
        )}
      </div>
    </section>
  )
}
