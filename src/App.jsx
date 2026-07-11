import { useEffect, useState } from 'react'
import { PILLARS } from './data/defaultTasks'
import { useTracker } from './hooks/useTracker'
import Header from './components/Header'
import ProgressRing from './components/ProgressRing'
import PillarCard from './components/PillarCard'
import TaskList from './components/TaskList'
import WeekTrail from './components/WeekTrail'
import Celebration from './components/Celebration'
import Reports from './components/Reports'
import Snapshot from './components/Snapshot'

export default function App() {
  const {
    today,
    pillarProgress,
    setSubCount,
    bumpSubCount,
    addSubItem,
    removeSubItem,
    addTask,
    toggleTask,
    removeTask,
    streaks,
    completion,
    weekTrail,
    quote,
    allPillarsDone,
    setPillarPhoto,
    itemsForPillar,
    history,
    rawState,
  } = useTracker()

  const [celebrated, setCelebrated] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (allPillarsDone && !celebrated) {
      setShowCelebration(true)
      setCelebrated(true)
    }
    if (!allPillarsDone && celebrated) {
      setCelebrated(false)
    }
  }, [allPillarsDone, celebrated])

  const pillarsDoneIds = PILLARS.filter((p) => pillarProgress[p.id].done).map((p) => p.id)

  return (
    <>
      <Header />

      <p className="daily-quote">{quote}</p>

      <div className="ring-section">
        <ProgressRing
          ratio={completion.ratio}
          pillarsDone={pillarsDoneIds}
          dayLabel={`${Math.round(completion.ratio * 100)}% tended today`}
        />
      </div>

      <section className="pillars">
        <h2 className="section-title">The four</h2>
        <div className="pillar-grid">
          {PILLARS.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              progress={pillarProgress[pillar.id]}
              streak={streaks[pillar.id]}
              onBump={(subId, delta) => bumpSubCount(pillar.id, subId, delta)}
              onSetCount={(subId, count) => setSubCount(pillar.id, subId, count)}
              onAddSubItem={(item) => addSubItem(pillar.id, item)}
              onRemoveSubItem={(subId) => removeSubItem(pillar.id, subId)}
            />
          ))}
        </div>
      </section>

      <TaskList
        tasks={today.tasks}
        onToggle={toggleTask}
        onRemove={removeTask}
        onAdd={addTask}
      />

      <WeekTrail days={weekTrail} />

      <Snapshot today={today} setPillarPhoto={setPillarPhoto} />

      <Reports
        pillarProgress={pillarProgress}
        itemsForPillar={itemsForPillar}
        streaks={streaks}
        today={today}
        completion={completion}
        history={history}
        weekTrail={weekTrail}
        rawState={rawState}
      />

      {showCelebration ? (
        <Celebration onDone={() => setShowCelebration(false)} />
      ) : null}
    </>
  )
}
