#!/usr/bin/env node
/**
 * One-time import of Gemini tables (data/gemini/*.md|*.csv) into src/data/vehicles.ts.
 *
 *   npm run import-data                       dry run (default): report only
 *   npm run import-data -- --apply            write vehicles.ts (old file backed up to scripts/backup/)
 *   npm run import-data -- --update-existing  also overwrite values of existing vehicles (listed old → new)
 *   npm run import-data -- --include-sample   also read data/gemini/sample*.md (test data, skipped by default)
 *   npm run import-data -- --input <dir>      read another folder
 *
 * The site computes cost and CO₂ itself; Gemini's cost/CO₂ columns are only a cross-check.
 * Report: printed and saved to scripts/import-report.md.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import {
  PATHS, p, parseArgs, loadTsModule, readJson, writeJson, slugify, vehicleKey, mdTable,
  monthYearDe, timestamp,
} from './lib/common.mjs'
import { parseTables, cleanCell, parseNumber, parseType } from './lib/parse-tables.mjs'
import { classify, SILHOUETTES, segmentFor } from './lib/classify.mjs'
import { setField, appendEntries, renderEntry, jsNumber, jsString } from './lib/vehicles-file.mjs'

const args = parseArgs()
const APPLY = !!args.apply
const UPDATE_EXISTING = !!args['update-existing']
const INPUT_DIR = args.input ? path.resolve(args.input) : PATHS.geminiDir

// Cross-check prices (same as the site's defaults) and plausibility limits.
const HOME_PRICE = 0.278
const FUEL_PRICE = 1.718
const COST_TOLERANCE = 0.05
const GRID_CO2 = 50          // g/kWh, used only to fill co2DirectGkm like the existing entries
const PETROL_CO2 = 2780      // g/L
const LIMITS = { bevKwh: [10, 30], phevFuel: [0.3, 9], phevKwh: [5, 40] }

const NEUTRAL_COLOR = '#64748B'
const OVERRIDE_FIELDS = ['silhouette', 'segment', 'model', 'rangeKm', 'tankLiters', 'usableBatteryKwh']
const r1 = (n) => Math.round(n * 10) / 10

// ─── Load inputs ──────────────────────────────────────────────────────────────

const { vehicles: existing } = await loadTsModule(PATHS.vehicles)
const { BRANDS, BRAND_ALIASES } = await loadTsModule(PATHS.brands)
const overrides = await readJson(p('scripts/overrides.json'), {})
const allowList = new Set(await readJson(p('scripts/import-allow.json'), []))

const files = (await fs.readdir(INPUT_DIR).catch(() => []))
  .filter((f) => /\.(md|csv|txt)$/i.test(f))
  .sort()
const skippedFiles = files.filter((f) => /^sample/i.test(f) && !args['include-sample'])
const inputFiles = files.filter((f) => !skippedFiles.includes(f))

if (!inputFiles.length) {
  console.error(`No input files in ${path.relative(p(), INPUT_DIR)}/ (*.md, *.csv).` +
    (skippedFiles.length ? ` Skipped test data: ${skippedFiles.join(', ')} (use --include-sample).` : ''))
  process.exit(1)
}

const parsed = []
const unknownHeaders = {}
for (const f of inputFiles) {
  const text = await fs.readFile(path.join(INPUT_DIR, f), 'utf8')
  const res = parseTables(text, f)
  parsed.push(...res.rows)
  if (res.unknownHeaders.length) unknownHeaders[f] = res.unknownHeaders
}

// ─── Lookups ──────────────────────────────────────────────────────────────────

const existingById = new Map(existing.map((v) => [v.id, v]))
const existingByKey = new Map(existing.map((v) => [vehicleKey(v.brand, v.model), v]))
const brandByLower = new Map(Object.keys(BRANDS).map((b) => [b.toLowerCase(), b]))
const slugCheck = existing.filter((v) => !v.isReference && slugify(`${v.brand} ${v.model}`) === v.id).length

/** Removes spec text so near-identical variants can be spotted (e.g. "ID.3 Pro S" vs "ID.3 Pro S 59 kWh"). */
const coreKey = (brand, model) =>
  vehicleKey(brand, model.replace(/\([^)]*\)/g, ' ').replace(/\b\d+(\.\d+)?\s*kwh\b/gi, ' '))
const existingByCore = new Map(existing.map((v) => [coreKey(v.brand, v.model), v]))

const unknownBrands = new Map()
function canonicalBrand(raw) {
  const b = cleanCell(raw)
  const lower = b.toLowerCase()
  if (brandByLower.has(lower)) return { name: brandByLower.get(lower), info: BRANDS[brandByLower.get(lower)] }
  if (BRAND_ALIASES[lower]) return { name: BRAND_ALIASES[lower], info: BRANDS[BRAND_ALIASES[lower]] }
  const name = b.replace(/\s+/g, ' ')
  const guess = { domain: `${slugify(name).replace(/-/g, '')}.com`, color: NEUTRAL_COLOR }
  unknownBrands.set(name, guess)
  return { name, info: guess, unknown: true }
}

// ─── Row processing ───────────────────────────────────────────────────────────

const report = {
  newVehicles: [], existingAdded: [], existingChanged: [], existingDiffNotApplied: [],
  skipped: [], conflicts: [], flagged: [], warnings: [],
}
const seen = new Map()     // key → first record
const pendingExisting = [] // { id, set } edits for existing entries
const valuesOf = (r) => [r.type, r.kwh, r.fuel, r.range].join('|')

for (const row of parsed) {
  const c = row.cells
  const where = `${row.file}:${row.line}`
  const brandRaw = cleanCell(c.brand)
  const model = cleanCell(c.model)
  if (!brandRaw || !model) { report.skipped.push([where, `${brandRaw} ${model}`.trim() || '(empty)', 'missing brand or model']); continue }

  const { name: brand, info: brandInfo, unknown: unknownBrand } = canonicalBrand(brandRaw)
  // Reference row: brand Opel AND model containing "Grandland" (any spelling/case).
  if (brand === 'Opel' && /grandland/i.test(model)) {
    report.skipped.push([where, `${brand} ${model}`, 'reference vehicle (Opel Grandland X Hybrid4) is never imported'])
    continue
  }

  const issues = []
  const num = (field) => {
    if (c[field] === undefined) return null
    const { value, error } = parseNumber(c[field])
    if (error) issues.push(`${field}: ${error}`)
    return value
  }
  const rec = {
    where, brand, model, brandInfo, unknownBrand,
    id: slugify(`${brand} ${model}`),
    type: parseType(c.type),
    kwh: num('kwh'), fuel: num('fuel'),
    cost: num('cost'), co2: num('co2'), range: num('range'), tank: num('tank'), battery: num('battery'),
  }
  if (!rec.type) issues.push(`unknown drive type "${cleanCell(c.type)}"`)
  if (rec.type === 'BEV' && rec.fuel == null) rec.fuel = 0

  // Duplicates across all files: first one wins.
  const key = vehicleKey(brand, model)
  if (seen.has(key)) {
    const first = seen.get(key)
    if (valuesOf(first) === valuesOf(rec)) {
      report.skipped.push([where, `${brand} ${model}`, `duplicate of ${first.where} (identical)`])
    } else {
      report.conflicts.push([rec.id, first.where, `${first.kwh ?? '–'} kWh · ${first.fuel ?? '–'} L`,
        where, `${rec.kwh ?? '–'} kWh · ${rec.fuel ?? '–'} L`, 'first row kept'])
      report.skipped.push([where, `${brand} ${model}`, `duplicate of ${first.where} with different numbers (conflict)`])
    }
    continue
  }
  seen.set(key, rec)

  // ── Validation ──
  const { kwh, fuel, type } = rec
  if (type === 'BEV') {
    if (kwh == null) issues.push('BEV without kWh/100km')
    else if (kwh < LIMITS.bevKwh[0] || kwh > LIMITS.bevKwh[1]) issues.push(`BEV kWh ${kwh} outside ${LIMITS.bevKwh.join('–')}`)
    if (fuel > 0) issues.push(`BEV with fuel ${fuel} L/100km`)
  }
  if (type === 'PHEV') {
    if (fuel == null) issues.push('PHEV without L/100km')
    else if (fuel < LIMITS.phevFuel[0] || fuel > LIMITS.phevFuel[1]) issues.push(`PHEV fuel ${fuel} L outside ${LIMITS.phevFuel.join('–')}`)
    if (kwh == null) issues.push('PHEV without kWh/100km')
    else if (kwh < LIMITS.phevKwh[0] || kwh > LIMITS.phevKwh[1]) issues.push(`PHEV kWh ${kwh} outside ${LIMITS.phevKwh.join('–')}`)
  }
  if (rec.cost != null && kwh != null) {
    const recomputed = (type === 'HEV' ? 0 : kwh) * HOME_PRICE + (fuel ?? 0) * FUEL_PRICE
    const delta = Math.abs(recomputed - rec.cost) / rec.cost
    if (delta > COST_TOLERANCE) {
      issues.push(`cost mismatch: Gemini CHF ${rec.cost.toFixed(2)} vs recomputed ${recomputed.toFixed(2)} (${(delta * 100).toFixed(0)}%)`)
    }
  }

  const match = existingById.get(rec.id) ?? existingByKey.get(key)
  if (match?.isReference) { report.skipped.push([where, `${brand} ${model}`, 'reference vehicle is never changed']); continue }

  if (issues.length) {
    const allowed = allowList.has(match?.id ?? rec.id)
    report.flagged.push([match?.id ?? rec.id, where, issues.join('; '), allowed ? 'ALLOWED (import-allow.json)' : 'not imported'])
    if (!allowed) continue
  }

  if (match) handleExisting(match, rec)
  else handleNew(rec)
}

function handleExisting(v, rec) {
  // Optional fields that are missing are always added.
  const add = {}
  if (v.rangeKm == null && rec.range != null) add.rangeKm = Math.round(rec.range)
  if (v.tankLiters == null && rec.tank != null) add.tankLiters = rec.tank
  if (v.usableBatteryKwh == null && rec.battery != null) add.usableBatteryKwh = rec.battery
  for (const [k, val] of Object.entries(add)) report.existingAdded.push([v.id, k, val, rec.where])

  // Consumption values: only with --update-existing.
  const diffs = []
  const cmp = (field, next) => { if (next != null && v[field] !== next) diffs.push([field, v[field], next]) }
  cmp('electricKwh100km', v.type === 'HEV' ? null : rec.kwh)
  cmp('fuelL100km', rec.fuel)
  if (rec.range != null && v.rangeKm != null) cmp('rangeKm', Math.round(rec.range))
  for (const [field, oldV, newV] of diffs) {
    (UPDATE_EXISTING ? report.existingChanged : report.existingDiffNotApplied).push([v.id, field, oldV ?? '–', newV, rec.where])
  }
  pendingExisting.push({ id: v.id, set: { ...add, ...(UPDATE_EXISTING ? Object.fromEntries(diffs.map(([f, , n]) => [f, n])) : {}) } })
}

function handleNew(rec) {
  const cls = classify(rec.brand, rec.model)
  const ov = overrides[rec.id] ?? {}
  const kwh = rec.type === 'HEV' ? 0 : rec.kwh
  const fuel = rec.fuel ?? 0
  const entry = {
    id: rec.id,
    model: rec.model,
    brand: rec.brand,
    brandDomain: rec.brandInfo.domain,
    brandColor: rec.brandInfo.color,
    type: rec.type,
    segment: cls.segment,
    silhouette: cls.silhouette,
    electricKwh100km: kwh,
    fuelL100km: fuel,
    co2DirectGkm: r1((kwh * GRID_CO2 + fuel * PETROL_CO2) / 100),
    dataQuality: 'measured',
    sourceNote: `Gemini-Abfrage (Fahrzeughalter), ${monthYearDe()}`,
    rangeKm: rec.range != null ? Math.round(rec.range) : undefined,
    tankLiters: rec.tank ?? undefined,
    usableBatteryKwh: rec.battery ?? undefined,
  }
  for (const k of OVERRIDE_FIELDS) if (ov[k] !== undefined) entry[k] = ov[k]
  if (ov.silhouette && !ov.segment) entry.segment = segmentFor(ov.silhouette)
  if (!SILHOUETTES.includes(entry.silhouette)) report.warnings.push(`${rec.id}: invalid silhouette override "${entry.silhouette}"`)

  const notes = []
  if (Object.keys(ov).length) notes.push('override')
  if (cls.rule === 'default' && !ov.silhouette) notes.push('silhouette: classifier default – check')
  if (rec.unknownBrand) notes.push('unknown brand')
  const similar = existingByCore.get(coreKey(rec.brand, rec.model))
  if (similar) notes.push(`similar to existing ${similar.id}`)
  if (existingById.has(entry.id)) report.warnings.push(`${entry.id}: id already exists with a different brand/model spelling`)

  report.newVehicles.push({ entry, rule: ov.silhouette ? 'override' : cls.rule, notes, where: rec.where })
}

// ─── Report ───────────────────────────────────────────────────────────────────

for (const [name, g] of unknownBrands) {
  report.warnings.push(`Unknown brand "${name}": guessed domain ${g.domain}, neutral colour ${g.color}` +
    (APPLY ? ' (added to src/data/brands.ts – please verify)' : ' – add it to src/data/brands.ts or BRAND_ALIASES'))
}
for (const [f, hs] of Object.entries(unknownHeaders)) report.warnings.push(`${f}: ignored columns ${hs.map((h) => `"${h}"`).join(', ')}`)

const perBrand = {}
for (const v of existing) (perBrand[v.brand] ??= { before: 0, added: 0 }).before++
for (const { entry } of report.newVehicles) (perBrand[entry.brand] ??= { before: 0, added: 0 }).added++

const md = []
md.push(`# Import report`, '')
md.push(`- Mode: **${APPLY ? 'APPLY' : 'dry run'}**${UPDATE_EXISTING ? ' · --update-existing' : ''} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`)
md.push(`- Input: ${inputFiles.map((f) => `\`${f}\``).join(', ')} (${parsed.length} data rows)` +
  (skippedFiles.length ? ` · skipped test data: ${skippedFiles.join(', ')}` : ''))
md.push(`- Dataset before: ${existing.length} vehicles · new: **${report.newVehicles.length}** · after: ${existing.length + report.newVehicles.length}`)
md.push(`- Existing vehicles: ${report.existingAdded.length} optional fields added · ${report.existingChanged.length} values changed · ${report.existingDiffNotApplied.length} differences not applied`)
md.push(`- Skipped: ${report.skipped.length} · conflicts: ${report.conflicts.length} · flagged: ${report.flagged.length} (${report.flagged.filter((f) => f[3].startsWith('ALLOWED')).length} allowed)`)
md.push(`- id rule check: ${slugCheck}/${existing.length - 1} existing ids match the slug rule`, '')

md.push('## New vehicles', '')
md.push(mdTable(['id', 'brand', 'model', 'type', 'kWh/100', 'L/100', 'range', 'silhouette', 'segment', 'rule', 'notes'],
  report.newVehicles.map(({ entry: e, rule, notes }) => [e.id, e.brand, e.model, e.type, e.electricKwh100km, e.fuelL100km,
    e.rangeKm ?? '', e.silhouette, e.segment, rule, notes.join('; ')])))

md.push('## Existing vehicles', '')
md.push('Missing optional fields added:', '')
md.push(mdTable(['id', 'field', 'value', 'source'], report.existingAdded))
md.push(UPDATE_EXISTING ? 'Values changed (old → new):' : 'Differences NOT applied (run with `--update-existing` to overwrite):', '')
md.push(mdTable(['id', 'field', 'old', 'new', 'source'], UPDATE_EXISTING ? report.existingChanged : report.existingDiffNotApplied))

md.push('## Flagged rows', '', 'Not imported unless their id is listed in `scripts/import-allow.json`.', '')
md.push(mdTable(['id', 'source', 'reasons', 'status'], report.flagged))
md.push('## Conflicts', '')
md.push(mdTable(['id', 'first', 'values', 'later', 'values', 'resolution'], report.conflicts))
md.push('## Skipped', '')
md.push(mdTable(['source', 'vehicle', 'reason'], report.skipped))
md.push('## Warnings', '')
md.push(report.warnings.length ? report.warnings.map((w) => `- ${w}`).join('\n') + '\n' : '_none_\n')
md.push('## Per brand', '')
md.push(mdTable(['brand', 'before', 'new', 'after'], Object.entries(perBrand).sort(([a], [b]) => a.localeCompare(b))
  .map(([b, c]) => [b, c.before, c.added || '', c.before + c.added])))

const reportText = md.join('\n')
await fs.writeFile(p('scripts/import-report.md'), reportText)
await writeJson(PATHS.importPreview, report.newVehicles.map((n) => n.entry))
console.log(reportText)

// ─── Apply ────────────────────────────────────────────────────────────────────

if (!APPLY) {
  console.log('\nDry run – nothing written. Report: scripts/import-report.md. Run with --apply to write vehicles.ts.')
  process.exit(0)
}

const original = await fs.readFile(PATHS.vehicles, 'utf8')
await fs.mkdir(PATHS.backup, { recursive: true })
const backupFile = path.join(PATHS.backup, `vehicles-${timestamp()}.ts`)
await fs.writeFile(backupFile, original)

let text = original
for (const { id, set } of pendingExisting) {
  for (const [k, v] of Object.entries(set)) text = setField(text, id, k, typeof v === 'number' ? jsNumber(v) : jsString(v))
}
text = appendEntries(text, report.newVehicles.map(({ entry }) => renderEntry(entry)).join('\n'))
await fs.writeFile(PATHS.vehicles, text)

// Sanity check: the file must still load and contain the expected count.
try {
  const { vehicles: after } = await loadTsModule(PATHS.vehicles)
  const expected = existing.length + report.newVehicles.length
  if (after.length !== expected) throw new Error(`expected ${expected} vehicles, found ${after.length}`)
  const ref = after.find((v) => v.isReference)
  if (JSON.stringify(ref) !== JSON.stringify(existing.find((v) => v.isReference))) throw new Error('reference entry changed')
} catch (err) {
  await fs.writeFile(PATHS.vehicles, original)
  console.error(`\nApply failed, vehicles.ts restored: ${err.message}`)
  process.exit(1)
}

if (unknownBrands.size) {
  let brandsText = await fs.readFile(PATHS.brands, 'utf8')
  const lines = [...unknownBrands].map(([name, g]) =>
    `  ${jsString(name)}: { domain: ${jsString(g.domain)}, color: ${jsString(g.color)} }, // TODO: verify (added by import)`)
  brandsText = brandsText.replace(/\n}\n\n\/\*\* Alternative spellings/, `\n${lines.join('\n')}\n}\n\n/** Alternative spellings`)
  await fs.writeFile(PATHS.brands, brandsText)
}

console.log(`\nApplied. Backup: ${path.relative(p(), backupFile)} · vehicles.ts now has ${existing.length + report.newVehicles.length} vehicles.`)
