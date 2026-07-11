// Talks to the Apps Script web app deployed from apps-script/Code.gs.
// The whole tracker state travels as one JSON blob (see that file for why),
// tagged with an `updatedAt` timestamp so both sides can agree on which
// copy is newer without any real conflict resolution logic.

const URL_KEY = 'tend:sheetSyncUrl'

export function getSyncUrl() {
  try {
    return localStorage.getItem(URL_KEY) || ''
  } catch (e) {
    return ''
  }
}

export function setSyncUrl(url) {
  try {
    if (url) localStorage.setItem(URL_KEY, url)
    else localStorage.removeItem(URL_KEY)
  } catch (e) {
    console.warn('Failed to save sync URL', e)
  }
}

// Apps Script's /exec endpoint replies to a plain GET with the last-saved
// state; `fetch` with mode 'cors' works fine against it once deployed with
// "Anyone with the link" access.
export async function fetchRemoteState(url) {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`Sync fetch failed (${res.status})`)
  return res.json() // { state, updatedAt }
}

// Apps Script quirk: it doesn't set CORS headers on POST responses in the
// same way GET does, so we send the body as text/plain to keep it a
// "simple request" the browser won't preflight — the script still parses
// it fine with JSON.parse(e.postData.contents).
export async function pushRemoteState(url, state, updatedAt) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ state, updatedAt }),
  })
  if (!res.ok) throw new Error(`Sync push failed (${res.status})`)
  return res.json()
}
