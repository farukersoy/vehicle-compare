#!/usr/bin/env node
/**
 * Fetch real car photos from Wikimedia Commons for the vehicles in
 * src/data/vehicles.ts, and wire the results into that file.
 *
 * Every vehicle entry already carries `image: '/cars/{id}.jpg'` (pre-set
 * to the expected path), but for most of them no file exists yet at
 * public/cars/{id}.jpg — the app just falls back to the SVG silhouette.
 * So "already has a photo" is judged by *file presence on disk*, not by
 * whether the `image:` field is set (it always is). Vehicles that are
 * genuinely missing the field (e.g. new entries added later) get it
 * inserted automatically once their photo is downloaded.
 *
 * Usage:
 *   node scripts/fetch-car-images.js
 *   node scripts/fetch-car-images.js --limit=5      # only process first 5 that need fetching
 *   node scripts/fetch-car-images.js --only=bmw-ix   # process a single vehicle id
 */

const fs = require('fs/promises')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..')
const VEHICLES_FILE = path.join(ROOT, 'src/data/vehicles.ts')
const CARS_DIR = path.join(ROOT, 'public/cars')

const USER_AGENT =
  'vehicle-compare-image-fetcher/1.0 (https://github.com/farukersoy/vehicle-compare; personal project, one-off batch fetch)'

const REQUEST_DELAY_MS = 900
const IMAGE_WIDTH = 800
const IMAGE_HEIGHT = 500

const BLACKLIST_WORDS = [
  'logo', 'badge', 'emblem', 'wordmark', 'icon', 'sign', 'signage',
  'interior', 'dashboard', 'seat', 'engine', 'diagram', 'schematic',
  'map', 'brochure', 'advert', 'poster', 'drawing', 'illustration',
  'line art', 'lineart', 'blueprint', 'chassis', 'crash test', 'sketch',
]

// Body-style / sub-model qualifiers that quietly turn a query into a
// *different* car if present in the candidate title but not the query
// itself (e.g. "Mini Cooper SE" matching a "Mini Cooper SE Countryman"
// photo — same words, different actual vehicle).
const VARIANT_DISAMBIGUATORS = [
  'countryman', 'clubman', 'cabrio', 'cabriolet', 'coupe', 'coupé',
  'roadster', 'estate', 'avant', 'touring', 'kombi', 'sportback',
  'allroad', 'shooting brake', 'wagon', 'tourer', 'gran coupe',
  'fastback', 'active tourer', 'gran turismo',
]

// ─── CLI args ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const limitArg = argv.find((a) => a.startsWith('--limit='))
const onlyArg = argv.find((a) => a.startsWith('--only='))
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity
const ONLY_ID = onlyArg ? onlyArg.split('=')[1] : null

// ─── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

// ─── Parse vehicles.ts (regex-based; no nested braces inside entries) ─────

function parseVehicles(fileText) {
  const arrayMarker = 'export const vehicles: Vehicle[] = ['
  const arrayStart = fileText.indexOf(arrayMarker)
  if (arrayStart === -1) throw new Error('Could not find vehicles array in vehicles.ts')

  const bodyStart = arrayStart + arrayMarker.length
  const closeMatch = /\n\]\n/.exec(fileText.slice(bodyStart))
  if (!closeMatch) throw new Error('Could not find end of vehicles array')
  const bodyEnd = bodyStart + closeMatch.index + 1 // include the leading \n, stop before ]

  const body = fileText.slice(bodyStart, bodyEnd)
  const objects = []
  const objRegex = /\{[^{}]*\}/g
  let m
  while ((m = objRegex.exec(body))) {
    const raw = m[0]
    const id = /(?:^|\n)\s*id:\s*'([^']*)'/.exec(raw)?.[1]
    const brand = /\bbrand:\s*'([^']*)'/.exec(raw)?.[1]
    const model = /\bmodel:\s*'([^']*)'/.exec(raw)?.[1]
    const hasImageField = /\bimage:\s*'([^']*)'/.test(raw)
    if (!id || !brand || !model) continue
    objects.push({
      id,
      brand,
      model,
      hasImageField,
      // offsets are relative to `body`, which itself starts at `bodyStart` in fileText
      startInBody: m.index,
      endInBody: m.index + raw.length,
    })
  }

  return { fileText, bodyStart, bodyEnd, body, objects }
}

/** Insert `image: '/cars/{id}.jpg',` after the brandColor line for entries missing it. */
function insertMissingImageFields(parsed, idsNeedingInsert) {
  if (idsNeedingInsert.size === 0) return parsed.fileText

  // Work back-to-front so earlier offsets stay valid as we splice.
  const targets = parsed.objects
    .filter((o) => idsNeedingInsert.has(o.id))
    .sort((a, b) => b.startInBody - a.startInBody)

  let body = parsed.body
  for (const obj of targets) {
    const raw = body.slice(obj.startInBody, obj.endInBody)
    const brandColorLineMatch = /brandColor:\s*'[^']*',?\n/.exec(raw)
    if (!brandColorLineMatch) continue // unexpected shape; leave it for manual fix
    const insertAt = obj.startInBody + brandColorLineMatch.index + brandColorLineMatch[0].length
    const insertion = `    image: '/cars/${obj.id}.jpg',\n`
    body = body.slice(0, insertAt) + insertion + body.slice(insertAt)
  }

  return parsed.fileText.slice(0, parsed.bodyStart) + body + parsed.fileText.slice(parsed.bodyEnd)
}

// ─── Wikimedia Commons search ───────────────────────────────────────────────

/**
 * Parenthesised spec fragments like "(77.4 kWh)" confuse Commons'
 * CirrusSearch query parser (parens are grouping syntax there) and
 * silently return zero results, so strip them for the search query.
 * Scoring still uses the full original brand/model for word overlap.
 */
function sanitizeForSearch(str) {
  return str.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
}

async function findBestImage(brand, model) {
  const query = sanitizeForSearch(`${brand} ${model}`)
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', query)
  url.searchParams.set('gsrnamespace', '6') // File namespace
  url.searchParams.set('gsrlimit', '10')
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|size|mime')
  url.searchParams.set('format', 'json')

  const data = await fetchJson(url.toString())
  const pages = data?.query?.pages
  if (!pages) return null

  // Split on any non letter/digit so "e:Ny1", "CR-V", "e-tron" etc. tokenize
  // into meaningful word fragments instead of one opaque blob.
  const tokenize = (s) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  const brandWords = tokenize(brand)
  const modelWords = tokenize(model)

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Plain substring containment is unreliable for short/numeric tokens:
  // "3" would "match" inside a photo filename's year ("2023") or date
  // ("08-03-2024"), and "id" would match inside "hybrid". Require the
  // token to sit on a word boundary instead.
  const hasToken = (text, token) => {
    if (!token) return false
    return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegex(token)}(?:[^\\p{L}\\p{N}]|$)`, 'iu').test(text)
  }

  let best = null
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0]
    if (!info) continue
    const mime = info.mime || ''
    if (!mime.startsWith('image/') || mime === 'image/svg+xml') continue
    if ((info.width || 0) < 300 || (info.height || 0) < 200) continue

    const title = (page.title || '').toLowerCase()
    if (BLACKLIST_WORDS.some((w) => title.includes(w))) continue

    const queryLower = `${brand} ${model}`.toLowerCase()
    const hasUnrequestedVariant = VARIANT_DISAMBIGUATORS.some(
      (w) => title.includes(w) && !queryLower.includes(w)
    )
    if (hasUnrequestedVariant) continue

    // Brand name alone is not enough evidence (a Honda HR-V photo would
    // "match" a Honda e:Ny1 query on brand alone) — require genuine
    // overlap with the model name too.
    const brandOk = brandWords.length > 0 && brandWords.every((w) => hasToken(title, w))
    if (!brandOk) continue

    let modelMatches = 0
    let numericTokenMismatch = false
    for (const w of modelWords) {
      const hit = hasToken(title, w)
      // Numeric tokens (e.g. "3" in "ID.3", "2" in "Polestar 2") are usually
      // the ONLY thing distinguishing one trim/generation from another —
      // check these even at length 1, and reject on a miss, since a title
      // missing one is very likely the wrong sibling model even when every
      // other word overlaps (e.g. "ID.3 Pro S" vs "ID.4 Pro S").
      if (/\d/.test(w)) {
        if (hit) modelMatches++
        else numericTokenMismatch = true
        continue
      }
      if (w.length < 2) continue
      if (hit) modelMatches++
    }
    if (modelMatches === 0 || numericTokenMismatch) continue

    let score = 5 + modelMatches * 3
    score += Math.min(info.width || 0, 1600) / 1600 // gentle size tie-break

    if (!best || score > best.score) {
      best = { score, url: info.url, title: page.title, width: info.width, height: info.height }
    }
  }

  return best
}

// ─── Download + normalize ───────────────────────────────────────────────────

async function downloadAndSave(imageUrl, destPath) {
  const res = await fetch(imageUrl, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${imageUrl}`)
  const buffer = Buffer.from(await res.arrayBuffer())

  await sharp(buffer)
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 87 })
    .toFile(destPath)
}

async function fileExists(p) {
  try {
    const stat = await fs.stat(p)
    return stat.isFile() && stat.size > 0
  } catch {
    return false
  }
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const fileText = await fs.readFile(VEHICLES_FILE, 'utf8')
  const parsed = parseVehicles(fileText)

  let vehicles = parsed.objects
  if (ONLY_ID) vehicles = vehicles.filter((v) => v.id === ONLY_ID)

  const succeeded = []
  const skippedExisting = []
  const failed = []
  const idsNeedingImageField = new Set()

  let processedCount = 0

  for (const vehicle of vehicles) {
    const destPath = path.join(CARS_DIR, `${vehicle.id}.jpg`)

    if (await fileExists(destPath)) {
      skippedExisting.push(vehicle)
      continue
    }

    if (processedCount >= LIMIT) break
    processedCount++

    process.stdout.write(`[${vehicle.id}] searching "${vehicle.brand} ${vehicle.model}"... `)

    try {
      const best = await findBestImage(vehicle.brand, vehicle.model)
      if (!best) {
        console.log('no good match')
        failed.push({ ...vehicle, reason: 'no good match found on Commons' })
        await sleep(REQUEST_DELAY_MS)
        continue
      }

      console.log(`found "${best.title}" (${best.width}x${best.height}, score ${best.score.toFixed(1)})`)
      await downloadAndSave(best.url, destPath)

      if (!vehicle.hasImageField) idsNeedingImageField.add(vehicle.id)
      succeeded.push({ ...vehicle, sourceTitle: best.title })
    } catch (err) {
      console.log(`error: ${err.message}`)
      failed.push({ ...vehicle, reason: err.message })
    }

    await sleep(REQUEST_DELAY_MS)
  }

  if (idsNeedingImageField.size > 0) {
    const updatedText = insertMissingImageFields(parsed, idsNeedingImageField)
    await fs.writeFile(VEHICLES_FILE, updatedText, 'utf8')
    console.log(`\nAdded image field to ${idsNeedingImageField.size} vehicle entr${idsNeedingImageField.size === 1 ? 'y' : 'ies'} in vehicles.ts`)
  }

  // ─── Summary ───────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60))
  console.log('SUMMARY')
  console.log('─'.repeat(60))
  console.log(`Total vehicles:        ${vehicles.length}`)
  console.log(`Already had a photo:   ${skippedExisting.length}`)
  console.log(`Newly downloaded:      ${succeeded.length}`)
  console.log(`No match found:        ${failed.length}`)

  if (failed.length > 0) {
    console.log('\nVehicles needing a manual photo:')
    for (const f of failed) {
      console.log(`  - ${f.id}  (${f.brand} ${f.model})${f.reason ? `  — ${f.reason}` : ''}`)
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
