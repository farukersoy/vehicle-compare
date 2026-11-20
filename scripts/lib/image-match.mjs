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
  'pickup', 'long wheelbase', 'lwb']

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
      const variant = VARIANTS.find((v) => !allowedVariants.includes(v) && new RegExp(`${B}${esc(v)}${E}`, 'iu').test(t))
      if (variant) return { ok: false, reason: `other body style: ${variant}` }
      for (const { re, num } of siblingRes) {
        const others = [...t.matchAll(re)].map((m) => m[1]).filter((n) => n !== num)
        if (others.length) return { ok: true, ambiguous: `also mentions sibling ${others.join(', ')}` }
      }
      return { ok: true }
    },
  }
}

// ─── Rejection filters ────────────────────────────────────────────────────────

const REJECT_WORDS = [
  'interior', 'cockpit', 'dashboard', 'engine', 'details?', 'logo', 'badge', 'emblem', 'wheels?', 'rims?',
  'charging', 'charger', 'crash', 'race', 'racing', 'rally', 'tuning', 'tuned', 'concept', 'prototype',
  'scale model', 'model car', 'toy', 'wrap', 'wrapped', 'diecast', 'lego',
  // German equivalents common on Commons
  'innenraum', 'armaturenbrett', 'motorraum', 'felgen?', 'ladestation', 'ladens?', 'studie', 'prototyp',
  'modellauto', 'spielzeug',
]
const REJECT_RE = new RegExp(`${B}(?:${REJECT_WORDS.join('|')})${E}`, 'iu')

export const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim()

/** → reason string when a file must be rejected, else null. */
export function rejectReason(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.mime ?? '')) return `unsupported type ${file.mime}`
  if ((file.width ?? 0) < 1200) return `too small (${file.width} px wide)`
  if (file.height >= file.width) return 'portrait orientation'
  const titleHit = REJECT_RE.exec(file.title)
  if (titleHit) return `title mentions "${titleHit[0]}"`
  const descHit = REJECT_RE.exec(stripHtml(file.meta?.ImageDescription))
  if (descHit) return `description mentions "${descHit[0]}"`
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
