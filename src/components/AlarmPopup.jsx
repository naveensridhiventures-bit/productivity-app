export default function AlarmPopup({ alarm, onDismiss, onSnooze }) {
  if (!alarm) return null

  return (
    <div className="alarm-overlay" role="alertdialog" aria-label={`Alarm: ${alarm.label}`}>
      <div className="alarm-card">
        <div className="alarm-glow" aria-hidden="true" />
        <div className="alarm-ring" aria-hidden="true">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 3 2.5 5.5M19 3l2.5 2.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="alarm-eyebrow mono">⏰ ALARM</p>
        <h2 className="alarm-label">{alarm.label}</h2>
        {alarm.note ? <p className="alarm-note">{alarm.note}</p> : null}
        <div className="alarm-actions">
          <button className="alarm-snooze-btn" onClick={() => onSnooze(5)}>
            Snooze 5 min
          </button>
          <button className="alarm-dismiss-btn" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
