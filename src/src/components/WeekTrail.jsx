const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function WeekTrail({ days }) {
  return (
    <section className="week-trail">
      <h2 className="section-title">This week</h2>
      <div className="trail-row">
        {days.map((d) => {
          const dow = new Date(d.key).getDay()
          const level = d.doneCount // 0..4
          return (
            <div key={d.key} className={`trail-day ${d.isToday ? 'is-today' : ''}`}>
              <div className={`trail-mark level-${level}`} />
              <span className="trail-letter mono">{DAY_LETTERS[dow]}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
