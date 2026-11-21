export type Lang = 'de' | 'en'

export interface TranslationShape {
  tagline: string
  title: string
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
  phevBattery: string
  full: string
  empty: string
  gridCo2: string
  typeAll: string
  footer1: string
  footer2: string
  footer3: string
  fuelPrice: string
  range: string
  yourBilling: string
  electricity: string
  petrol: string
  total: string
  per100km: string
  imageCredits: string
  /** Caption on AI-generated vehicle images. */
  illustration: string
  phevEmptyUnknown: string
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
    title: 'EV Vergleich',
    subtitle:
      'Vergleichen Sie die realen Energiekosten und den CO₂-Ausstoss von BEV, PHEV und Hybridfahrzeugen mit Ihrem Opel Grandland.',
    chooseVehicle: 'Fahrzeug zum Vergleichen wählen',
    vehicles: 'Fahrzeuge',
    allBrands: 'Alle Marken',
    yourReference: 'Ihr Referenzfahrzeug — reale Verbrauchsdaten',
    energyCost: 'Energiekosten pro 100 km',
    perYear: 'pro Jahr',
    measured: 'Gemessen',
    estimated: 'Geschätzt',
    opelCheaper: 'Opel günstiger',
    rivalCheaper: 'Konkurrent günstiger',
    pickPrompt: 'Wählen Sie unten ein Fahrzeug',
    charging: 'Laden',
    chargingAlwaysHome: 'Laden: immer zu Hause',
    home: 'Zuhause',
    public: 'Öffentlich',
    phevBattery: 'PHEV-Batterie',
    full: 'Voll',
    empty: 'Leer',
    gridCo2: 'Netz-CO₂',
    typeAll: 'Alle',
    footer1:
      'Datenquellen: Gemini-Abfrage (Fahrzeughalter), reale Messungen.',
    footer2:
      'Standardwerte: Benzin CHF 1.718/L · Strom zuhause CHF 0.278/kWh · öffentlich CHF 0.59/kWh · Benzin-CO₂ 2\'780 g/L · Netz-CO₂ 50 g/kWh',
    footer3:
      'Preisquellen: Strom zuhause = Ø Abrechnung Fahrzeughalter (ElCom-Median 2026: CHF 0.277/kWh), öffentlich = TCS-Median DC-Schnellladen · Stand 2026',
    fuelPrice: 'Benzin',
    range: 'Reichweite',
    yourBilling: 'Ihre Abrechnung',
    electricity: 'Strom',
    petrol: 'Benzin',
    total: 'Total',
    per100km: 'pro 100 km',
    imageCredits: 'Bildnachweise',
    illustration: 'Symbolbild',
    phevEmptyUnknown: 'Kein Wert für leere Batterie bekannt – Verbrauch mit voller Batterie angezeigt.',
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
    title: 'EV Compare',
    subtitle:
      'Compare the real energy cost and CO₂ of BEV, PHEV and hybrid vehicles against your Opel Grandland.',
    chooseVehicle: 'Choose a vehicle to compare',
    vehicles: 'vehicles',
    allBrands: 'All brands',
    yourReference: 'Your reference vehicle — real-world data',
    energyCost: 'Energy cost per 100 km',
    perYear: 'per year',
    measured: 'Measured',
    estimated: 'Estimated',
    opelCheaper: 'Opel cheaper',
    rivalCheaper: 'Rival cheaper',
    pickPrompt: 'Select a vehicle below',
    charging: 'Charging',
    chargingAlwaysHome: 'Charging: always at home',
    home: 'Home',
    public: 'Public',
    phevBattery: 'PHEV battery',
    full: 'Full',
    empty: 'Empty',
    gridCo2: 'Grid CO₂',
    typeAll: 'All',
    footer1:
      'Data sources: Gemini query (vehicle owners), real-world measurements.',
    footer2:
      'Defaults: petrol CHF 1.718/L · home electricity CHF 0.278/kWh · public CHF 0.59/kWh · petrol CO₂ 2\'780 g/L · grid CO₂ 50 g/kWh',
    footer3:
      'Price sources: home electricity = owner\'s billed average (ElCom median 2026: CHF 0.277/kWh), public = TCS median DC fast charging · as of 2026',
    fuelPrice: 'Petrol',
    range: 'Range',
    yourBilling: 'Your billing',
    electricity: 'Electricity',
    petrol: 'Petrol',
    total: 'Total',
    per100km: 'per 100 km',
    imageCredits: 'Image credits',
    illustration: 'Illustration',
    phevEmptyUnknown: 'No empty-battery value known – full-battery consumption shown.',
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