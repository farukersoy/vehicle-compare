// Minimal Wikimedia Commons API client for the one-time image fetch:
// ≤ 1 request/second, exponential backoff on 429/5xx/maxlag, API responses
// cached on disk (scripts/.cache/commons/, gitignored).

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const API = 'https://commons.wikimedia.org/w/api.php'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function createCommonsClient({ userAgent, cacheDir, minIntervalMs = 1000, log = () => {} }) {
  if (/[^\x20-\x7e]/.test(userAgent)) throw new Error(`User-Agent must be plain ASCII: ${userAgent}`)
  let last = 0
  const stats = { requests: 0, cacheHits: 0, retries: 0 }

  async function throttle() {
    const wait = last + minIntervalMs - Date.now()
    if (wait > 0) await sleep(wait)
    last = Date.now()
  }

  async function request(url, { binary = false } = {}) {
    for (let attempt = 0; attempt < 6; attempt++) {
      await throttle()
      stats.requests++
      let res
      try {
        res = await fetch(url, { headers: { 'User-Agent': userAgent, 'Api-User-Agent': userAgent } })
      } catch (err) {
        if (attempt === 5) throw err
        stats.retries++
        await sleep(2000 * 2 ** attempt)
        continue
      }
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get('retry-after')) || 0
        const wait = Math.max(retryAfter * 1000, 2000 * 2 ** attempt)
        log(`  HTTP ${res.status}, retrying in ${Math.round(wait / 1000)} s`)
        stats.retries++
        await sleep(wait)
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      if (binary) return Buffer.from(await res.arrayBuffer())
      const data = await res.json()
      if (data.error?.code === 'maxlag') {
        stats.retries++
        await sleep(5000 * (attempt + 1))
        continue
      }
      if (data.error) throw new Error(`Commons API error ${data.error.code}: ${data.error.info}`)
      return data
    }
    throw new Error(`Giving up after repeated errors: ${url}`)
  }

  /** Cached API GET. `params` are merged with format=json & formatversion=2. */
  async function api(params) {
    const url = new URL(API)
    for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', maxlag: '5', ...params })) {
      url.searchParams.set(k, String(v))
    }
    const key = crypto.createHash('sha1').update(url.toString()).digest('hex')
    const file = path.join(cacheDir, `${key}.json`)
    try {
      const cached = JSON.parse(await fs.readFile(file, 'utf8'))
      stats.cacheHits++
      return cached
    } catch { /* not cached */ }
    const data = await request(url.toString())
    await fs.mkdir(cacheDir, { recursive: true })
    await fs.writeFile(file, JSON.stringify(data))
    return data
  }

  const download = (url) => request(url, { binary: true })

  return { api, download, stats }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

const QUALITY_CATS = [
  'Category:Featured pictures on Wikimedia Commons',
  'Category:Quality images',
  'Category:Valued images',
]

/** imageinfo + quality-category props shared by all file queries. */
export const FILE_PROPS = {
  prop: 'imageinfo|categories',
  iiprop: 'url|size|mime|extmetadata',
  iiurlwidth: '1280',   // Commons only serves standard thumbnail widths (e.g. 500, 960, 1280, 1920)
  iiextmetadatafilter: 'LicenseShortName|License|LicenseUrl|UsageTerms|Artist|Credit|ImageDescription|ObjectName|DateTimeOriginal|DateTime',
  clcategories: QUALITY_CATS.join('|'),
  cllimit: 'max',
}

/** Normalises a file page from a formatversion=2 response. */
export function toFile(page) {
  const ii = page.imageinfo?.[0]
  if (!ii) return null
  const meta = Object.fromEntries(Object.entries(ii.extmetadata ?? {}).map(([k, v]) => [k, v?.value ?? '']))
  const cats = (page.categories ?? []).map((c) => c.title)
  return {
    title: page.title,
    width: ii.width,
    height: ii.height,
    mime: ii.mime,
    url: ii.url,
    thumbUrl: ii.thumburl ?? ii.url,
    pageUrl: ii.descriptionurl,
    meta,
    featured: cats.includes(QUALITY_CATS[0]),
    quality: cats.includes(QUALITY_CATS[1]),
    valued: cats.includes(QUALITY_CATS[2]),
  }
}

export const filesOf = (data) => (data?.query?.pages ?? []).map(toFile).filter(Boolean)

/** Smaller thumbnail URL for review pages (Commons thumbs are /<n>px-<name>). */
export const thumbAt = (url, width) => url.replace(/\/(\d+)px-([^/]+)$/, `/${width}px-$2`)
