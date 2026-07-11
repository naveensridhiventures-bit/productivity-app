import { PILLARS } from '../data/defaultTasks'

export default function Reminders({ settings, updatePillar, permission, requestPermission, sendTest, supported }) {
  const granted = permission === 'granted'
  const denied = permission === 'denied'
  const anyEnabled = Object.values(settings.pillars).some((p) => p.enabled)

  async function handleToggle(pillarId, checked) {
    if (checked && !granted) {
      const result = await requestPermission()
      if (result !== 'granted') return // stay off — status line below explains why
    }
    updatePillar(pillarId, { enabled: checked })
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
            {PILLARS.map((pillar) => {
              const cfg = settings.pillars[pillar.id]
              return (
                <div className="reminders-row" key={pillar.id}>
                  <label className="hud-switch">
                    <input
                      type="checkbox"
                      checked={cfg.enabled && granted}
                      onChange={(e) => handleToggle(pillar.id, e.target.checked)}
                    />
                    <span className="hud-switch-track" aria-hidden="true">
                      <span className="hud-switch-thumb" />
                    </span>
                    <span>{pillar.label}</span>
                  </label>

                  <input
                    type="time"
                    className="reminders-time"
                    value={cfg.time}
                    disabled={!cfg.enabled || !granted}
                    onChange={(e) => updatePillar(pillar.id, { time: e.target.value })}
                    aria-label={`${pillar.label} reminder time`}
                  />
                </div>
              )
            })}

            <p className={`reminders-status ${denied ? 'is-warn' : ''}`}>
              {denied
                ? 'Notifications are blocked for this site — allow them in your browser/site settings to use this.'
                : granted
                  ? anyEnabled
                    ? 'Armed — each pillar pings once at its own time, only if still open then.'
                    : 'Off. Flip a switch above to arm one.'
                  : 'Flip a switch above and allow notifications when prompted.'}
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
