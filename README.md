# Tend — J.A.R.V.I.S. Edition

A daily practice tracker — morning workout, food intake, learning, savings, plus whatever else you add — restyled as a dark, glowing HUD interface (glass panels, arc-reactor mark, scanlines, animated rings). PWA, installable, works offline.

## What's new in this pass

- **Jarvis-style UI** — dark HUD theme, glass panels, glowing rings/edges, animated arc-reactor header mark, scanline overlay, Orbitron/Rajdhani/Share Tech Mono type.
- **Reports panel** (bottom of the app) — one-tap PDF downloads:
  - Full daily report (every pillar + every sub-category + tasks)
  - One report per pillar (Workout / Food / Learning / Savings), broken down by sub-category
  - A 7-day rollup report
  - A raw `.json` backup of everything stored locally
  - All generated on-device with `jspdf` — nothing is uploaded anywhere.
- **Daily Snapshot panel** — attach a photo to any pillar for today, via Cloudinary:
  - Upload a file directly (unsigned upload)
  - Or paste an image URL and have Cloudinary fetch + host it instead
  - One-tap edits (grayscale, sepia, brighten, contrast, square crop, rotate) — these are just Cloudinary URL transforms, so they're instant and don't re-upload anything.
  - Requires a free Cloudinary account — see **Cloudinary setup** below. Until configured, the panel shows a clear inline notice instead of failing silently.

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

## Cloudinary setup (for Daily Snapshot)

1. Create a free account at https://cloudinary.com.
2. Copy your **Cloud name** from the Dashboard home page.
3. Go to Settings -> Upload -> Upload presets -> **Add upload preset**, set **Signing Mode** to `Unsigned`, save, and copy its name.
4. Copy `.env.example` to `.env` in the project root and fill in both values:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-preset-name
   ```
5. Restart `npm run dev`. The Daily Snapshot panel's config warning disappears once both are set.

`.env` is already in `.gitignore` — don't commit it. On Vercel, add the same two variables under Project Settings -> Environment Variables.

## Ideas for what to add next

Roughly in order of how much value they'd add for the effort:

- **Reminders/notifications** — a scheduled browser notification ("Log today's workout") using the Notifications API + the PWA service worker already in place.
- **Monthly/trend charts** — a simple line or bar chart (e.g. with a tiny inline SVG, no new dependency) showing each pillar's completion % over 30 days, so patterns show up before a streak breaks.
- **Voice input, Jarvis-style** — Web Speech API for "log 20 push-ups" style quick entry; fits the theme well and needs no backend.
- **Cross-device sync** — the README already documents a Google Sheets/Apps Script path (`apps-script/Code.gs`); wiring `loadState`/`saveState` in `useTracker.js` to it is the only change needed.
- **Goals & milestones** — e.g. "30-day workout streak" as a named goal with its own progress bar and a small badge on completion.
- **Weekly email/WhatsApp digest** — send the same data that powers the 7-day PDF report as a scheduled message (would need a small backend, e.g. the same Apps Script pattern).
- **Multiple photo history, not just today's** — a small gallery per pillar instead of one photo slot, so the snapshot panel becomes a visual log over time.
- **Dark/light theme toggle** — keep this HUD look as one theme and offer the original warm "Tend" look as an alternate, switchable in one tap.
- **Import** to complement the JSON backup export — restore from a previously downloaded backup file.

## Icons

`public/icon-192.png` and `public/icon-512.png` are placeholder ring icons — swap them for anything you like, same filenames.
