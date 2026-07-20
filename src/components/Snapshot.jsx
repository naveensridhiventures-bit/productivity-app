import { useRef, useState } from 'react'
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  cloudinaryFetchUrl,
  withTransform,
  EDIT_PRESETS,
} from '../lib/cloudinary'

export default function Snapshot({ today, setPillarPhoto, categories }) {
  const [activePillar, setActivePillar] = useState(categories[0]?.id || null)
  const [remoteUrl, setRemoteUrl] = useState('')
  const [editId, setEditId] = useState('none')
  const [status, setStatus] = useState(null) // { kind: 'ok'|'error', text }
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  const photo = today.pillars?.[activePillar]?.photo || null
  const preset = EDIT_PRESETS.find((p) => p.id === editId) || EDIT_PRESETS[0]
  const displayUrl = photo ? withTransform(photo, preset.transform) : null

  async function handleFile(file) {
    if (!file) return
    setBusy(true)
    setStatus(null)
    try {
      const { url } = await uploadToCloudinary(file)
      setPillarPhoto(activePillar, url)
      setEditId('none')
      setStatus({ kind: 'ok', text: 'Uploaded and attached to today\u2019s ' + activePillar + '.' })
    } catch (err) {
      setStatus({ kind: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  function handleFetchUrl() {
    const url = remoteUrl.trim()
    if (!url) return
    setPillarPhoto(activePillar, cloudinaryFetchUrl(url))
    setEditId('none')
    setRemoteUrl('')
    setStatus({ kind: 'ok', text: 'Fetched via Cloudinary and attached.' })
  }

  return (
    <section className="snapshot-section">
      <h2 className="section-title">Daily snapshot</h2>
      <div className="snapshot-panel">
        {!isCloudinaryConfigured ? (
          <p className="snapshot-config-warning">
            Cloudinary isn't configured yet. Add VITE_CLOUDINARY_CLOUD_NAME and
            VITE_CLOUDINARY_UPLOAD_PRESET to a .env file (see .env.example) — uploads and
            fetch-by-URL will start working immediately after a restart.
          </p>
        ) : null}

        <div className="snapshot-pillar-picker">
          {categories.map((p) => (
            <button
              key={p.id}
              className={`snapshot-pillar-chip ${activePillar === p.id ? 'is-active' : ''}`}
              onClick={() => { setActivePillar(p.id); setEditId('none'); setStatus(null) }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className={`snapshot-drop ${dragOver ? 'is-dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
        >
          {busy ? 'Uploading…' : `Tap or drop a photo for today's ${activePillar}`}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <div className="snapshot-url-row">
          <input
            type="url"
            placeholder="…or paste an image URL to fetch instead"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
          />
          <button className="add-btn small" onClick={handleFetchUrl}>Fetch</button>
        </div>

        {status ? (
          <p className={`snapshot-status ${status.kind === 'ok' ? 'is-ok' : 'is-error'}`}>{status.text}</p>
        ) : null}

        {displayUrl ? (
          <>
            <div className="snapshot-preview">
              <img src={displayUrl} alt={`${activePillar} snapshot`} />
            </div>
            <div className="snapshot-edit-row">
              {EDIT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`snapshot-edit-btn ${editId === p.id ? 'is-active' : ''}`}
                  onClick={() => setEditId(p.id)}
                >
                  {p.label}
                </button>
              ))}
              <button
                className="snapshot-edit-btn"
                onClick={() => { setPillarPhoto(activePillar, null); setStatus(null) }}
              >
                Remove
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
