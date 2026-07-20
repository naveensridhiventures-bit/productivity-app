// The starter categories — seeded on first run, tracked daily.
// Each category is made up of sub-items (exercises, meals, topics, goals).
// A category's completion is calculated automatically from its sub-items —
// hit every target and the category marks itself done.
// From v3 onward these are just the *default seed*: the person can rename,
// delete, or add their own categories at runtime (see useTracker's
// addCategory/updateCategory/removeCategory) — the full list lives in
// state.categories, not here.
export const DEFAULT_CATEGORIES = [
  {
    id: 'workout',
    label: 'Workout',
    tagline: 'Move your body',
    accent: 'clay',
    icon: 'dumbbell',
  },
  {
    id: 'food',
    label: 'Food',
    tagline: 'Fuel well',
    accent: 'gold',
    icon: 'bowl',
  },
  {
    id: 'learning',
    label: 'Learning',
    tagline: 'Grow a little',
    accent: 'sky',
    icon: 'book',
  },
  {
    id: 'savings',
    label: 'Savings',
    tagline: 'Build the cushion',
    accent: 'moss',
    icon: 'piggy',
  },
]

// Kept for anything that still imports the old name.
export const PILLARS = DEFAULT_CATEGORIES

// Choices offered in the "add / edit category" form.
export const ICON_OPTIONS = ['dumbbell', 'bowl', 'book', 'piggy', 'star', 'flag', 'bolt', 'target']
export const ACCENT_OPTIONS = ['clay', 'gold', 'sky', 'moss', 'core']

// Default sub-items per pillar. Each has a target and a step size used by
// the +/- stepper. Users can also add their own custom sub-items — those
// are merged in at runtime and stored alongside these.
export const DEFAULT_SUB_ITEMS = {
  workout: [
    { id: 'pushups', label: 'Push-ups', unit: 'reps', target: 30, step: 5 },
    { id: 'squats', label: 'Squats', unit: 'reps', target: 25, step: 5 },
    { id: 'plank', label: 'Plank', unit: 'min', target: 3, step: 0.5 },
    { id: 'run', label: 'Running', unit: 'km', target: 2, step: 0.5 },
  ],
  food: [
    { id: 'breakfast', label: 'Breakfast', unit: '', target: 1, step: 1 },
    { id: 'lunch', label: 'Lunch', unit: '', target: 1, step: 1 },
    { id: 'dinner', label: 'Dinner', unit: '', target: 1, step: 1 },
    { id: 'water', label: 'Water', unit: 'glasses', target: 8, step: 1 },
  ],
  learning: [
    { id: 'reading', label: 'Reading', unit: 'pages', target: 20, step: 5 },
    { id: 'practice', label: 'Practice / DSA', unit: 'session', target: 1, step: 1 },
    { id: 'review', label: 'Review notes', unit: 'session', target: 1, step: 1 },
  ],
  savings: [
    { id: 'amount', label: 'Amount saved', unit: '₹', target: 200, step: 50 },
    { id: 'nospend', label: 'No-spend day', unit: '', target: 1, step: 1 },
  ],
}

// Seeded on first run only — user can edit or remove freely afterward.
export const SEED_TASKS = [
  { id: 'seed-1', text: 'Plan tomorrow before bed', recurring: true },
  { id: 'seed-2', text: 'No phone in the first 30 min awake', recurring: true },
]

export const DAILY_QUOTES = [
  'Small and consistent beats big and occasional.',
  "Today doesn't need to be perfect — it needs to be tended.",
  'The streak is a side effect. The showing up is the point.',
  'One log at a time is still a log.',
  'Progress hides in the days that felt ordinary.',
  'You don\u2019t need motivation, you need the next small step.',
  'What you tend to, grows.',
]
