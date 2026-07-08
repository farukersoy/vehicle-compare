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
  typeLabels: { BEV: string; PHEV: string; HEV: string }
}

export const translations: Record<Lang, TranslationShape> = {
  de: {
    tagline: 'Schweiz · Reale Verbrauchsdaten · ADAC Ecotest',
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
    charge: 'Laden',
    home: '🏠 Zuhause',
    public: '⚡ Öffentlich',
    phevBattery: 'PHEV-Batterie',
    full: '🔋 Voll',
    empty: '📉 Leer',
    gridCo2: 'Netz-CO₂',
    typeAll: 'Alle',
    footer1:
      'Datenquellen: ADAC Ecotest, reale Messungen von Fahrzeughaltern. «Geschätzte» Werte sind Marktdurchschnitte.',
    footer2:
      'Schweizer Standardwerte: ⛽ CHF 1.72/L · 🏠 CHF 0.31/kWh · ⚡ CHF 0.59/kWh · Netz-CO₂: 30 g/kWh (BFE 2026)',
    typeLabels: { BEV: 'Elektrisch', PHEV: 'Plug-in-Hybrid', HEV: 'Vollhybrid' },
  },
  en: {
    tagline: 'Switzerland · Real-world data · ADAC Ecotest',
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
    charge: 'Charge',
    home: '🏠 Home',
    public: '⚡ Public',
    phevBattery: 'PHEV battery',
    full: '🔋 Full',
    empty: '📉 Empty',
    gridCo2: 'Grid CO₂',
    typeAll: 'All',
    footer1:
      'Data sources: ADAC Ecotest, real-world owner measurements. "Estimated" figures are market averages.',
    footer2:
      'Swiss defaults: ⛽ CHF 1.72/L · 🏠 CHF 0.31/kWh · ⚡ CHF 0.59/kWh · Grid CO₂: 30 g/kWh (SFOE 2026)',
    typeLabels: { BEV: 'Electric', PHEV: 'Plug-in Hybrid', HEV: 'Full Hybrid' },
  },
}

export type Translation = TranslationShape