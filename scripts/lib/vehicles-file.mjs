// Surgical text edits on src/data/vehicles.ts. Entries are never re-serialised:
// untouched entries (including the Opel reference with its nested invoice)
// stay byte-for-byte identical.

export const jsString = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

export function jsNumber(n) {
  return Number.isInteger(n) ? (n === 0 ? '0.0' : String(n)) : String(n)
}

/** [start, end) offsets of the object literal whose `id` is `id`. */
export function entryRange(text, id) {
  const idx = text.search(new RegExp(`\\bid:\\s*'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`))
  if (idx < 0) return null
  const start = text.lastIndexOf('{', idx)
  let depth = 0, inStr = null
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      if (c === '\\') i++
      else if (c === inStr) inStr = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') inStr = c
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return [start, i + 1]
  }
  throw new Error(`Unbalanced braces in entry ${id}`)
}

/** Sets (replaces or inserts) a top-level field of an entry. `literal` is JS source. */
export function setField(text, id, key, literal) {
  const range = entryRange(text, id)
  if (!range) throw new Error(`Entry not found: ${id}`)
  const [start, end] = range
  const entry = text.slice(start, end)
  // Only match at the entry's own indentation (4 spaces), not inside nested objects.
  const re = new RegExp(`(\\n    ${key}:\\s*)([^\\n]*?)(,?)(\\s*(?://[^\\n]*)?)\\n`)
  let next
  if (re.test(entry)) {
    next = entry.replace(re, (_, pre, _old, comma, tail) => `${pre}${literal},${tail}\n`)
  } else {
    const close = entry.lastIndexOf('\n  }')
    next = `${entry.slice(0, close)}\n    ${key}: ${literal},${entry.slice(close)}`
  }
  return text.slice(0, start) + next + text.slice(end)
}

/** Reads a top-level field's raw literal (or undefined). */
export function getFieldLiteral(text, id, key) {
  const range = entryRange(text, id)
  if (!range) return undefined
  const m = new RegExp(`\\n    ${key}:\\s*([^\\n]*?),?\\s*(?://[^\\n]*)?\\n`).exec(text.slice(...range))
  return m?.[1]
}

/** Inserts rendered entries at the end of the `vehicles` array. */
export function appendEntries(text, entriesSource) {
  if (!entriesSource) return text
  const arrStart = text.indexOf('export const vehicles')
  const close = text.indexOf('\n]\n', arrStart)
  if (arrStart < 0 || close < 0) throw new Error('vehicles array not found')
  return text.slice(0, close) + '\n' + entriesSource.replace(/\n$/, '') + text.slice(close)
}

const FIELD_ORDER = [
  'id', 'model', 'brand', 'brandDomain', 'brandColor', 'image', 'type', 'segment', 'silhouette',
  'electricKwh100km', 'fuelL100km', 'co2DirectGkm', 'dataQuality', 'sourceNote',
  'rangeKm', 'tankLiters', 'usableBatteryKwh',
]

export function renderEntry(v) {
  const lines = FIELD_ORDER
    .filter((k) => v[k] !== undefined && v[k] !== null)
    .map((k) => `    ${k}: ${typeof v[k] === 'number' ? jsNumber(v[k]) : jsString(v[k])},`)
  return `  {\n${lines.join('\n')}\n  },`
}
