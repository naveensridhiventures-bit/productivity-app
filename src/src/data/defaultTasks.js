// The four core pillars — always present, tracked daily.
export const PILLARS = [
  {
    id: 'workout',
    label: 'Morning workout',
    unit: 'session',
    placeholder: 'e.g. 30 min run, upper body',
    hasWeeklyTarget: true,
  },
  {
    id: 'food',
    label: 'Food intake',
    unit: 'log',
    isChecklist: true,
  },
  {
    id: 'learning',
    label: 'Learning',
    unit: 'session',
    placeholder: 'e.g. read 20 pages, DSA practice',
    hasWeeklyTarget: true,
  },
  {
    id: 'savings',
    label: 'Savings',
    unit: '₹',
    placeholder: 'e.g. 200',
    isAmount: true,
    hasMonthlyGoal: true,
  },
]

// Sub-items for the food checklist pillar.
export const FOOD_ITEMS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'water', label: 'Water' },
]

// Seeded on first run only — user can edit or remove freely afterward.
export const SEED_TASKS = [
  { id: 'seed-1', text: 'Plan tomorrow before bed', recurring: true },
  { id: 'seed-2', text: 'No phone in the first 30 min awake', recurring: true },
]

// Editable in Settings — weekly session targets and a monthly savings goal.
export const DEFAULT_GOALS = {
  workout: { timesPerWeek: 4 },
  learning: { timesPerWeek: 5 },
  savings: { monthlyGoal: 5000 },
}

export const DAILY_QUOTES = [
  'Small and consistent beats big and occasional.',
  "Today doesn't need to be perfect — it needs to be tended.",
  'The streak is a side effect. The showing up is the point.',
  'One log at a time is still a log.',
  'Progress hides in the days that felt ordinary.',
  'You don\u2019t need motivation, you need the next small step.',
  'What you tend to, grows.',
]
