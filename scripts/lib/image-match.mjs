// Candidate rules for Commons photos: strict model matching, rejection
// filters, licence check and scoring. Pure functions (unit-tested in
// scripts/test-image-matching.mjs).

const B = '(?<![\\p{L}\\p{N}])'   // word boundary (unicode letters/digits)
const E = '(?![\\p{L}\\p{N}])'
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ─── Model cleaning ───────────────────────────────────────────────────────────

/** Spec / trim text that does not change what the car looks like. */
const SPEC_PATTERNS = [
  /\([^)]*\)/g,                                   // "(77.4 kWh)", "(XC40 Recharge)"
  /\b\d+(?:[.,]\d+)?\s*kwh\b/gi,                  // battery size
  /\b\d\.\d\b/g,                                  // engine size "1.6"
  /\b(?:4matic\+?|4motion|awd|4wd|2wd|rwd|fwd|4x4|4×4|all4|quattro|e-?4orce|xdrive\w*|edrive\w*|sdrive\w*)\b/gi,
  /\b(?:dual|single|twin|tri)[\s-]motor\b/gi,
  /\b(?:long|extended|standard|maximum|max)[\s-]range\b/gi,
  /\b(?:plug-?in(?:[\s-]hybrid)?|phev|e:?phev|e-?hybrid|hybrid|recharge|e-skyactiv|skyactiv|tfsi\s?e|tfsi|t-gdi|turbo)\b/gi,
  /\b(?:p\d{3}e|t[5-8]|ev\d{2,3}|\d{2,3}x)\b/gi,  // Land Rover P400e, Volvo T6, Renault EV60, Enyaq 80x
  /\b(?:performance|launch edition|first edition|edition|pro s|pro|plus|premium|business|comfort|style|elegance|essential|evolution|techno|iconic|allure|selection|line|sportline|r-line|gt-line|vz|fr|gtx|elektro|electric|iv)\b/gi,
]

/**
 * Core model text used for matching and searching, e.g.
 *   "ID.3 Pro S" → "ID.3", "Q4 e-tron 40" → "Q4 e-tron", "i4 eDrive40" → "i4",
 *   "Polestar 2 Long Range Dual Motor" → "Polestar 2", "Cooper SE" → "Cooper SE".
 */
export function coreModel(model) {
  let s = ` ${model} `
  for (const re of SPEC_PATTERNS) s = s.replace(re, ' ')
  const words = s.split(/\s+/).filter(Boolean)
  // Trailing power codes ("40", "225", "300 e") go when something else is left.
  while (words.length > 1 && /^(\d{2,3}[a-z]{0,2}\+?|e)$/i.test(words[words.length - 1])) words.pop()
  return words.join(' ').trim() || model.trim()
}

/** Regex for one model word, tolerant to punctuation: "ID.3" ≈ "ID 3" ≈ "ID3"; "e-tron" ≈ "etron". */
function wordRegexSource(word) {
  const chunks = word.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  return chunks.map(esc).join('[\\s._:\\-]?')
}

const BRAND_PATTERNS = {
  Mercedes: 'mercedes(?:[\\s-]benz)?|benz',
  Volkswagen: 'volkswagen|vw',
  'Citroën': 'citro[eë]n',
  Skoda: '[sš]koda',
  'Land Rover': 'land[\\s-]?rover|range[\\s-]rover',
  'Alfa Romeo': 'alfa[\\s-]?romeo',
}
export const brandRegex = (brand) =>
  new RegExp(`${B}(?:${BRAND_PATTERNS[brand] ?? wordRegexSource(brand)})${E}`, 'iu')

/** Body-style qualifiers that silently turn a match into a different car. */
const VARIANTS = ['countryman', 'clubman', 'cabrio', 'cabriolet', 'convertible', 'coupe', 'coupé', 'roadster',
  'estate', 'avant', 'touring', 'kombi', 'combi', 'sportback', 'allroad', 'shooting brake', 'wagon', 'tourer',
  'gran coupe', 'fastback', 'active tourer', 'gran turismo', 'cross turismo', 'sport turismo', 'van', 'cargo',
  'pickup', 'long wheelbase', 'lwb', 'executive', 'cross country']

const variantIn = (text, allowed) =>
  VARIANTS.find((v) => !allowed.includes(v) && new RegExp(`${B}${esc(v)}${E}`, 'iu').test(text.replace(/_/g, ' ')))

export function makeMatcher(brand, model) {
  const core = coreModel(model)
  // Model may repeat the brand ("Polestar 2"); the brand itself is checked separately.
  const words = core.split(/\s+/).filter((w) => w.toLowerCase() !== brand.toLowerCase())
  const wordRes = words.map((w) => new RegExp(`${B}${wordRegexSource(w)}${E}`, 'iu'))
  const query = `${brand} ${model}`.toLowerCase()
  const allowedVariants = VARIANTS.filter((v) => query.includes(v))

  // Sibling detection: "ID.3" must not see "ID.4", "Polestar 2" must not see "Polestar 3".
  const siblingRes = []
  words.forEach((w, i) => {
    const m = /^(.*?[\p{L}])([^\p{L}\p{N}]?)(\d+)$/u.exec(w)          // "ID.3" → "ID" + 3; "Q4" → "Q" + 4
    if (m) siblingRes.push({ re: new RegExp(`${B}${wordRegexSource(m[1])}[\\s._:\\-]?(\\d+)${E}`, 'giu'), num: m[3] })
    else if (/^\d+$/.test(w)) {                                         // "Model 3", "Polestar 2", "Renault 5"
      const prefix = i > 0 ? words[i - 1] : brand
      siblingRes.push({ re: new RegExp(`${B}${wordRegexSource(prefix)}\\s?(\\d+)${E}`, 'giu'), num: w })
    }
  })

  return {
    core,
    words,
    searchText: `${brand} ${core}`,
    /** → { ok, reason?, ambiguous? } for a file/category title (and description). */
    test(text, { requireBrand = true } = {}) {
      const t = text.replace(/_/g, ' ')
      if (requireBrand && !brandRegex(brand).test(t)) return { ok: false, reason: 'brand missing' }
      const missing = words.filter((_, i) => !wordRes[i].test(t))
      if (missing.length) return { ok: false, reason: `model token missing: ${missing.join(', ')}` }
      const variant = variantIn(t, allowedVariants)
      if (variant) return { ok: false, reason: `other body style: ${variant}` }
      for (const { re, num } of siblingRes) {
        const others = [...t.matchAll(re)].map((m) => m[1]).filter((n) => n !== num)
        if (others.length) return { ok: true, ambiguous: `also mentions sibling ${others.join(', ')}` }
      }
      return { ok: true }
    },
    /** Body style named in free text (e.g. the description says "Sport Turismo") → variant or undefined. */
    bodyStyleIn(text) {
      return variantIn(String(text ?? ''), allowedVariants)
    },
  }
}

// ─── Rejection filters ────────────────────────────────────────────────────────

const REJECT_WORDS = [
  'medical car', 'safety car', 'course car', 'police', 'polizei', 'taxi', 'ambulance', 'livery', 'parade',
  'interior', 'cockpit', 'dashboard', 'engine', 'details?', 'logo', 'badge', 'emblem', 'wheels?', 'rims?',
  'charging', 'charger', 'crash', 'race', 'racing', 'rally', 'tuning', 'tuned', 'concept', 'prototype',
  'scale model', 'model car', 'toy', 'wrap', 'wrapped', 'diecast', 'lego',
  // German equivalents common on Commons
  'innenraum', 'armaturenbrett', 'motorraum', 'felgen?', 'ladestation', 'ladens?', 'studie', 'prototyp',
  'modellauto', 'spielzeug',
]
const REJECT_RE = new RegExp(`${B}(?:${REJECT_WORDS.join('|')})${E}`, 'iu')

/** Charging scenes and close-ups of tyres – checked in title and description. */
const SCENE_WORDS = [
  'charge', 'charging station', 'charging cable', 'charge port', 'plugged in', 'plugged-in',
  'tires?', 'tyres?', 'reifen', 'ladekabel', 'lades[äa]ule', 'ladebuchse', 'ladepunkt', 'wallbox',
]
const SCENE_RE = new RegExp(`${B}(?:${SCENE_WORDS.join('|')})${E}`, 'iu')

/**
 * Rear views – title only (a description may say "rear-wheel drive").
 * Also the Commons photographer suffix "– r 05072025" (r = rear, f = front).
 */
const REAR_WORDS = ['rear', 'heck', 'heckansicht', 'back', 'back view', 'backside', 'rückansicht', 'hinten', 'arri[eè]re']
const REAR_RE = new RegExp(`${B}(?:${REAR_WORDS.join('|')})${E}|[–-]\\s?r\\s\\d{6,8}${E}`, 'iu')

export const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim()

/** → reason string when a file must be rejected, else null. */
export function rejectReason(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.mime ?? '')) return `unsupported type ${file.mime}`
  if ((file.width ?? 0) < 1200) return `too small (${file.width} px wide)`
  if (file.height >= file.width) return 'portrait orientation'
  const title = file.title.replace(/_/g, ' ')
  // "all-wheel drive" / "rear-wheel drive" describe the car, not the shot.
  const desc = stripHtml(file.meta?.ImageDescription).replace(/\b(?:all|four|front|rear|4)[\s-]wheel[\s-]drive\b/gi, ' ')
  const titleHit = REJECT_RE.exec(title) ?? SCENE_RE.exec(title)
  if (titleHit) return `title mentions "${titleHit[0]}"`
  const rearHit = REAR_RE.exec(`${title} ${stripHtml(file.meta?.ObjectName)}`)
  if (rearHit) return `rear view ("${rearHit[0].trim()}")`
  const descHit = REJECT_RE.exec(desc) ?? SCENE_RE.exec(desc)
  if (descHit) return `description mentions "${descHit[0]}"`
  return null
}

// ─── Generation (year range) ──────────────────────────────────────────────────

const YEAR = '(?:19|20)\\d{2}'

/** Photo-date stamps in titles; their year says when the photo was taken, not the car's model year. */
const DATE_STAMPS = [
  new RegExp(`${B}\\d{1,2}[-./]\\d{1,2}[-./](${YEAR})${E}`, 'gu'),      // 06-05-2025, 24.12.2015
  new RegExp(`${B}(${YEAR})[-./]\\d{1,2}[-./]\\d{1,2}${E}`, 'gu'),      // 2025-06-05
  new RegExp(`[–-]\\s?[a-z]{1,2}\\s\\d{4}(${YEAR})${E}`, 'gu'),          // "– f 05072025"
  new RegExp(`${B}(${YEAR})[01]\\d[0-3]\\d(?=[-_ )])`, 'gu'),            // (20250908-P1049823)
]

/**
 * Best-known year of the car in the photo → { year, from } or null.
 *   model/event year in the title ("2022 Mazda CX-60", "IAA 2023") – date stamps removed first,
 *   else the title's date stamp ("– f 05072025", "06-05-2025", "(20250908-P1049823)"),
 *   else EXIF / upload date from the metadata.
 */
export function yearOf(file) {
  let title = file.title.replace(/_/g, ' ')
  let stamped = null
  for (const re of DATE_STAMPS) {
    title = title.replace(re, (_, y) => { stamped = Math.max(stamped ?? 0, Number(y)); return ' ' })
  }
  const inTitle = [...title.matchAll(new RegExp(`${B}(${YEAR})${E}`, 'gu'))].map((m) => Number(m[1]))
  if (inTitle.length) return { year: Math.max(...inTitle), from: 'title' }
  const short = /^File:\s?(\d{2})\s+\p{Lu}/u.exec(title)                  // "File:14 Porsche Panamera", "File:23 BMW i4"
  if (short) return { year: 2000 + Number(short[1]), from: 'title' }
  if (stamped) return { year: stamped, from: 'title date' }
  for (const key of ['DateTimeOriginal', 'DateTime']) {
    const m = new RegExp(`${B}(${YEAR})${E}`, 'u').exec(stripHtml(file.meta?.[key]))
    if (m) return { year: Number(m[1]), from: key === 'DateTimeOriginal' ? 'photo date' : 'upload date' }
  }
  return null
}

/** → { reason } when the year is outside [from, to], { unknown: true } when no year, else { year }. */
export function checkYears(file, range) {
  if (!range) return {}
  const [from, to] = range
  const y = yearOf(file)
  if (!y) return { unknown: true }
  if (from && y.year < from) return { reason: `older than current generation (${y.year} < ${from}, ${y.from})` }
  if (to && y.year > to) return { reason: `newer generation (${y.year} > ${to}, ${y.from})` }
  return { year: y }
}

/** Per-model reject patterns (case-sensitive, e.g. old generation codes) → reason or null. */
export function modelRejectReason(text, patterns = []) {
  for (const src of patterns) {
    const m = new RegExp(src, 'u').exec(text.replace(/_/g, ' '))
    if (m) return `excluded for this model ("${m[0]}")`
  }
  return null
}

// ─── Licence ──────────────────────────────────────────────────────────────────

/** → { ok, name, url, reason? }. Accepts only CC0, Public Domain, CC BY, CC BY-SA. */
export function checkLicense(meta = {}) {
  const short = stripHtml(meta.LicenseShortName)
  const s = `${short} ${meta.License ?? ''} ${stripHtml(meta.UsageTerms)}`.toLowerCase()
  const url = meta.LicenseUrl || ''
  if (!short && !meta.License) return { ok: false, reason: 'missing licence' }
  if (/\bnc\b|non-?commercial/.test(s)) return { ok: false, reason: `NonCommercial (${short})` }
  if (/\bnd\b|no-?deriv/.test(s)) return { ok: false, reason: `NoDerivs (${short})` }
  if (/fair[\s-]use/.test(s)) return { ok: false, reason: 'fair use' }
  if (/cc0|cc-zero/.test(s)) return { ok: true, name: 'CC0 1.0', url: url || 'https://creativecommons.org/publicdomain/zero/1.0/' }
  if (/public domain|(^|\s)pd(\b|-)/.test(s)) return { ok: true, name: 'Public domain', url: url || '' }
  if (/cc[\s-]by[\s-]sa/.test(s)) return { ok: true, name: short || 'CC BY-SA', url }
  if (/cc[\s-]by(?![\s-](sa|nc|nd))/.test(s)) return { ok: true, name: short || 'CC BY', url }
  return { ok: false, reason: `licence not accepted (${short || meta.License})` }
}

export function authorOf(meta = {}) {
  return stripHtml(meta.Artist) || stripHtml(meta.Credit) || ''
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function scoreFile(file, { fromCategory }) {
  const text = `${file.title} ${stripHtml(file.meta?.ImageDescription)}`.toLowerCase()
  let score = 0
  const why = []
  const add = (n, label) => { score += n; why.push(`${n > 0 ? '+' : ''}${n} ${label}`) }
  if (file.featured) add(5, 'featured')
  if (file.quality) add(4, 'quality image')
  if (file.valued) add(2, 'valued image')
  if (fromCategory) add(3, 'model category')
  if (/front|three[\s-]quarter|3\/4|frontansicht|vorderansicht|vorne|\bfl\b|\bfr\b/.test(text)) add(2, 'front view')
  if (/\brear\b|heck|back view|rückansicht|hinten|\brl\b|\brr\b/.test(text)) add(-3, 'rear view')
  if (/side view|seitenansicht|profile|profil/.test(text)) add(-1, 'side view')
  if (/\band\b|&|\bvs\.?\b|lineup|line-up|fleet|convoy|group/.test(file.title.toLowerCase())) add(-2, 'several cars?')
  const year = Math.max(0, ...[...file.title.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0])))
  if (year >= 2021) add(1, `recent (${year})`)
  else if (year && year < 2017) add(-2, `old (${year})`)
  add(Math.round(Math.min(file.width, 4000) / 2000 * 10) / 10, `${file.width}px`)
  return { score: Math.round(score * 10) / 10, why }
}
