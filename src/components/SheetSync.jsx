import { useState } from 'react'

const STATUS_COPY = {
  off: 'Not connected — local only, this device.',
  idle: 'Connected. Waiting for first sync…',
  syncing: 'Syncing…',
  synced: 'Synced.',
  error: "Couldn't reach the sheet — check the URL and that it's deployed with public access.",
}

export default function SheetSync({ url, configure, status, lastSyncedAt, syncNow }) {
  const [draft, setDraft] = useState(url)
  const connected = Boolean(url)

  function save(e) {
    e.preventDefault()
    configure(draft.trim())
  }

  function disconnect() {
    setDraft('')
    configure('')
  }

  return (
    <section className="sync-section">
      <h2 className="section-title">Sheets sync</h2>
      <div className="hud-panel sync-panel">
        <form className="sync-form" onSubmit={save}>
          <input
            type="url"
            className="sync-url-input"
            placeholder="Paste your Apps Script /exec URL…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="add-btn sync-save-btn">
            {connected ? 'Update' : 'Connect'}
          </button>
        </form>

        <p className={`reminders-status ${status === 'error' ? 'is-warn' : ''}`}>
          {STATUS_COPY[status] || STATUS_COPY.off}
          {status === 'synced' && lastSyncedAt
            ? ` (${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
            : ''}
        </p>

        {connected ? (
          <div className="sync-actions">
            <button type="button" className="report-btn" onClick={syncNow}>
              <span>Sync now</span>
              <span className="report-icon mono">↻</span>
            </button>
            <button type="button" className="report-btn sync-disconnect-btn" onClick={disconnect}>
              <span>Disconnect</span>
              <span className="report-icon mono">×</span>
            </button>
          </div>
        ) : (
          <p className="sync-hint">
            Deploy <code>apps-script/Code.gs</code> to a free Google Sheet (see the comment at the top of that
            file), then paste the web app URL above to sync this data across your devices.
          </p>
        )}
      </div>
    </section>
  )
}
