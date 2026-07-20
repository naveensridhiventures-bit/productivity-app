# Tend — J.A.R.V.I.S. Edition

A daily practice tracker — morning workout, food intake, learning, savings, plus whatever else you add — restyled as a dark, glowing HUD interface (glass panels, arc-reactor mark, scanlines, animated rings). PWA, installable, works offline.

## What's new in this pass

- **Jarvis-style UI** — dark HUD theme, glass panels, glowing rings/edges, animated arc-reactor header mark, scanline overlay, Orbitron/Rajdhani/Share Tech Mono type.
- **Reports panel** (bottom of the app) — one-tap PDF downloads:
  - Full daily report (every pillar + every sub-category + tasks)
  - One report per pillar (Workout / Food / Learning / Savings), broken down by sub-category
  - A 7-day rollup report
  - A **custom date range** report — pick any two dates (or use the Today / This week / Last 7 days / This month / Last 30 days presets) and download a PDF covering exactly that range, pulled from full history
  - A raw `.json` backup of everything stored locally
  - All generated on-device with `jspdf` — nothing is uploaded anywhere.
- **Editable categories** — rename or delete any category (default or custom), and add brand-new ones with your own icon/color via the "+ New category" card. Sub-categories within each are fully add/edit/delete too, not just the custom ones.
- **Alarms** — separate from daily tracking: set any number of named alarms with a time, a note, and a choice of synthesized ringtone. When one fires you get a full-screen animated pop-up plus the ringtone, with Snooze/Dismiss. 100% on-device, no internet required to fire.
- **Analytics dashboard** — bar/line/radar charts (via `recharts`) over 7/30/90 days or all-time, plus plain-English insight callouts (strongest area, weakest area, trending up/down). Also exports the full history to a real `.xlsx` workbook (via `xlsx`/SheetJS), one sheet per category.

## Run it locally

```powershell
npm install
npm run dev
```

Opens on `http://localhost:5173`. Install it to your phone or desktop from the browser's "Install app" prompt once you deploy it — that needs HTTPS, so it won't show on localhost.

## How it's built

- **React + Vite**, plain CSS with design tokens in `src/index.css` (no Tailwind — kept it hand-tuned so the look stays distinctive).
- **`vite-plugin-pwa`** handles the manifest and service worker — installable, offline-capable out of the box.
- **Data lives in `localStorage` for now**, behind a single hook: `src/hooks/useTracker.js`. That's the only file that touches storage.

## The four pillars + tasks

- Workout, food, learning, savings are always present — tap the circle to mark done, tap the text to add a quick note (or an amount, for savings).
- Streaks (the small gold badge) count consecutive days a pillar was completed.
- The ring at the top fills as you tend to things — the four dots around it light up as each pillar is marked done.
- Below that: today's task list — daily regulars plus anything you add. Check "repeat daily" on a new task to make it a permanent fixture; otherwise it's just for today.
- "This week" shows a 7-day trail, one dot per day, shaded by how much of the day got tended to.

## Google Sheets sync (cross-device)

Data lives in `localStorage` by default, but a "Sheets sync" panel (below Reports) lets you sync it to a free Google Sheet so the same data shows up on your phone and your laptop.

**One-time setup:**
1. Create a new Google Sheet.
2. Extensions → Apps Script, paste in `apps-script/Code.gs`.
3. Run the `setup` function once (Run menu → select `setup` → Run) — it creates the `State` and `Days` tabs. It'll ask to authorize; allow it.
4. Deploy → New deployment → type "Web app" → Execute as **Me** → Who has access **Anyone with the link** → Deploy. Copy the `/exec` URL.
5. Paste that URL into the "Sheets sync" panel in the app and hit Connect.

**How it works:** the whole tracker state (days, custom sub-items, tasks, target overrides) travels as one JSON blob in the `State` tab — that keeps the script simple and means it doesn't need updating every time the app's data shape changes. A `Days` tab is also rebuilt on every write with plain percentages per day, purely so the sheet is readable if you open it directly; the app itself never reads from it.

Sync is whole-state **last-write-wins** by timestamp: it pulls on load and when the tab regains focus, and pushes ~1.5s after you stop making changes. That's simple and predictable for one person's phone + laptop, but it doesn't merge concurrent edits — if you change things on two devices in the same few seconds before either syncs, the last one to save wins.

- `apps-script/Code.gs` — the backend, deployed as a Google Apps Script web app.
- `src/lib/sheetSync.js` — fetch/push helpers talking to that web app.
- `src/hooks/useTracker.js` — owns the sync status, debounced push, and pull-on-focus logic; `loadState`/`saveState` inside it still always write to `localStorage` first, so the app keeps working offline even if the sheet is unreachable.
- `src/components/SheetSync.jsx` — the settings panel UI.

## Deploying

Same flow as your other apps:

```powershell
npm install -g vercel   # if not already installed
vercel
```

Or push to a new GitHub repo and connect it in the Vercel dashboard. Either way, run `npm run build` first if you want to sanity-check the production build locally with `npm run preview`.

## Reminders

A per-pillar "Reminders" panel sits between the week trail and the sync panel — one switch and one time picker per pillar (Workout, Food, Learning, Savings), each independent. Arm any of them, grant the browser permission when prompted, and each armed pillar pings you once at its own time — only if that specific pillar is still undone. Defaults are 7am workout, 1pm food, 6pm learning, 9pm savings, but every time is editable. It's fully on-device:

- `src/lib/notifications.js` — thin wrapper around the Notification API (permission checks + firing, preferring the service worker registration so it still fires with the tab backgrounded).
- `src/hooks/useReminders.js` — owns each pillar's on/off + time (persisted to `localStorage` under `tend:reminders:v2`), and schedules the next check with `setTimeout` — always waking for whichever armed pillar's time is soonest — re-checking on tab-focus and at least every 6h so it recovers cleanly after the device sleeps or the tab was closed.
- `src/components/Reminders.jsx` — the settings panel UI (one row per pillar, plus a shared status line and test button).

Since this has no server or push subscription, it only fires while the browser itself is running (even if the tab isn't focused) — it won't wake a fully closed browser. That's the tradeoff for staying 100% local; true background push would need the Apps Script backend plus a push service.

## Ideas for what to add next

Roughly in order of how much value they'd add for the effort:

- **Monthly/trend charts** — a simple line or bar chart (e.g. with a tiny inline SVG, no new dependency) showing each pillar's completion % over 30 days, so patterns show up before a streak breaks.
- **Voice input, Jarvis-style** — Web Speech API for "log 20 push-ups" style quick entry; fits the theme well and needs no backend.
- **Cross-device sync** — the README already documents a Google Sheets/Apps Script path (`apps-script/Code.gs`); wiring `loadState`/`saveState` in `useTracker.js` to it is the only change needed.
- **Goals & milestones** — e.g. "30-day workout streak" as a named goal with its own progress bar and a small badge on completion.
- **Weekly email/WhatsApp digest** — send the same data that powers the 7-day PDF report as a scheduled message (would need a small backend, e.g. the same Apps Script pattern).
- **Dark/light theme toggle** — keep this HUD look as one theme and offer the original warm "Tend" look as an alternate, switchable in one tap.
- **Import** to complement the JSON backup export — restore from a previously downloaded backup file.

## Icons

`public/icon-192.png` and `public/icon-512.png` are placeholder ring icons — swap them for anything you like, same filenames.
