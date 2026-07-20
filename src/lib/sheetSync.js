// The sync endpoint is fixed here in source rather than typed into the UI —
// simpler and harder to accidentally break by pasting the wrong thing.
// Point this at your own deployed apps-script/Code.gs URL, or clear it to
// disable sync entirely (the app works fully offline either way).
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxu3I7eSfwvVLk-_VHYmX_Y4rDb2bV6fZwTFaA0ecSgutx8UPTvcTGeaoZovO6uAnNP8Q/exec'

export function getSyncUrl() {
  return SHEETS_URL
}

export async function fetchRemoteState() {
  const res = await fetch(SHEETS_URL, { method: 'GET' })
  if (!res.ok) throw new Error(`Sync fetch failed (${res.status})`)
  return res.json()
}

export async function pushRemoteState(state, updatedAt) {
  const res = await fetch(SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ state, updatedAt }),
  })
  if (!res.ok) throw new Error(`Sync push failed (${res.status})`)
  return res.json()
}
