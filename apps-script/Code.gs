/**
 * Tend — Google Sheets backend (optional upgrade path)
 *
 * This is NOT wired up yet. The app works fully offline on localStorage
 * out of the box. Deploy this only when you're ready to sync across
 * devices — same pattern as sridhi-attendance2026's Apps Script backend.
 *
 * Sheet setup:
 *   1. Create a new Google Sheet.
 *   2. Rename the first tab to "Days".
 *   3. Add this header row exactly (row 1):
 *      date | workout_done | workout_note | food_done | food_note |
 *      learning_done | learning_note | savings_done | savings_amount | tasks_json
 *   4. Extensions -> Apps Script, paste this file in, Deploy -> Web app,
 *      execute as "Me", access "Anyone with the link". Copy the /exec URL.
 */

const SHEET_NAME = 'Days'

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
}

function doGet(e) {
  const sheet = getSheet_()
  const values = sheet.getDataRange().getValues()
  const headers = values[0]
  const rows = values.slice(1).map((row) => {
    const obj = {}
    headers.forEach((h, i) => (obj[h] = row[i]))
    return obj
  })
  return ContentService.createTextOutput(JSON.stringify({ days: rows }))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents)
  const sheet = getSheet_()
  const values = sheet.getDataRange().getValues()
  const headers = values[0]
  const dateColIndex = headers.indexOf('date')

  let rowIndex = -1
  for (let i = 1; i < values.length; i++) {
    if (values[i][dateColIndex] === payload.date) {
      rowIndex = i + 1 // 1-indexed sheet row
      break
    }
  }

  const rowData = headers.map((h) => {
    if (h === 'tasks_json') return JSON.stringify(payload.tasks || [])
    return payload[h] ?? ''
  })

  if (rowIndex === -1) {
    sheet.appendRow(rowData)
  } else {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData])
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON)
}
