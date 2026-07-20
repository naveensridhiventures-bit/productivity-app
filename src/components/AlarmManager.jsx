import { useState } from 'react'
import { RINGTONES, previewRingtone, unlockAudio } from '../lib/ringtones'

export default function AlarmManager({
  alarms,
  addAlarm,
  updateAlarm,
  removeAlarm,
  toggleAlarm,
  permission,
  requestPermission,
  supported,
}) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')
  const [time, setTime] = useState('08:00')
  const [ringtone, setRingtone] = useState('chime')

  function openForm() {
    unlockAudio() // this is a real click, so the browser will allow audio later
    setAdding(true)
  }

  function submit(e) {
    e.preventDefault()
    const clean = label.trim()
    if (!clean) return
    addAlarm({ label: clean, note: note.trim(), time, ringtone })
    setLabel('')
    setNote('')
    setTime('08:00')
    setRingtone('chime')
    setAdding(false)
  }

  return (
    <section className="alarms-section">
      <h2 className="section-title">Alarms</h2>
      <div className="alarms-panel hud-panel">
        {supported && permission !== 'granted' ? (
          <button className="reminders-test-btn alarm-permission-btn" onClick={requestPermission}>
            Enable notifications for alarms
          </button>
        ) : null}

        {alarms.length === 0 && !adding ? (
          <p className="empty-note">No alarms set. Add one to get an on-screen alert plus a ringtone.</p>
        ) : null}

        <ul className="alarm-list">
          {alarms.map((alarm) => (
            <li key={alarm.id} className="alarm-row">
              <label className="hud-switch">
                <input
                  type="checkbox"
                  checked={alarm.enabled}
                  onChange={(e) => {
                    unlockAudio()
                    toggleAlarm(alarm.id, e.target.checked)
                  }}
                />
                <span className="hud-switch-track">
                  <span className="hud-switch-thumb" />
                </span>
              </label>

              <div className="alarm-row-text">
                <span className="alarm-row-label">{alarm.label}</span>
                <span className="alarm-row-meta mono">
                  {alarm.time} · {RINGTONES.find((r) => r.id === alarm.ringtone)?.label || 'Chime'}
                </span>
                {alarm.note ? <span className="alarm-row-note">{alarm.note}</span> : null}
              </div>

              <button
                className="subitem-remove alarm-remove"
                onClick={() => removeAlarm(alarm.id)}
                aria-label={`Remove ${alarm.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {adding ? (
          <form className="alarm-form" onSubmit={submit}>
            <input
              type="text"
              placeholder="Alarm name — e.g. Drink water"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              placeholder="Note shown on the pop-up (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="alarm-form-row">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              <select value={ringtone} onChange={(e) => setRingtone(e.target.value)}>
                {RINGTONES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button type="button" className="cancel-btn alarm-preview-btn" onClick={() => previewRingtone(ringtone)}>
                ▶ Preview
              </button>
            </div>
            <div className="alarm-form-actions">
              <button type="submit" className="add-btn small">Add alarm</button>
              <button type="button" className="cancel-btn" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button className="add-subitem-btn alarm-add-btn" onClick={openForm}>
            + Add alarm
          </button>
        )}
      </div>
    </section>
  )
}
