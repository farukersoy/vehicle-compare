export type Lang = 'de' | 'en'

export interface TranslationShape {
  tagline: string
  title: string
  /** "{n}" is replaced with the number of compared vehicles. */
  subtitle: string
  chooseVehicle: string
  vehicles: string
  allBrands: string
  yourReference: string
  energyCost: string
  perYear: string
  measured: string
  estimated: string
  opelCheaper: string
  rivalCheaper: string
  pickPrompt: string
  charging: string
  chargingAlwaysHome: string
  home: string
  public: string
  gridCo2: string
  typeAll: string
  /** Footer: one short sources line. */
  footerSources: string
  methodology: string
  dataAsOf: string
  notAdvice: string
  fuelPrice: string
  range: string
  /** Short range-badge caption for the reference car (≤ ~20 characters). */
  rangeReference: string
  /** Caption under the charging toggle of the compared car. */
  priceBasisCompared: string
  yourBilling: string
  electricity: string
  petrol: string
  total: string
  per100km: string
  imageCredits: string
  /** Caption on AI-generated vehicle images. */
  illustration: string
  loadMore: string
  showLess: string
  typeLabels: { BEV: string; PHEV: string; HEV: string }
  settings: string
  searchPlaceholder: string
  noResults: string
  compareHeading: string
  differencePer100: string
  co2Difference: string
  annualAt: string
  pickVehicle: string
  backToComparison: string
  language: string
  typeFilter: string
  brandFilter: string
  /** Compare panel */
  referenceShort: string
  comparedShort: string
  resultRefCheaper: string
  resultCompCheaper: string
  resultEqual: string
  rowCost100: string
  rowCostYear: string
  rowCo2: string
  rowRange: string
  bestValue: string
  noValue: string
  details: string
  consumption: string
  infoAbout: string
  infoCost: string
  infoYear: string
  infoCo2: string
  infoRange: string
  /** Picker */
  sortLabel: string
  sortCost: string
  sortDiff: string
  sortCo2: string
  diffMore: string
  diffLess: string
  diffSame: string
  vsReference: string
}

export const translations: Record<Lang, TranslationShape> = {
  de: {
    tagline: 'Schweiz · Reale Verbrauchsdaten',
    title: 'Echte Verbrauchskosten im Vergleich',
    subtitle:
      'Gemessene Werte eines Plug-in-Hybrids gegenüber {n} Modellen, auf Basis tatsächlicher Rechnungen.',
    chooseVehicle: 'Fahrzeug zum Vergleichen wählen',
    vehicles: 'Fahrzeuge',
    allBrands: 'Alle Marken',
    yourReference: 'Referenzfahrzeug · Messwerte des Halters',
    energyCost: 'Energiekosten pro 100 km',
    perYear: 'pro Jahr',
    measured: 'Gemessen',
    estimated: 'Geschätzt',
    opelCheaper: 'Referenzfahrzeug günstiger',
    rivalCheaper: 'Vergleichsfahrzeug günstiger',
    pickPrompt: 'Wählen Sie unten ein Fahrzeug',
    charging: 'Laden',
    chargingAlwaysHome: 'Laden: immer zu Hause',
    home: 'Zuhause',
    public: 'Öffentlich',
    gridCo2: 'Netz-CO₂',
    typeAll: 'Alle',
    footerSources:
      'Quellen: Messwerte und Rechnungen des Halters (Referenzfahrzeug) · KI-gestützte Abfrage mit Google Gemini (Vergleichsfahrzeuge) · Preise: Halter, TCS',
    methodology: 'So haben wir gerechnet',
    dataAsOf: 'Datenstand: November 2026',
    notAdvice: 'Keine Kaufberatung.',
    fuelPrice: 'Benzin',
    range: 'Reichweite',
    rangeReference: '1× laden, gemessen',
    priceBasisCompared: 'Preisbasis Vergleichsfahrzeug',
    yourBilling: 'Abrechnung des Halters',
    electricity: 'Strom',
    petrol: 'Benzin',
    total: 'Total',
    per100km: 'pro 100 km',
    imageCredits: 'Bildnachweise',
    illustration: 'Symbolbild',
    loadMore: 'Mehr anzeigen',
    showLess: 'Weniger anzeigen',
    typeLabels: { BEV: 'Elektrisch', PHEV: 'Plug-in-Hybrid', HEV: 'Vollhybrid' },
    settings: 'Einstellungen',
    searchPlaceholder: 'Marke oder Modell suchen',
    noResults: 'Keine Fahrzeuge gefunden.',
    compareHeading: 'Vergleich',
    differencePer100: 'Differenz pro 100 km',
    co2Difference: 'CO₂-Differenz',
    annualAt: 'pro Jahr bei',
    pickVehicle: 'Fahrzeug wählen',
    backToComparison: 'Zurück zum Vergleich',
    language: 'Sprache',
    typeFilter: 'Antriebsart',
    brandFilter: 'Marke',
    referenceShort: 'Referenzfahrzeug',
    comparedShort: 'Vergleichsfahrzeug',
    resultRefCheaper: 'Referenzfahrzeug ist {d} pro 100 km günstiger, {y} pro Jahr.',
    resultCompCheaper: 'Vergleichsfahrzeug ist {d} pro 100 km günstiger, {y} pro Jahr.',
    resultEqual: 'Beide kosten gleich viel pro 100 km.',
    rowCost100: 'Kosten pro 100 km',
    rowCostYear: 'Kosten pro Jahr',
    rowCo2: 'CO₂',
    rowRange: 'Reichweite',
    bestValue: 'bester Wert',
    noValue: 'kein Wert',
    details: 'Details',
    consumption: 'Verbrauch pro 100 km',
    infoAbout: 'Info zu',
    infoCost: 'Strom zu Hause CHF {home}/kWh, öffentlich CHF {public}/kWh, Benzin CHF {fuel}/L. Das Referenzfahrzeug lädt immer zu Hause.',
    infoYear: 'Bei {km} km pro Jahr. Gerechnet mit den Kosten pro 100 km wie angezeigt.',
    infoCo2: 'Benzin 2.78 kg CO₂ pro Liter, Strom {grid} g pro kWh. PHEV-Werte gelten für regelmässig geladene Fahrzeuge.',
    infoRange: 'Elektroauto: mit voller Batterie. Referenzfahrzeug: eine gemessene Fahrt mit einer Ladung zu Hause, ohne Zwischenstopp.',
    sortLabel: 'Sortieren',
    sortCost: 'Kosten',
    sortDiff: 'Differenz',
    sortCo2: 'CO₂',
    diffMore: '{d} teurer',
    diffLess: '{d} günstiger',
    diffSame: 'gleich teuer',
    vsReference: 'gegenüber Referenzfahrzeug',
  },
  en: {
    tagline: 'Switzerland · Real-world data',
    title: 'Real-world running costs compared',
    subtitle:
      'Measured figures of a plug-in hybrid against {n} models, based on actual bills.',
    chooseVehicle: 'Choose a vehicle to compare',
    vehicles: 'vehicles',
    allBrands: 'All brands',
    yourReference: 'Reference car · owner\'s measurements',
    energyCost: 'Energy cost per 100 km',
    perYear: 'per year',
    measured: 'Measured',
    estimated: 'Estimated',
    opelCheaper: 'Reference car cheaper',
    rivalCheaper: 'Compared car cheaper',
    pickPrompt: 'Select a vehicle below',
    charging: 'Charging',
    chargingAlwaysHome: 'Charging: always at home',
    home: 'Home',
    public: 'Public',
    gridCo2: 'Grid CO₂',
    typeAll: 'All',
    footerSources:
      'Sources: owner\'s measurements and bills (reference car) · AI-assisted query with Google Gemini (compared cars) · prices: owner, TCS',
    methodology: 'How we calculated',
    dataAsOf: 'Data as of: November 2026',
    notAdvice: 'Not purchase advice.',
    fuelPrice: 'Petrol',
    range: 'Range',
    rangeReference: '1 charge, measured',
    priceBasisCompared: 'Price basis, compared car',
    yourBilling: 'Owner\'s billing',
    electricity: 'Electricity',
    petrol: 'Petrol',
    total: 'Total',
    per100km: 'per 100 km',
    imageCredits: 'Image credits',
    illustration: 'Illustration',
    loadMore: 'Show more',
    showLess: 'Show less',
    typeLabels: { BEV: 'Electric', PHEV: 'Plug-in Hybrid', HEV: 'Full Hybrid' },
    settings: 'Settings',
    searchPlaceholder: 'Search brand or model',
    noResults: 'No vehicles found.',
    compareHeading: 'Comparison',
    differencePer100: 'Difference per 100 km',
    co2Difference: 'CO₂ difference',
    annualAt: 'per year at',
    pickVehicle: 'Choose vehicle',
    backToComparison: 'Back to comparison',
    language: 'Language',
    typeFilter: 'Powertrain',
    brandFilter: 'Brand',
    referenceShort: 'Reference car',
    comparedShort: 'Compared car',
    resultRefCheaper: 'Reference car is {d} per 100 km cheaper, {y} per year.',
    resultCompCheaper: 'Compared car is {d} per 100 km cheaper, {y} per year.',
    resultEqual: 'Both cost the same per 100 km.',
    rowCost100: 'Cost per 100 km',
    rowCostYear: 'Cost per year',
    rowCo2: 'CO₂',
    rowRange: 'Range',
    bestValue: 'best value',
    noValue: 'no value',
    details: 'Details',
    consumption: 'Consumption per 100 km',
    infoAbout: 'Info about',
    infoCost: 'Home charging CHF {home}/kWh, public CHF {public}/kWh, petrol CHF {fuel}/L. The reference car always charges at home.',
    infoYear: 'At {km} km per year. Based on the cost per 100 km as shown.',
    infoCo2: 'Petrol 2.78 kg CO₂ per litre, electricity {grid} g per kWh. PHEV values assume regularly charged vehicles.',
    infoRange: 'Electric car: with a full battery. Reference car: one measured trip with one charge at home and no stop.',
    sortLabel: 'Sort',
    sortCost: 'Cost',
    sortDiff: 'Difference',
    sortCo2: 'CO₂',
    diffMore: '{d} more',
    diffLess: '{d} less',
    diffSame: 'same cost',
    vsReference: 'vs reference car',
  },
}

export type Translation = TranslationShape