import { PILLARS } from './data/defaultTasks'
import { useTracker } from './hooks/useTracker'
import Header from './components/Header'
import ProgressRing from './components/ProgressRing'
import PillarCard from './components/PillarCard'
import TaskList from './components/TaskList'
import WeekTrail from './components/WeekTrail'

export default function App() {
  const {
    today,
    setPillar,
    togglePillarDone,
    addTask,
    toggleTask,
    removeTask,
    streaks,
    completion,
    weekTrail,
  } = useTracker()

  const pillarsDoneIds = PILLARS.filter((p) => today.pillars[p.id]?.done).map((p) => p.id)

  return (
    <>
      <Header />

      <div className="ring-section">
        <ProgressRing
          ratio={completion.ratio}
          pillarsDone={pillarsDoneIds}
          dayLabel={`${completion.pillarsDone + completion.tasksDone} of ${completion.pillarsTotal + completion.tasksTotal} tended`}
        />
      </div>

      <section className="pillars">
        <h2 className="section-title">The four</h2>
        <div className="pillar-grid">
          {PILLARS.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              value={today.pillars[pillar.id]}
              streak={streaks[pillar.id]}
              onToggle={() => togglePillarDone(pillar.id)}
              onPatch={(patch) => setPillar(pillar.id, patch)}
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
    </>
  )
}
