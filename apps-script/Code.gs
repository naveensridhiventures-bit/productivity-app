/**
 * Tend — Google Sheets backend (optional upgrade path)
 *
 * Turns a Google Sheet into a tiny free database for Tend, so the same
 * data shows up on your phone and your laptop instead of being stuck in
 * one browser's localStorage.
 *
 * Approach: the app's entire state (days, custom sub-items, recurring
 * tasks, target overrides — the exact shape `useTracker.js` already
 * works with) is stored as one JSON blob in a "State" tab. That keeps
 * this script simple and future-proof: if the app's data shape changes
 * later, this script doesn't need to change with it.
 *
 * As a bonus, every write also rebuilds a human-readable "Days" tab
 * (one row per day, plain percentages) purely so you have something
 * nice to glance at if you open the sheet directly — the app itself
 * never reads from "Days", only from "State".
 *
 * ---- One-time setup ----
 * 1. Create a new Google Sheet.
 * 2. Extensions -> Apps Script, delete the placeholder code, paste this
 *    whole file in.
 * 3. Run the `setup` function once from the Apps Script editor (Run menu
 *    -> select "setup" -> Run). This creates the "State" and "Days"
 *    tabs with the right headers. It'll ask you to authorize — that's
 *    expected, allow it.
 * 4. Deploy -> New deployment -> type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone with the link
 *    Deploy, then copy the /exec URL it gives you.
 * 5. Paste that URL into the "Sheets sync" panel in the app.
 *
 * If you ever need to change the code, Deploy -> Manage deployments ->
 * edit -> New version, so the same /exec URL keeps working.
 */

const STATE_SHEET = 'State'
const DAYS_SHEET = 'Days'
const STATE_KEY = 'tend_state'

const PILLAR_IDS = ['workout', 'food', 'learning', 'savings']

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()

  let state = ss.getSheetByName(STATE_SHEET)
  if (!state) state = ss.insertSheet(STATE_SHEET)
  state.clear()
  state.getRange(1, 1, 1, 3).setValues([['key', 'value', 'updated_at']])

  let days = ss.getSheetByName(DAYS_SHEET)
  if (!days) days = ss.insertSheet(DAYS_SHEET)
  days.clear()
  days.getRange(1, 1, 1, 7).setValues([
    ['date', 'workout_%', 'food_%', 'learning_%', 'savings_%', 'tasks_done', 'tasks_total'],
  ])
}

function getStateSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATE_SHEET)
  if (!sheet) throw new Error('Run "setup" once from the Apps Script editor first.')
  return sheet
}

function getDaysSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DAYS_SHEET)
}

// Weighted completion ratio for one pillar on one day — mirrors
// `pillarRatio` in useTracker.js so the Days tab matches what the app shows.
function pillarRatio_(counts) {
  counts = counts || {}
  const ids = Object.keys(counts)
  if (ids.length === 0) return 0
  let sum = 0
  ids.forEach((id) => {
    sum += Math.min(1, Number(counts[id]) > 0 ? 1 : 0)
  })
  return sum / ids.length
}

// Rebuild the human-readable Days tab from the full state blob.
function rebuildDaysTab_(state) {
  const sheet = getDaysSheet_()
  if (!sheet) return
  const days = state.days || {}
  const dates = Object.keys(days).sort()
  const rows = dates.map((date) => {
    const rec = days[date] || {}
    const pillars = rec.pillars || {}
    const pct = (id) => Math.round(pillarRatio_(pillars[id] && pillars[id].counts) * 100)
    const tasks = rec.tasks || []
    return [
      date,
      pct('workout'),
      pct('food'),
      pct('learning'),
      pct('savings'),
      tasks.filter((t) => t.done).length,
      tasks.length,
    ]
  })
  sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), 7).clearContent()
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows)
  }
}

function doGet(e) {
  const sheet = getStateSheet_()
  const values = sheet.getDataRange().getValues()
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === STATE_KEY) {
      return ContentService.createTextOutput(
        JSON.stringify({ state: JSON.parse(values[i][1] || '{}'), updatedAt: values[i][2] || 0 })
      ).setMimeType(ContentService.MimeType.JSON)
    }
  }
  return ContentService.createTextOutput(
    JSON.stringify({ state: null, updatedAt: 0 })
  ).setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents)
  const state = payload.state
  const updatedAt = payload.updatedAt || Date.now()
  const sheet = getStateSheet_()
  const values = sheet.getDataRange().getValues()

  let rowIndex = -1
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === STATE_KEY) {
      rowIndex = i + 1
      break
    }
  }

  const row = [STATE_KEY, JSON.stringify(state), updatedAt]
  if (rowIndex === -1) {
    sheet.appendRow(row)
  } else {
    sheet.getRange(rowIndex, 1, 1, 3).setValues([row])
  }

  try {
    rebuildDaysTab_(state)
  } catch (err) {
    // Non-fatal — the readable tab is a bonus, the State write above already succeeded.
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, updatedAt: updatedAt })
  ).setMimeType(ContentService.MimeType.JSON)
}
