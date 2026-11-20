#!/usr/bin/env node
/**
 * One-time photo fetch from Wikimedia Commons (self-hosted, never hotlinked).
 *
 *   npm run fetch-images                        dry run: report + scripts/image-review.html
 *   npm run fetch-images -- --apply             download, normalise to public/cars/<id>.webp,
 *                                               set `image` in vehicles.ts, write photo credits
 *   npm run fetch-images -- --only id1,id2      restrict to these vehicle ids
 *   npm run fetch-images -- --backfill-credits  find the Commons source of existing JPGs
 *
 * Only vehicles whose image FILE is missing on disk are processed. Requires
 * WIKIMEDIA_CONTACT (env or .env.local) – it goes into the User-Agent as
 * Wikimedia's API etiquette asks. Decisions: scripts/image-overrides.json
 * { "<id>": "File:Exact name.jpg" | "skip" }.
 */

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import {
  PATHS, p, parseArgs, loadTsModule, readJson, writeJson, loadDotEnv, dirSize, fmtBytes, mdTable,
} from './lib/common.mjs'
import { createCommonsClient, FILE_PROPS, filesOf, thumbAt } from './lib/commons.mjs'
import { makeMatcher, rejectReason, checkLicense, authorOf, scoreFile, stripHtml } from './lib/image-match.mjs'
import { normalizeImage } from './lib/normalize.mjs'
import { setField, jsString } from './lib/vehicles-file.mjs'

const args = parseArgs()
const APPLY = !!args.apply
const ONLY = args.only ? new Set(String(args.only).split(',').map((s) => s.trim()).filter(Boolean)) : null
const LIMIT = args.limit ? Number(args.limit) : Infinity
const BACKFILL = !!args['backfill-credits']

loadDotEnv()
const CONTACT = process.env.WIKIMEDIA_CONTACT?.trim()
if (!CONTACT) {
  console.error(`
WIKIMEDIA_CONTACT is not set.

Wikimedia asks automated clients to identify themselves with a way to contact
the operator (an e-mail address or a URL). Set it once, e.g. in .env.local
(gitignored):

  echo 'WIKIMEDIA_CONTACT=you@example.com' >> .env.local

or for a single run:

  WIKIMEDIA_CONTACT=https://example.com/contact npm run fetch-images
`)
  process.exit(2)
}

const USER_AGENT = `vehicle-compare-bulk-images/1.0 (${CONTACT}) one-time batch, max 1 req/s`
const log = (...a) => console.log(...a)
const client = createCommonsClient({ userAgent: USER_AGENT, cacheDir: path.join(PATHS.cache, 'commons'), log })

// ─── Inputs ───────────────────────────────────────────────────────────────────

const { vehicles } = await loadTsModule(PATHS.vehicles)
const preview = (await readJson(PATHS.importPreview, [])).map((v) => ({ ...v, preview: true }))
const known = new Set(vehicles.map((v) => v.id))
const all = [...vehicles, ...preview.filter((v) => !known.has(v.id))]

const imageOverrides = await readJson(p('scripts/image-overrides.json'), {})
const aliases = await readJson(p('scripts/model-aliases.json'), {})
const credits = await readJson(PATHS.credits, [])
const creditIds = new Set(credits.map((c) => c.vehicleId))

const imageFiles = (v) => [v.image && path.join(p('public'), v.image), path.join(PATHS.cars, `${v.id}.webp`), path.join(PATHS.cars, `${v.id}.jpg`)]
  .filter(Boolean)
const hasImageFile = (v) => imageFiles(v).some((f) => existsSync(f))

const sizeBefore = await dirSize(PATHS.cars)

if (BACKFILL) {
  await backfillCredits()
  process.exit(0)
}

let todo = all.filter((v) => !hasImageFile(v))
if (ONLY) {
  const unknown = [...ONLY].filter((id) => !all.some((v) => v.id === id))
  if (unknown.length) log(`Unknown ids (not in vehicles.ts or the last import dry run): ${unknown.join(', ')}`)
  const withFile = all.filter((v) => ONLY.has(v.id) && hasImageFile(v)).map((v) => v.id)
  if (withFile.length) log(`Already have an image file (skipped): ${withFile.join(', ')}`)
  todo = todo.filter((v) => ONLY.has(v.id))
}
todo = todo.slice(0, LIMIT)
log(`${todo.length} vehicle(s) without an image file to process${APPLY ? '' : ' (dry run)'}.\n`)

// ─── Candidate search ─────────────────────────────────────────────────────────

async function filesInCategory(cat) {
  const data = await client.api({ action: 'query', generator: 'categorymembers', gcmtitle: cat, gcmtype: 'file', gcmlimit: '100', ...FILE_PROPS })
  return filesOf(data)
}

async function findCategories(v, matcher) {
  const terms = [matcher.searchText, ...(aliases[v.id] ?? [])]
  const found = new Map()
  for (const q of terms) {
    const data = await client.api({ action: 'query', list: 'search', srsearch: q, srnamespace: '14', srlimit: '10' })
    for (const hit of data?.query?.search ?? []) {
      const name = hit.title.replace(/^Category:/, '')
      if (/\b(interior|engine|details?|logos?|badges?|concept|prototypes?|models? \(toy|scale models?|racing|rally)\b/i.test(name)) continue
      if (matcher.test(name).ok && !matcher.test(name).ambiguous) found.set(hit.title, name)
    }
  }
  // Prefer the shortest (most generic) matching name, e.g. "Volkswagen ID.3" over "Volkswagen ID.3 GTX".
  return [...found.keys()].sort((a, b) => a.length - b.length).slice(0, 2)
}

async function gatherCandidates(v) {
  const matcher = makeMatcher(v.brand, v.model)
  const candidates = new Map()
  const rejected = []
  const consider = (file, source) => {
    if (!file || candidates.has(file.title)) return
    const fromCategory = source.startsWith('category')
    const match = matcher.test(`${file.title} ${stripHtml(file.meta?.ObjectName)}`, { requireBrand: !fromCategory })
    if (!match.ok) return rejected.push({ file, reason: match.reason })
    const reject = rejectReason(file)
    if (reject) return rejected.push({ file, reason: reject })
    const license = checkLicense(file.meta)
    if (!license.ok) return rejected.push({ file, reason: license.reason })
    const { score, why } = scoreFile(file, { fromCategory })
    candidates.set(file.title, { file, source, license, author: authorOf(file.meta), score, why, ambiguous: match.ambiguous })
  }

  // 1) The model's category, plus one level of subcategories named after the model/generation.
  const cats = await findCategories(v, matcher)
  for (const cat of cats) {
    for (const f of await filesInCategory(cat)) consider(f, `category ${cat}`)
    const subs = await client.api({ action: 'query', list: 'categorymembers', cmtitle: cat, cmtype: 'subcat', cmlimit: '100' })
    const relevant = (subs?.query?.categorymembers ?? [])
      .map((c) => c.title)
      .filter((t) => matcher.test(t.replace(/^Category:/, '')).ok)
      .filter((t) => !/\b(interior|engine|details?|logos?|badges?|wheels?|concept|prototypes?|scale models?|toy|racing|rally|police|taxi)\b/i.test(t))
      .slice(0, 6)
    for (const sub of relevant) for (const f of await filesInCategory(sub)) consider(f, `category ${sub}`)
  }

  // 2) File search: brand + core model (spec text removed), plus aliases.
  const queries = [...new Set([matcher.searchText, ...(aliases[v.id] ?? [])])]
  for (const q of queries) {
    const data = await client.api({
      action: 'query', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '30', ...FILE_PROPS,
    })
    for (const f of filesOf(data)) consider(f, `search "${q}"`)
  }

  const ranked = [...candidates.values()].sort((a, b) => b.score - a.score)
  return { matcher, categories: cats, ranked, rejected }
}

async function fileByTitle(title) {
  const data = await client.api({ action: 'query', titles: title, ...FILE_PROPS })
  return filesOf(data)[0] ?? null
}

// ─── Process ──────────────────────────────────────────────────────────────────

const results = []
for (const [i, v] of todo.entries()) {
  const label = `[${i + 1}/${todo.length}] ${v.id}`
  const override = imageOverrides[v.id]
  try {
    if (override === 'skip') {
      results.push({ v, status: 'skipped', note: 'image-overrides.json: skip' })
      log(`${label}: skipped (override)`)
      continue
    }
    if (typeof override === 'string' && override.startsWith('File:')) {
      const file = await fileByTitle(override)
      const license = file && checkLicense(file.meta)
      if (!file) results.push({ v, status: 'not-found', note: `override file not found: ${override}` })
      else if (!license.ok) results.push({ v, status: 'not-found', note: `override rejected: ${license.reason}` })
      else results.push({ v, status: 'found', chosen: { file, license, author: authorOf(file.meta), source: 'override', score: 0, why: ['override'] }, alternatives: [] })
      log(`${label}: override ${override} → ${results.at(-1).status}`)
      continue
    }

    const { ranked, rejected, categories } = await gatherCandidates(v)
    const unambiguous = ranked.filter((c) => !c.ambiguous)
    const chosen = unambiguous[0] ?? ranked[0]
    if (!chosen) {
      results.push({ v, status: 'not-found', rejected: rejected.slice(0, 5), categories })
      log(`${label}: not found (${rejected.length} rejected)`)
      continue
    }
    const reasons = []
    if (!chosen.source.startsWith('category')) reasons.push('found by search only (no model category)')
    if (chosen.ambiguous) reasons.push(chosen.ambiguous)
    const status = reasons.length ? 'needs-review' : 'found'
    results.push({ v, status, chosen, reasons, categories, alternatives: ranked.filter((c) => c !== chosen).slice(0, 3) })
    log(`${label}: ${status} → ${chosen.file.title} (score ${chosen.score})`)
  } catch (err) {
    results.push({ v, status: 'not-found', note: `error: ${err.message}` })
    log(`${label}: error ${err.message}`)
  }
}

// ─── Apply ────────────────────────────────────────────────────────────────────

const applied = []
if (APPLY) {
  let vehiclesText = await fs.readFile(PATHS.vehicles, 'utf8')
  for (const r of results.filter((x) => x.status === 'found')) {
    if (r.v.preview) { r.note = 'not in vehicles.ts yet – run the import with --apply first'; continue }
    const buf = await client.download(r.chosen.file.thumbUrl)
    const { buffer, bytes, quality, underLimit } = await normalizeImage(buf)
    await fs.writeFile(path.join(PATHS.cars, `${r.v.id}.webp`), buffer)
    vehiclesText = setField(vehiclesText, r.v.id, 'image', jsString(`/cars/${r.v.id}.webp`))
    upsertCredit(r.v.id, r.chosen)
    applied.push(r.v.id)
    r.note = `saved ${Math.round(bytes / 1024)} KB (q${quality})${underLimit ? '' : ' – over 80 KB!'}`
    log(`  saved public/cars/${r.v.id}.webp (${Math.round(bytes / 1024)} KB)`)
  }
  await fs.writeFile(PATHS.vehicles, vehiclesText)
  await writeJson(PATHS.credits, credits.sort((a, b) => a.vehicleId.localeCompare(b.vehicleId)))
}

function upsertCredit(vehicleId, c) {
  const entry = {
    vehicleId,
    fileTitle: c.file.title,
    author: c.author || 'unknown (see source page)',
    licenseName: c.license.name,
    licenseUrl: c.license.url,
    sourceUrl: c.file.pageUrl,
    modified: true,
  }
  const i = credits.findIndex((x) => x.vehicleId === vehicleId)
  if (i >= 0) credits[i] = entry
  else credits.push(entry)
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

const sizeAfter = await dirSize(PATHS.cars)
const by = (s) => results.filter((r) => r.status === s)

const PAINTS = ['white', 'silver metallic', 'dark grey metallic', 'black', 'deep blue metallic', 'red']
const paintFor = (id) => PAINTS[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % PAINTS.length]
const displayModel = (v) => v.model.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()

const md = ['# Image report', '',
  `- Mode: **${APPLY ? 'APPLY' : 'dry run'}** · ${todo.length} vehicle(s) processed · API requests ${client.stats.requests}, cache hits ${client.stats.cacheHits}, retries ${client.stats.retries}`,
  `- Found: **${by('found').length}** · needs review: **${by('needs-review').length}** · not found: **${by('not-found').length}** · skipped: ${by('skipped').length}`,
  `- public/cars/: before ${fmtBytes(sizeBefore.bytes)} (${sizeBefore.count} files) · after ${fmtBytes(sizeAfter.bytes)} (${sizeAfter.count} files)${APPLY ? ` · ${applied.length} written` : ' (dry run: unchanged)'}`,
  '- Review page (local): `scripts/image-review.html` · decisions: `scripts/image-overrides.json`', '',
  '## Found', '',
  mdTable(['id', 'file', 'licence', 'author', 'score', 'note'], by('found').map((r) =>
    [r.v.id, r.chosen.file.title, r.chosen.license.name, r.chosen.author, r.chosen.score, r.note ?? (r.v.preview ? 'from import preview' : '')])),
  '## Needs review', '',
  mdTable(['id', 'proposed file', 'why'], by('needs-review').map((r) => [r.v.id, r.chosen.file.title, r.reasons.join('; ')])),
  '## Not found', '',
  mdTable(['id', 'vehicle', 'detail'], by('not-found').map((r) => [r.v.id, `${r.v.brand} ${r.v.model}`,
    r.note ?? (r.rejected?.length ? `rejected: ${r.rejected.slice(0, 3).map((x) => `${x.file.title} (${x.reason})`).join('; ')}` : 'no candidates')])),
]
if (by('skipped').length) md.push('## Skipped', '', mdTable(['id', 'note'], by('skipped').map((r) => [r.v.id, r.note])))
const reportText = md.join('\n')
await fs.writeFile(p('scripts/image-report.md'), reportText)
log('\n' + reportText)

const notFound = by('not-found')
const prompts = ['# Gemini image prompts', '',
  'For vehicles without a usable Commons photo. Save each result as the target file (800×500, white',
  'background, under 80 KB) and set `image: \'/cars/<id>.webp\'` on that vehicle in src/data/vehicles.ts.', '',
  ...notFound.flatMap((r) => [
    `## ${r.v.brand} ${displayModel(r.v)}`, '',
    `Target file: \`public/cars/${r.v.id}.webp\``, '',
    '```',
    `Generate a photorealistic studio image of a ${r.v.brand} ${displayModel(r.v)}, 3/4 front angle, pure white background, professional automotive studio lighting, no watermark, no text, no logo overlay, car centered in frame, ${paintFor(r.v.id)} paint`,
    '```', '',
  ]),
]
await fs.writeFile(p('scripts/gemini-image-prompts.md'), notFound.length ? prompts.join('\n') : '# Gemini image prompts\n\n_No missing photos in the last run._\n')

await fs.writeFile(p('scripts/image-review.html'), reviewHtml(results))
log('\nWrote scripts/image-report.md, scripts/image-review.html, scripts/gemini-image-prompts.md.')

// ─── Review page ──────────────────────────────────────────────────────────────

function reviewHtml(rs) {
  const h = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const card = (c, chosen) => `
    <figure class="${chosen ? 'chosen' : ''}">
      <a href="${h(c.file.pageUrl)}" target="_blank" rel="noreferrer"><img loading="lazy" src="${h(thumbAt(c.file.thumbUrl, 500))}" alt=""></a>
      <figcaption>
        <code title="copy into image-overrides.json">${h(c.file.title)}</code>
        <span>${c.file.width}×${c.file.height} · ${h(c.license.name)} · ${h(c.author || 'unknown author')}</span>
        <span class="muted">score ${c.score} — ${h((c.why ?? []).join(', '))}</span>
        <span class="muted">${h(c.source ?? '')}</span>
      </figcaption>
    </figure>`
  const section = (r) => {
    const badge = { found: 'found', 'needs-review': 'needs review', 'not-found': 'not found', skipped: 'skipped' }[r.status]
    return `
  <section class="${r.status}">
    <h2>${h(r.v.brand)} ${h(r.v.model)} <small>${h(r.v.id)}</small> <span class="badge ${r.status}">${badge}</span></h2>
    ${r.reasons?.length ? `<p class="why">${h(r.reasons.join(' · '))}</p>` : ''}
    ${r.note ? `<p class="muted">${h(r.note)}</p>` : ''}
    <div class="row">
      ${r.chosen ? card(r.chosen, true) : ''}
      ${(r.alternatives ?? []).map((c) => card(c, false)).join('')}
    </div>
    ${r.rejected?.length ? `<details><summary>${r.rejected.length} rejected candidate(s)</summary><ul>${r.rejected.slice(0, 15)
      .map((x) => `<li><code>${h(x.file.title)}</code> — ${h(x.reason)}</li>`).join('')}</ul></details>` : ''}
    <p class="muted">Decide in <code>scripts/image-overrides.json</code>: <code>"${h(r.v.id)}": "File:…"</code> or <code>"${h(r.v.id)}": "skip"</code></p>
  </section>`
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Image review</title>
<style>
  :root { --ink:#0B1F3A; --muted:#64748B; --border:#E5E7EB; --page:#F6F7F9; --green:#0F7A5C; --amber:#B45309; --red:#B91C1C; }
  body { margin:0; padding:24px 16px 64px; font:14px/1.5 system-ui, sans-serif; color:var(--ink); background:var(--page); }
  main { max-width:1200px; margin:0 auto; }
  h1 { font-size:22px; margin:0 0 4px; }
  section { background:#fff; border:1px solid var(--border); border-radius:12px; padding:16px; margin:16px 0; }
  h2 { font-size:16px; margin:0 0 8px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  h2 small { color:var(--muted); font-weight:400; }
  .badge { font-size:12px; padding:2px 10px; border-radius:999px; color:#fff; }
  .badge.found { background:var(--green); } .badge.needs-review { background:var(--amber); }
  .badge.not-found { background:var(--red); } .badge.skipped { background:var(--muted); }
  .row { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
  figure { margin:0; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
  figure.chosen { outline:3px solid var(--green); }
  figure img { width:100%; aspect-ratio:16/10; object-fit:cover; display:block; background:var(--page); }
  figcaption { padding:8px; display:grid; gap:4px; font-size:12px; }
  code { word-break:break-all; font-size:12px; }
  .muted { color:var(--muted); font-size:12px; } .why { color:var(--amber); margin:0 0 8px; }
  details { margin-top:8px; font-size:12px; }
</style></head><body><main>
  <h1>Image review</h1>
  <p class="muted">Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · local file, not deployed. Thumbnails load from upload.wikimedia.org for review only; the site self-hosts the normalised copies.</p>
  ${rs.map(section).join('\n')}
</main></body></html>
`
}

// ─── Credits backfill for the earlier photos ──────────────────────────────────

/**
 * The earlier script (scripts/fetch-car-images.js) kept no record of its source
 * files. Re-run its query, download small thumbnails of the top candidates and
 * compare them with the local JPG; a close visual match identifies the source.
 */
async function backfillCredits() {
  const jpgs = vehicles.filter((v) => !creditIds.has(v.id) && existsSync(path.join(PATHS.cars, `${v.id}.jpg`)))
    .filter((v) => !ONLY || ONLY.has(v.id))
    .slice(0, LIMIT)
  log(`Backfilling credits for ${jpgs.length} existing JPG(s)…\n`)
  const resolved = [], unresolved = []
  for (const v of jpgs) {
    try {
      const local = await fingerprint(await fs.readFile(path.join(PATHS.cars, `${v.id}.jpg`)))
      const query = `${v.brand} ${v.model}`.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
      const data = await client.api({ action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '10', ...FILE_PROPS })
      let best = null
      for (const f of filesOf(data).filter((f) => /^image\//.test(f.mime) && f.mime !== 'image/svg+xml').slice(0, 10)) {
        const thumb = await client.download(thumbAt(f.thumbUrl, 500))
        const diff = compare(local, await fingerprint(thumb))
        if (!best || diff < best.diff) best = { f, diff }
      }
      if (best && best.diff < 0.06) {
        const license = checkLicense(best.f.meta)
        if (!license.ok) { unresolved.push([v.id, `source ${best.f.title} has a licence that is not accepted: ${license.reason} – replace the photo`]); continue }
        upsertCredit(v.id, { file: best.f, license, author: authorOf(best.f.meta) })
        resolved.push([v.id, best.f.title, license.name, best.diff.toFixed(3)])
        log(`${v.id}: ${best.f.title} (diff ${best.diff.toFixed(3)})`)
      } else {
        unresolved.push([v.id, best ? `closest ${best.f.title} (diff ${best.diff.toFixed(3)}) – not a match` : 'no candidates'])
        log(`${v.id}: unresolved`)
      }
    } catch (err) {
      unresolved.push([v.id, `error: ${err.message}`])
    }
  }
  if (APPLY) await writeJson(PATHS.credits, credits.sort((a, b) => a.vehicleId.localeCompare(b.vehicleId)))
  const text = ['# Credits backfill', '', `Mode: ${APPLY ? 'APPLY (photo-credits.json updated)' : 'dry run'}`, '',
    '## Resolved', '', mdTable(['id', 'file', 'licence', 'diff'], resolved),
    '## Unresolved (likely AI-generated or replaced photos — no credit possible)', '', mdTable(['id', 'detail'], unresolved)].join('\n')
  await fs.writeFile(p('scripts/credits-backfill-report.md'), text)
  log('\n' + text)
}

/** Same pipeline as the old script (800×500 contain on white), then a tiny greyscale fingerprint. */
async function fingerprint(buf) {
  const normalized = await sharp(buf).resize(800, 500, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).toBuffer()
  return sharp(normalized).resize(40, 25, { fit: 'fill' }).greyscale().raw().toBuffer()
}
function compare(a, b) {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i])
  return sum / a.length / 255
}

