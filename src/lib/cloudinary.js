// Cloudinary setup — both values come from a free Cloudinary account:
// 1. Sign up at https://cloudinary.com (free tier is plenty for this app).
// 2. Cloud name: shown on your Dashboard home page.
// 3. Upload preset: Settings -> Upload -> Upload presets -> "Add upload preset",
//    set Signing Mode to "Unsigned", save, and copy its name.
// Put both in a `.env` file at the project root (see `.env.example`):
//   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
//   VITE_CLOUDINARY_UPLOAD_PRESET=your-preset-name
export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

/** Upload a File the user picked/dropped straight to Cloudinary (unsigned). */
export async function uploadToCloudinary(file) {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured yet — add your cloud name and upload preset to .env')
  }
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Upload failed (${res.status}): ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  return { url: data.secure_url, publicId: data.public_id }
}

/**
 * Have Cloudinary fetch + host a remote image URL (no upload needed) — the
 * "fetch" delivery type. Handy for pasting a link instead of uploading a file.
 * `transform` is a Cloudinary transformation string, e.g. "e_grayscale".
 */
export function cloudinaryFetchUrl(remoteUrl, transform = '') {
  if (!CLOUD_NAME) return remoteUrl
  const t = transform ? `${transform}/` : ''
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${t}f_auto,q_auto/${encodeURIComponent(remoteUrl)}`
}

/** Re-write an already-uploaded Cloudinary URL to add/replace a transformation, so edits are just URL params — no re-upload needed. */
export function withTransform(url, transform) {
  if (!url) return url
  const marker = '/image/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url // not a Cloudinary delivery URL (e.g. a fetch URL) — leave as-is
  const before = url.slice(0, idx + marker.length)
  const after = url.slice(idx + marker.length)
  return `${before}${transform ? transform + '/' : ''}${after}`
}

// A few one-tap edits — each is a valid Cloudinary transformation string.
export const EDIT_PRESETS = [
  { id: 'none', label: 'Original', transform: '' },
  { id: 'gray', label: 'Grayscale', transform: 'e_grayscale' },
  { id: 'sepia', label: 'Sepia', transform: 'e_sepia' },
  { id: 'bright', label: 'Brighten', transform: 'e_brightness:30' },
  { id: 'contrast', label: 'Contrast', transform: 'e_contrast:35' },
  { id: 'square', label: 'Square crop', transform: 'c_fill,ar_1:1,g_auto' },
  { id: 'rotate', label: 'Rotate 90°', transform: 'a_90' },
]
