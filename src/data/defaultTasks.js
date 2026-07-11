// The four core pillars — always present, tracked daily.
export const PILLARS = [
  {
    id: 'workout',
    label: 'Morning workout',
    unit: 'session',
    placeholder: 'e.g. 30 min run, upper body',
  },
  {
    id: 'food',
    label: 'Food intake',
    unit: 'log',
    placeholder: 'e.g. meals logged, water intake',
  },
  {
    id: 'learning',
    label: 'Learning',
    unit: 'session',
    placeholder: 'e.g. read 20 pages, DSA practice',
  },
  {
    id: 'savings',
    label: 'Savings',
    unit: '₹',
    placeholder: 'e.g. 200',
    isAmount: true,
  },
]

// Seeded on first run only — user can edit or remove freely afterward.
export const SEED_TASKS = [
  { id: 'seed-1', text: 'Plan tomorrow before bed', recurring: true },
  { id: 'seed-2', text: 'No phone in the first 30 min awake', recurring: true },
]
