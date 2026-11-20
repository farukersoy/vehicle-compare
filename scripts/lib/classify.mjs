// Keyword classifier: brand + model → silhouette + segment.
// First matching rule wins; anything unmatched falls back to hatchback /
// "Kompakt" and is listed in the import report so it can be corrected in
// scripts/overrides.json.

const SEGMENT = {
  'city-car': 'Kleinwagen',
  hatchback: 'Kompakt',
  sedan: 'Sedan',
  suv: 'SUV',
  'large-suv': 'SUV',
}

// Patterns are matched against "brand model", lower-cased, with word boundaries.
const RULES = [
  ['city-car', [
    'spring', '500e', 'e-up', 'twingo', 'aygo', 'i10', 'picanto', 'inster', 'fortwo', 'dolphin surf',
    't03', 'microlino', 'ami', 'ë-c3|e-c3', 'e-208?', 'r4|renault 4', 'leapmotor t03',
  ]],
  ['large-suv', [
    'x5', 'x6', 'x7', 'ix(?! ?\\d)', 'q7', 'q8', 'e-tron suv', 'gle', 'gls', 'eqe suv', 'eqs suv', 'g 580',
    'xc90', 'ex90', 'cayenne', 'touareg', 'range rover(?! evoque)(?! sport)', 'defender', 'discovery(?! sport)',
    'model x', 'kodiaq', 'tarraco', 'ev9', 'ioniq 9', 'santa fe', 'sorento', 'outlander', 'polestar 3',
    'id\\.? ?buzz', 'land cruiser', 'grecale', 'levante', 'bentayga', 'urus', 'tang', 'es8', 'zeekr 9x',
    'lucid gravity', 'escalade', 'lyriq', 'q6', 'velar', 'sport p\\d+e?',
  ]],
  ['sedan', [
    'model 3', 'model s', 'i4', 'i5', 'i7', 'eqe(?! suv)', 'eqs(?! suv)', 'cla', 'c \\d{3}e?', 'e \\d{3}e?',
    'taycan(?! cross)', 'panamera', 'polestar 2', 'ioniq 6', 'lucid air', 'air', 'arteon', 'passat(?! variant)',
    'id\\.? ?7(?! tourer)', 'seal(?! u)', 'su7', '330e', '530e', '750e', 'a6(?! avant)', 'a8', 's60', 's90',
    'es90', 'emeya', 'ghibli', 'han', 'k5', 'mazda ?6e?', 'octavia(?! combi)', 'superb(?! combi)', 'et5', 'et7',
    'p7', 'mazda 6e', 'm3',
  ]],
  ['suv', [
    'suv', 'crossover', 'cross', 'q[2-5]', 'x[1-4]', 'ix[1-3]', 'gl[abc]', 'eq[abc]', 'xc40', 'xc60', 'ex30',
    'ex40', 'ec40', 'c40', 'tiguan', 't-roc', 't-cross', 'taigo', 'id\\.? ?[45]', 'enyaq', 'elroq', 'karoq',
    'kamiq', 'tavascan', 'terramar', 'formentor', 'ateca', 'arona', 'kona', 'tucson', 'ioniq 5', 'bayon',
    'niro', 'sportage', 'ev[3-6]', 'stonic', 'xceed', 'rav4', 'c-hr', 'bz4x', 'urban cruiser', 'nx', 'rx', 'ux',
    'rz', 'lbx', 'cx-\\d+', 'mx-30', '[235]008', 'aircross', 'junior', 'tonale', 'stelvio', '600e?', 'grandland',
    'frontera', 'mokka', 'crossland', 'captur', 'scenic', 'austral', 'symbioz', 'rafale', 'duster', 'bigster',
    'model y', 'mach-e', 'kuga', 'puma', 'explorer', 'capri', 'ariya', 'qashqai', 'juke', 'x-trail',
    'eclipse cross', 'asx', 'solterra', 'forester', 'crosstrek', 'countryman', 'aceman', 'e:?ny1', 'hr-v',
    'zr-v', 'cr-v', 'i-pace', 'e-pace', 'f-pace', 'evoque', 'macan', '#1', '#3', 'zs', 'ehs', 'hs', 'marvel',
    'atto', 'sealion', 'seal u', 'polestar 4', 'g6', 'g9', 'el[678]', '7x', 'lynk', 'xpeng', 'smart',
    'avenger', 'compass', 'jeep', 'e-c4 x', 'ds ?7', 'q4', 'bz', 'yaris cross', 'corolla cross',
  ]],
  ['hatchback', [
    'golf', 'id\\.? ?3', 'astra', 'corsa', '208', '308', 'e-c4', 'c4', 'clio', 'megane', 'leaf', 'born', 'leon',
    'combi', 'variant', 'touring', 'avant', 'estate', 'kombi', 'i30', 'ceed', 'renault 5', 'r5', 'cooper',
    'zoe', 'mg4', 'dolphin', 'prius', 'corolla', 'yaris', 'polo', 'fabia', 'ibiza', 'a3', '1er', '225xe',
  ]],
]

const COMPILED = RULES.map(([silhouette, words]) => [
  silhouette,
  words.map((w) => [w, new RegExp(`(?<![\\p{L}\\p{N}])(?:${w})(?![\\p{L}\\p{N}])`, 'iu')]),
])

/** → { silhouette, segment, rule } — rule is "keyword:…" or "default". */
export function classify(brand, model) {
  const text = `${brand} ${model}`.toLowerCase()
  for (const [silhouette, patterns] of COMPILED) {
    for (const [word, re] of patterns) {
      if (re.test(text)) return { silhouette, segment: SEGMENT[silhouette], rule: `keyword:${word}` }
    }
  }
  return { silhouette: 'hatchback', segment: SEGMENT.hatchback, rule: 'default' }
}

export const SILHOUETTES = Object.keys(SEGMENT)
export const segmentFor = (silhouette) => SEGMENT[silhouette]
