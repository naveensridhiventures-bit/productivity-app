import { useState } from 'react'
import { PILLARS } from './data/defaultTasks'
import { useTracker } from './hooks/useTracker'
import Header from './components/Header'
import ProgressRing from './components/ProgressRing'
import PillarCard from './components/PillarCard'
import FoodCard from './components/FoodCard'
import SavingsCard from './components/SavingsCard'
import TaskList from './components/TaskList'
import WeekTrail from './components/WeekTrail'
import Celebration from './components/Celebration'
import Tabs from './components/Tabs'
import HistoryView from './components/HistoryView'
import SettingsView from './components/SettingsView'
import { isPillarDone } from './hooks/useTracker'

export default function App() {
  const [tab, setTab] = useState('today')
  const {
    today,
    goals,
    setPillar,
    togglePillarDone,
    toggleFoodItem,
    addTask,
    toggleTask,
    removeTask,
    setGoal,
    streaks,
    completion,
    weekTrail,
    weeklyProgress,
    monthlySavings,
    getMonthGrid,
  } = useTracker()

  const pillarsDoneIds = PILLARS.filter((p) => isPillarDone(p, today.pillars[p.id])).map((p) => p.id)

  return (
    <>
      <Header />
      <Tabs active={tab} onChange={setTab} />

      {tab === 'today' ? (
        <>
          <div className="ring-section">
            <ProgressRing
              ratio={completion.ratio}
              pillarsDone={pillarsDoneIds}
              isComplete={completion.isComplete}
              dayLabel={`${completion.pillarsDone + completion.tasksDone} of ${completion.pillarsTotal + completion.tasksTotal} tended`}
            />
          </div>

          {completion.isComplete ? <Celebration /> : null}

          <section className="pillars">
            <h2 className="section-title">The four</h2>
            <div className="pillar-grid">
              {PILLARS.map((pillar) => {
                if (pillar.id === 'food') {
                  return (
                    <FoodCard
                      key={pillar.id}
                      value={today.pillars.food}
                      streak={streaks.food}
                      onToggleItem={toggleFoodItem}
                    />
                  )
                }
                if (pillar.id === 'savings') {
                  return (
                    <SavingsCard
                      key={pillar.id}
                      value={today.pillars.savings}
                      streak={streaks.savings}
                      monthlyTotal={monthlySavings}
                      monthlyGoal={goals.savings.monthlyGoal}
                      onPatch={(patch) => setPillar('savings', patch)}
                    />
                  )
                }
                return (
                  <PillarCard
                    key={pillar.id}
                    pillar={pillar}
                    value={today.pillars[pillar.id]}
                    streak={streaks[pillar.id]}
                    weeklyDone={weeklyProgress[pillar.id]}
                    weeklyTarget={pillar.hasWeeklyTarget ? goals[pillar.id]?.timesPerWeek : undefined}
                    onToggle={() => togglePillarDone(pillar.id)}
                    onPatch={(patch) => setPillar(pillar.id, patch)}
                  />
                )
              })}
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
      ) : null}

      {tab === 'history' ? (
        <HistoryView
          getMonthGrid={getMonthGrid}
          streaks={streaks}
          monthlySavings={monthlySavings}
          goals={goals}
        />
      ) : null}

      {tab === 'settings' ? (
        <SettingsView goals={goals} onSetGoal={setGoal} />
      ) : null}
    </>
  )
}
