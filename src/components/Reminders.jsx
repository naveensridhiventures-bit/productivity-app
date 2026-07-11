export default function Reminders({ settings, update, permission, requestPermission, sendTest, supported }) {
  const granted = permission === 'granted'
  const denied = permission === 'denied'

  async function handleEnable(checked) {
    if (checked && !granted) {
      const result = await requestPermission()
      if (result === 'granted') update({ enabled: true })
      // if denied/dismissed, leave the toggle off — the status line explains why
      return
    }
    update({ enabled: checked })
  }

  return (
    <section className="reminders-section">
      <h2 className="section-title">Reminders</h2>
      <div className="hud-panel reminders-panel">
        {!supported ? (
          <p className="reminders-status is-warn">
            This browser doesn't support notifications — try installing Tend as an app first.
          </p>
        ) : (
          <>
            <div className="reminders-row">
              <label className="hud-switch">
                <input
                  type="checkbox"
                  checked={settings.enabled && granted}
                  onChange={(e) => handleEnable(e.target.checked)}
                />
                <span className="hud-switch-track" aria-hidden="true">
                  <span className="hud-switch-thumb" />
                </span>
                <span>Daily nudge</span>
              </label>

              <input
                type="time"
                className="reminders-time"
                value={settings.time}
                disabled={!settings.enabled || !granted}
                onChange={(e) => update({ time: e.target.value })}
                aria-label="Reminder time"
              />
            </div>

            <p className={`reminders-status ${denied ? 'is-warn' : ''}`}>
              {denied
                ? 'Notifications are blocked for this site — allow them in your browser/site settings to use this.'
                : granted
                  ? settings.enabled
                    ? `Armed — pings you at ${settings.time} for any pillar still open that day.`
                    : 'Off. Flip the switch to arm it.'
                  : 'Not enabled yet — flip the switch and allow notifications when prompted.'}
            </p>

            {granted ? (
              <button type="button" className="report-btn reminders-test-btn" onClick={sendTest}>
                <span>Send a test notification</span>
                <span className="report-icon mono">→</span>
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
