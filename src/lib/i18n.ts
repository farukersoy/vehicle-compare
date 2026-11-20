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
  charge: string
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
  loadMore: string
  showLess: string
  typeLabels: { BEV: string; PHEV: string; HEV: string }
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
    yourReference: '⭐ Ihr Referenzfahrzeug — reale Verbrauchsdaten',
    energyCost: 'Energiekosten pro 100 km',
    perYear: 'pro Jahr',
    measured: 'Gemessen',
    estimated: 'Geschätzt',
    opelCheaper: 'Opel günstiger',
    rivalCheaper: 'Konkurrent günstiger',
    pickPrompt: 'Wählen Sie oben ein Fahrzeug',
    charge: 'Laden (Vergleichsfahrzeug)',
    home: '🏠 Zuhause',
    public: '⚡ Öffentlich',
    phevBattery: 'PHEV-Batterie',
    full: '🔋 Voll',
    empty: '📉 Leer',
    gridCo2: 'Netz-CO₂',
    typeAll: 'Alle',
    footer1:
      'Datenquellen: Gemini-Abfrage (Fahrzeughalter), reale Messungen.',
    footer2:
      'Standardwerte: ⛽ CHF 1.718/L · 🏠 CHF 0.277/kWh · ⚡ CHF 0.59/kWh · Benzin-CO₂: 2\'780 g/L · Netz-CO₂: 50 g/kWh',
    footer3:
      'Preisquellen: ElCom (Median Haushaltsstrom), TCS (Median DC-Schnellladen) · Stand 2026',
    fuelPrice: 'Benzin',
    range: 'Reichweite',
    yourBilling: 'Ihre Abrechnung',
    electricity: 'Strom',
    petrol: 'Benzin',
    total: 'Total',
    per100km: 'pro 100 km',
    loadMore: 'Mehr anzeigen',
    showLess: 'Weniger anzeigen',
    typeLabels: { BEV: 'Elektrisch', PHEV: 'Plug-in-Hybrid', HEV: 'Vollhybrid' },
  },
  en: {
    tagline: 'Switzerland · Real-world data',
    title: 'EV Compare',
    subtitle:
      'Compare the real energy cost and CO₂ of BEV, PHEV and hybrid vehicles against your Opel Grandland.',
    chooseVehicle: 'Choose a vehicle to compare',
    vehicles: 'vehicles',
    allBrands: 'All brands',
    yourReference: '⭐ Your reference vehicle — real-world data',
    energyCost: 'Energy cost per 100 km',
    perYear: 'per year',
    measured: 'Measured',
    estimated: 'Estimated',
    opelCheaper: 'Opel cheaper',
    rivalCheaper: 'Rival cheaper',
    pickPrompt: 'Select a vehicle above',
    charge: 'Charging (compared vehicle)',
    home: '🏠 Home',
    public: '⚡ Public',
    phevBattery: 'PHEV battery',
    full: '🔋 Full',
    empty: '📉 Empty',
    gridCo2: 'Grid CO₂',
    typeAll: 'All',
    footer1:
      'Data sources: Gemini query (vehicle owners), real-world measurements.',
    footer2:
      'Defaults: ⛽ CHF 1.718/L · 🏠 CHF 0.277/kWh · ⚡ CHF 0.59/kWh · Petrol CO₂: 2\'780 g/L · Grid CO₂: 50 g/kWh',
    footer3:
      'Price sources: ElCom (median household electricity), TCS (median DC fast charging) · as of 2026',
    fuelPrice: 'Petrol',
    range: 'Range',
    yourBilling: 'Your billing',
    electricity: 'Electricity',
    petrol: 'Petrol',
    total: 'Total',
    per100km: 'per 100 km',
    loadMore: 'Show more',
    showLess: 'Show less',
    typeLabels: { BEV: 'Electric', PHEV: 'Plug-in Hybrid', HEV: 'Full Hybrid' },
  },
}

export type Translation = TranslationShape