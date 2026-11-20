// Tolerant parser for the tables pasted from Gemini (Markdown tables or CSV).
// Handles: extra spaces, decimal commas, "-"/"n/a" for empty cells, repeated
// header rows, several tables per file, **bold**, footnote markers.

const FOOTNOTES = /\[\^?\d+\]|[¹²³⁴⁵⁶⁷⁸⁹⁰†‡§]+|(?<=\S)\*+(?=\s|$)/g

export function cleanCell(raw) {
  return String(raw ?? '')
    .replace(/ | | /g, ' ')
    .replace(/\*\*|__|`/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(FOOTNOTES, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const EMPTY = new Set(['', '-', '–', '—', '--', 'n/a', 'na', 'n.a.', 'k.a.', 'k. a.', 'keine angabe', '?', 'n.v.', 'none', 'null'])
export const isEmptyCell = (s) => EMPTY.has(cleanCell(s).toLowerCase())

/** → { value: number|null, error?: string } */
export function parseNumber(raw) {
  let s = cleanCell(raw)
  if (isEmptyCell(s)) return { value: null }
  s = s.replace(/^(ca\.?|~|≈|approx\.?|rund)\s*/i, '')
  if (/^\d+(?:[.,]\d+)?\s*[-–—]\s*\d+(?:[.,]\d+)?/.test(s)) return { value: null, error: `range value "${s}"` }
  s = s.replace(/[’'\s](?=\d{3}\b)/g, '')                // 1'000 / 1 000
  s = s.replace(/\s*(kwh\/100\s?km|l\/100\s?km|g\/km|kwh|km|chf|fr\.?|l|liter|litres?)\.?$/i, '')
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '')          // 1,234.5
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.') // 1.234,5
  else s = s.replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { value: null, error: `not a number "${cleanCell(raw)}"` }
  return { value: Number(s) }
}

export function parseType(raw) {
  const s = cleanCell(raw).toLowerCase()
  if (/^(bev|ev|elektro|elektrisch|electric|vollelektrisch|e)$/.test(s)) return 'BEV'
  if (/phev|plug.?in/.test(s)) return 'PHEV'
  if (/^(hev|hybrid|vollhybrid|full.?hybrid)$/.test(s)) return 'HEV'
  return null
}

// ─── Header mapping ───────────────────────────────────────────────────────────

const norm = (h) => cleanCell(h).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Maps a header text to a field name (order matters: "Kosten … (Hausstrom)" is cost, not electricity). */
export function headerField(h) {
  const s = norm(h)
  if (/^(marke|hersteller|brand|make)\b/.test(s)) return 'brand'
  if (/^(modell|model|modellbezeichnung|variante)\b/.test(s)) return 'model'
  if (/^(antrieb|antriebsart|typ|type|art)\b/.test(s)) return 'type'
  if (/kosten|cost|chf/.test(s)) return 'cost'
  if (/co2|co₂/.test(s)) return 'co2'
  if (/reichweite|range/.test(s)) return 'range'
  if (/tank/.test(s)) return 'tank'
  if (/(batterie|battery|akku)/.test(s) && !/\/\s*100/.test(s)) return 'battery'
  if (/(benzin|kraftstoff|fuel|sprit)/.test(s) && /(leer|empty|ladungserhalt|charge.?sustain)/.test(s)) return 'fuelEmpty'
  if (/(benzin|kraftstoff|fuel|sprit)/.test(s)) return 'fuel'
  if (/(strom|electric|energie|kwh\s*\/\s*100)/.test(s)) return 'kwh'
  return null
}

function asHeader(cells) {
  const fields = cells.map(headerField)
  const known = fields.filter(Boolean)
  return known.includes('model') && new Set(known).size >= 3 ? fields : null
}

// ─── Line splitting ───────────────────────────────────────────────────────────

function splitMarkdownRow(line) {
  const cells = line.replace(/\\\|/g, '\u0000').split('|').map((c) => c.replace(/\u0000/g, '|'))
  if (cells.length && cells[0].trim() === '') cells.shift()
  if (cells.length && cells[cells.length - 1].trim() === '') cells.pop()
  return cells
}

const isSeparator = (cells) => cells.length > 0 && cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c))

function splitCsv(line, delim) {
  const out = []
  let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') q = false
      else cur += c
    } else if (c === '"') q = true
    else if (c === delim) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

/**
 * Parses one file. Returns { rows, unknownHeaders, tables } where each row is
 * { file, line, cells: { field: rawText } }.
 */
export function parseTables(text, file) {
  const rows = []
  const unknownHeaders = new Set()
  let header = null
  let tables = 0
  let csvDelim = null

  const lines = text.split(/\r?\n/)
  lines.forEach((line, i) => {
    const lineNo = i + 1
    let cells
    if (line.includes('|')) {
      cells = splitMarkdownRow(line)
    } else if (/[;,\t]/.test(line) && (csvDelim || /\.csv$/i.test(file) || asHeader(splitCsv(line, ';')) || asHeader(splitCsv(line, ',')))) {
      if (!csvDelim) csvDelim = ['\t', ';', ','].find((d) => asHeader(splitCsv(line, d))) ?? ';'
      cells = splitCsv(line, csvDelim)
    } else {
      // Prose between tables ends the current table (the next one brings its own header).
      if (line.trim() !== '') header = null
      return
    }
    if (isSeparator(cells)) return

    const h = asHeader(cells)
    if (h) {
      if (!header || h.join() !== header.join()) tables++
      header = h
      cells.forEach((c, j) => { if (!h[j] && cleanCell(c)) unknownHeaders.add(cleanCell(c)) })
      return                                  // also skips repeated header rows
    }
    if (!header) return
    if (cells.every((c) => isEmptyCell(c))) return

    const rec = {}
    header.forEach((field, j) => { if (field && rec[field] === undefined) rec[field] = cells[j] ?? '' })
    rows.push({ file, line: lineNo, cells: rec })
  })

  return { rows, unknownHeaders: [...unknownHeaders], tables }
}
