export default function SettingsView({ goals, onSetGoal }) {
  return (
    <section className="settings-view">
      <h2 className="section-title">Weekly targets</h2>
      <div className="settings-group">
        <label>
          <span>Workout sessions per week</span>
          <input
            type="number"
            min="1"
            max="7"
            value={goals.workout.timesPerWeek}
            onChange={(e) => onSetGoal('workout', { timesPerWeek: Number(e.target.value) || 1 })}
          />
        </label>
        <label>
          <span>Learning sessions per week</span>
          <input
            type="number"
            min="1"
            max="7"
            value={goals.learning.timesPerWeek}
            onChange={(e) => onSetGoal('learning', { timesPerWeek: Number(e.target.value) || 1 })}
          />
        </label>
      </div>

      <h2 className="section-title">Monthly savings goal</h2>
      <div className="settings-group">
        <label>
          <span>Target amount (₹)</span>
          <input
            type="number"
            min="0"
            step="100"
            value={goals.savings.monthlyGoal}
            onChange={(e) => onSetGoal('savings', { monthlyGoal: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      <p className="settings-note">
        Data lives on this device only, in your browser's local storage. Nothing syncs
        across devices yet — see the README for the optional Google Sheets upgrade path.
      </p>
    </section>
  )
}
