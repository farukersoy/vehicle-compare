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
  },
}

export type Translation = TranslationShape