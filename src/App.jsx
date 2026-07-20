import { useEffect, useState } from 'react'
import { useTracker } from './hooks/useTracker'
import { useReminders } from './hooks/useReminders'
import { useAlarms } from './hooks/useAlarms'
import Header from './components/Header'
import ProgressRing from './components/ProgressRing'
import PillarCard from './components/PillarCard'
import AddCategoryCard from './components/AddCategoryCard'
import TaskList from './components/TaskList'
import WeekTrail from './components/WeekTrail'
import Celebration from './components/Celebration'
import Reports from './components/Reports'
import Analytics from './components/Analytics'
import Snapshot from './components/Snapshot'
import Reminders from './components/Reminders'
import AlarmManager from './components/AlarmManager'
import AlarmPopup from './components/AlarmPopup'
import SheetSync from './components/SheetSync'

export default function App() {
  const {
    today,
    categories,
    addCategory,
    updateCategory,
    removeCategory,
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
    sync,
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

  const pillarsDoneIds = categories.filter((p) => pillarProgress[p.id].done).map((p) => p.id)
  const pillarStatus = categories.map((p) => ({
    id: p.id,
    label: p.label,
    done: pillarProgress[p.id].done,
  }))
  const reminders = useReminders(pillarStatus)
  const alarms = useAlarms()

  return (
    <>
      <Header />

      <p className="daily-quote">{quote}</p>

      <div className="ring-section">
        <ProgressRing
          ratio={completion.ratio}
          pillarsDone={pillarsDoneIds}
          dayLabel={`${Math.round(completion.ratio * 100)}% tended today`}
          categories={categories}
        />
      </div>

      <section className="pillars">
        <h2 className="section-title">Categories</h2>
        <div className="pillar-grid">
          {categories.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              progress={pillarProgress[pillar.id]}
              streak={streaks[pillar.id]}
              onBump={(subId, delta) => bumpSubCount(pillar.id, subId, delta)}
              onSetCount={(subId, count) => setSubCount(pillar.id, subId, count)}
              onAddSubItem={(item) => addSubItem(pillar.id, item)}
              onRemoveSubItem={(subId) => removeSubItem(pillar.id, subId)}
              onEditCategory={(patch) => updateCategory(pillar.id, patch)}
              onRemoveCategory={() => removeCategory(pillar.id)}
            />
          ))}
          <AddCategoryCard onAdd={addCategory} />
        </div>
      </section>

      <TaskList
        tasks={today.tasks}
        onToggle={toggleTask}
        onRemove={removeTask}
        onAdd={addTask}
      />

      <WeekTrail days={weekTrail} />

      <Reminders
        categories={categories}
        settings={reminders.settings}
        updatePillar={reminders.updatePillar}
        permission={reminders.permission}
        requestPermission={reminders.requestPermission}
        sendTest={reminders.sendTest}
        supported={reminders.supported}
      />

      <AlarmManager
        alarms={alarms.alarms}
        addAlarm={alarms.addAlarm}
        updateAlarm={alarms.updateAlarm}
        removeAlarm={alarms.removeAlarm}
        toggleAlarm={alarms.toggleAlarm}
        permission={alarms.permission}
        requestPermission={alarms.requestPermission}
        supported={alarms.supported}
      />

      <Snapshot today={today} setPillarPhoto={setPillarPhoto} categories={categories} />

      <Analytics categories={categories} itemsForPillar={itemsForPillar} history={history} />

      <Reports
        categories={categories}
        pillarProgress={pillarProgress}
        itemsForPillar={itemsForPillar}
        streaks={streaks}
        today={today}
        completion={completion}
        history={history}
        weekTrail={weekTrail}
        rawState={rawState}
      />

      <SheetSync
        url={sync.url}
        configure={sync.configure}
        status={sync.status}
        lastSyncedAt={sync.lastSyncedAt}
        syncNow={sync.syncNow}
      />

      {showCelebration ? (
        <Celebration onDone={() => setShowCelebration(false)} />
      ) : null}

      <AlarmPopup alarm={alarms.activeAlarm} onDismiss={alarms.dismiss} onSnooze={alarms.snooze} />
    </>
  )
}
