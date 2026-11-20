// Shared helpers for the one-time bulk build scripts (import + images).
// Node ≥ 22 with native TypeScript type stripping is required to load
// src/data/*.ts directly (Node 26 is used in this project).

import fs from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const p = (...parts) => path.join(ROOT, ...parts)

export const PATHS = {
  vehicles:      p('src/data/vehicles.ts'),
  brands:        p('src/data/brands.ts'),
  credits:       p('src/data/photo-credits.json'),
  cars:          p('public/cars'),
  cache:         p('scripts/.cache'),
  backup:        p('scripts/backup'),
  geminiDir:     p('data/gemini'),
  importPreview: p('scripts/.cache/import-preview.json'),
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

/** Parses `--flag`, `--key value` and `--key=value`. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { out._.push(a); continue }
    const [k, v] = a.slice(2).split('=', 2)
    if (v !== undefined) out[k] = v
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i]
    else out[k] = true
  }
  return out
}

// ─── Loading the TypeScript data files ───────────────────────────────────────

/**
 * Imports a src/data/*.ts module. Import lines are dropped (the data files
 * only import types), the rest is loaded through Node's type stripping.
 */
export async function loadTsModule(file) {
  const src = await fs.readFile(file, 'utf8')
  const stripped = src.replace(/^import\s.*$/gm, '')
  const hash = crypto.createHash('sha1').update(stripped).digest('hex').slice(0, 10)
  const dir = path.join(PATHS.cache, 'tsload')
  await fs.mkdir(dir, { recursive: true })
  const tmp = path.join(dir, `${path.basename(file, '.ts')}-${hash}.mts`)
  if (!existsSync(tmp)) await fs.writeFile(tmp, stripped)
  return import(pathToFileURL(tmp).href)
}

export async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch { return fallback }
}

export async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n')
}

/** Reads KEY=value pairs from .env.local / .env (gitignored) without overriding real env vars. */
export function loadDotEnv() {
  for (const name of ['.env.local', '.env']) {
    const f = p(name)
    if (!existsSync(f)) continue
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
    }
  }
}

// ─── Identity ─────────────────────────────────────────────────────────────────

/**
 * id slug, matching the convention of the existing dataset:
 * "ID.3" → "id3", "(77.4 kWh)" → "774-kwh", "e:Ny1" → "eny1", "4×4" → "4x4".
 */
export function slugify(text) {
  return text
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/×/g, 'x')
    .toLowerCase()
    .replace(/[.:'’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const compact = (s) => slugify(s).replace(/-/g, '')

/** Spelling-independent key: brand + model, with a leading repeated brand removed ("Polestar Polestar 2"). */
export function vehicleKey(brand, model) {
  const b = compact(brand)
  let m = compact(model)
  if (m.startsWith(b) && m.length > b.length) m = m.slice(b.length)
  return `${b}:${m}`
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export async function dirSize(dir) {
  let total = 0, count = 0
  for (const f of await fs.readdir(dir).catch(() => [])) {
    const st = await fs.stat(path.join(dir, f))
    if (st.isFile()) { total += st.size; count++ }
  }
  return { bytes: total, count }
}

export const fmtBytes = (n) =>
  n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`

export const mdEscape = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')

export function mdTable(headers, rows) {
  if (!rows.length) return '_none_\n'
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(mdEscape).join(' | ')} |`),
  ].join('\n') + '\n'
}

const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August',
  'September', 'Oktober', 'November', 'Dezember']
export const monthYearDe = (d = new Date()) => `${MONTHS_DE[d.getMonth()]} ${d.getFullYear()}`

export const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
