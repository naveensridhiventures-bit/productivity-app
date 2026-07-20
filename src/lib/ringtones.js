// Every "ringtone" here is just a short note pattern synthesized live with
// the Web Audio API — no external audio files to fetch or bundle, and it
// works offline. Each pattern is [{ freq, dur, gap, type }] played in
// sequence, then the whole thing loops until stop() is called.

export const RINGTONES = [
  { id: 'chime', label: 'Soft Chime' },
  { id: 'digital', label: 'Digital Beep' },
  { id: 'bells', label: 'Gentle Bells' },
  { id: 'pulse', label: 'Alert Pulse' },
  { id: 'siren', label: 'Retro Siren' },
]

const PATTERNS = {
  chime: [
    { freq: 880, dur: 0.18, gap: 0.06, type: 'sine' },
    { freq: 1108, dur: 0.18, gap: 0.06, type: 'sine' },
    { freq: 1318, dur: 0.32, gap: 0.5, type: 'sine' },
  ],
  digital: [
    { freq: 1200, dur: 0.09, gap: 0.07, type: 'square' },
    { freq: 1200, dur: 0.09, gap: 0.07, type: 'square' },
    { freq: 1200, dur: 0.09, gap: 0.5, type: 'square' },
  ],
  bells: [
    { freq: 1046, dur: 0.4, gap: 0.15, type: 'triangle' },
    { freq: 784, dur: 0.4, gap: 0.15, type: 'triangle' },
    { freq: 1046, dur: 0.5, gap: 0.6, type: 'triangle' },
  ],
  pulse: [
    { freq: 660, dur: 0.12, gap: 0.08, type: 'sawtooth' },
    { freq: 660, dur: 0.12, gap: 0.08, type: 'sawtooth' },
    { freq: 660, dur: 0.12, gap: 0.08, type: 'sawtooth' },
    { freq: 660, dur: 0.12, gap: 0.5, type: 'sawtooth' },
  ],
  siren: [
    { freq: 500, dur: 0.3, gap: 0, type: 'sine' },
    { freq: 900, dur: 0.3, gap: 0.4, type: 'sine' },
  ],
}

let ctx = null
function getCtx() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// Call once from a real user gesture (a button tap) so the browser's
// autoplay policy lets alarms play sound later without needing a fresh
// gesture at fire-time.
export function unlockAudio() {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  gain.gain.value = 0
  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.01)
}

function playPatternOnce(c, pattern, startAt) {
  let t = startAt
  for (const note of pattern) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = note.type
    osc.frequency.setValueAtTime(note.freq, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.28, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + note.dur)
    osc.connect(gain).connect(c.destination)
    osc.start(t)
    osc.stop(t + note.dur + 0.02)
    t += note.dur + note.gap
  }
  return t
}

/**
 * Loop a ringtone until the returned stop() is called (or `maxMs` elapses,
 * as a safety net in case a popup never gets dismissed).
 */
export function playRingtone(id, { maxMs = 45000 } = {}) {
  const c = getCtx()
  const pattern = PATTERNS[id] || PATTERNS.chime
  if (!c) return () => {}

  let stopped = false
  let timers = []
  const loopLen = pattern.reduce((s, n) => s + n.dur + n.gap, 0)

  function scheduleLoop(startAt) {
    if (stopped) return
    playPatternOnce(c, pattern, startAt)
    const id2 = setTimeout(() => scheduleLoop(c.currentTime), Math.max(loopLen, 0.3) * 1000)
    timers.push(id2)
  }

  scheduleLoop(c.currentTime + 0.02)
  const safety = setTimeout(() => stop(), maxMs)
  timers.push(safety)

  function stop() {
    stopped = true
    timers.forEach(clearTimeout)
    timers = []
  }

  return stop
}

/** One short preview note, used by the "test" button in the alarm form. */
export function previewRingtone(id) {
  return playRingtone(id, { maxMs: 1600 })
}
