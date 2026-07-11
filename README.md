# Tend

A daily practice tracker — morning workout, food intake, learning, savings, plus whatever else you add. PWA, installable, works offline.

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

## Moving to Google Sheets later (optional)

Right now everything is local to the device — nothing syncs. When you're ready to sync across your phone and laptop the way your other apps do:

1. `apps-script/Code.gs` is a ready-to-deploy backend, same shape as `sridhi-attendance2026`'s.
2. Follow the setup comment at the top of that file (sheet + header row + deploy as web app).
3. In `src/hooks/useTracker.js`, `loadState`/`saveState` are the only two functions that need to change — swap them for `fetch` calls to your Apps Script `/exec` URL. The rest of the app doesn't need to change, since it only talks to the hook.

## Deploying

Same flow as your other apps:

```powershell
npm install -g vercel   # if not already installed
vercel
```

Or push to a new GitHub repo and connect it in the Vercel dashboard. Either way, run `npm run build` first if you want to sanity-check the production build locally with `npm run preview`.

## Icons

`public/icon-192.png` and `public/icon-512.png` are placeholder ring icons — swap them for anything you like, same filenames.
