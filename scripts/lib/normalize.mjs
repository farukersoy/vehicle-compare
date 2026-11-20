// Normalises a downloaded photo: auto-trim, fit into an 800×500 white canvas
// with 6 % padding (car centred), WebP ≈ q80, stepping quality down until the
// file is under 80 KB.

import sharp from 'sharp'

export const CANVAS = { width: 800, height: 500, padding: 0.06, maxBytes: 80 * 1024 }
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

export async function normalizeImage(input) {
  const base = await sharp(input).rotate().flatten({ background: WHITE }).toBuffer()

  // Trim uniform borders (studio shots, letterboxing). Fall back if trimming fails or eats the picture.
  let trimmed = base
  try {
    const out = await sharp(base).trim({ threshold: 20 }).toBuffer({ resolveWithObject: true })
    if (out.info.width > 200 && out.info.height > 120) trimmed = out.data
  } catch { /* nothing to trim */ }

  const innerW = Math.round(CANVAS.width * (1 - 2 * CANVAS.padding))
  const innerH = Math.round(CANVAS.height * (1 - 2 * CANVAS.padding))
  const fitted = await sharp(trimmed)
    .resize(innerW, innerH, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true })

  const composite = (quality) => sharp({
    create: { width: CANVAS.width, height: CANVAS.height, channels: 3, background: WHITE },
  })
    .composite([{
      input: fitted.data,
      left: Math.round((CANVAS.width - fitted.info.width) / 2),
      top: Math.round((CANVAS.height - fitted.info.height) / 2),
    }])
    .webp({ quality, effort: 5 })
    .toBuffer()

  let quality = 80
  let out = await composite(quality)
  while (out.length >= CANVAS.maxBytes && quality > 45) {
    quality -= 5
    out = await composite(quality)
  }
  return { buffer: out, quality, bytes: out.length, underLimit: out.length < CANVAS.maxBytes }
}
