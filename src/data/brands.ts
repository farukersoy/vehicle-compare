// Brand table used by the one-time import (scripts/import-vehicles.mjs).
// Names use the exact spelling of the existing dataset in vehicles.ts
// (e.g. "Mercedes", "Citroën", "Seat", "Skoda", "Mini"); BRAND_ALIASES maps
// other spellings found in pasted tables onto these names.
// brandColor is only shown as a tiny dot next to the brand name.

export interface BrandInfo {
  domain: string   // brand website domain (informational; logos are self-hosted, see src/data/brand-logos.ts)
  color: string    // hex
}

export const BRANDS: Record<string, BrandInfo> = {
  // ── Brands already in the dataset (values copied from vehicles.ts) ──
  'Alfa Romeo': { domain: 'alfaromeo.com', color: '#981E32' },
  'Audi':       { domain: 'audi.com', color: '#BB0A30' },
  'BMW':        { domain: 'bmw.com', color: '#0066B1' },
  'Citroën':    { domain: 'citroen.com', color: '#C4122E' },
  'Cupra':      { domain: 'cupraofficial.com', color: '#B8A369' },
  'Dacia':      { domain: 'dacia.com', color: '#0A5CA8' },
  'Fiat':       { domain: 'fiat.com', color: '#941F24' },
  'Ford':       { domain: 'ford.com', color: '#00274E' },
  'Honda':      { domain: 'honda.com', color: '#CC0000' },
  'Hyundai':    { domain: 'hyundai.com', color: '#002C5F' },
  'Jaguar':     { domain: 'jaguar.com', color: '#1B1B1B' },
  'Kia':        { domain: 'kia.com', color: '#05141F' },
  'Land Rover': { domain: 'landrover.com', color: '#005A2B' },
  'Lexus':      { domain: 'lexus.com', color: '#1A1A1A' },
  'Mazda':      { domain: 'mazda.com', color: '#910A2D' },
  'Mercedes':   { domain: 'mercedes-benz.com', color: '#00ADEF' },
  'Mini':       { domain: 'mini.com', color: '#003E7E' },
  'Mitsubishi': { domain: 'mitsubishi-motors.com', color: '#E60012' },
  'Nissan':     { domain: 'nissan.com', color: '#C3002F' },
  'Opel':       { domain: 'opel.com', color: '#E8772E' },
  'Peugeot':    { domain: 'peugeot.com', color: '#1A1A1A' },
  'Polestar':   { domain: 'polestar.com', color: '#1A1A1A' },
  'Porsche':    { domain: 'porsche.com', color: '#000000' },
  'Renault':    { domain: 'renault.com', color: '#FFCC00' },
  'Seat':       { domain: 'seat.com', color: '#33302E' },
  'Skoda':      { domain: 'skoda-auto.com', color: '#4BA82E' },
  'Subaru':     { domain: 'subaru.com', color: '#0033A0' },
  'Tesla':      { domain: 'tesla.com', color: '#E31937' },
  'Toyota':     { domain: 'toyota.com', color: '#CC0000' },
  'Volkswagen': { domain: 'volkswagen.com', color: '#001E50' },
  'Volvo':      { domain: 'volvocars.com', color: '#003057' },

  // ── Further brands sold in Switzerland (not yet in the dataset) ──
  'BYD':        { domain: 'byd.com', color: '#C8102E' },
  'DS':         { domain: 'dsautomobiles.com', color: '#1A1A1A' },
  'Genesis':    { domain: 'genesis.com', color: '#1A1A1A' },
  'Jeep':       { domain: 'jeep.com', color: '#3B4A3F' },
  'Leapmotor':  { domain: 'leapmotor.com', color: '#1A1A1A' },
  'Lotus':      { domain: 'lotuscars.com', color: '#FFD100' },
  'Lucid':      { domain: 'lucidmotors.com', color: '#1A1A1A' },
  'Lynk & Co':  { domain: 'lynkco.com', color: '#1A1A1A' },
  'Maserati':   { domain: 'maserati.com', color: '#0C2340' },
  'MG':         { domain: 'mgmotor.eu', color: '#C8102E' },
  'NIO':        { domain: 'nio.com', color: '#00263A' },
  'Smart':      { domain: 'smart.com', color: '#1A1A1A' },
  'Xpeng':      { domain: 'xpeng.com', color: '#1A1A1A' },
  'Zeekr':      { domain: 'zeekr.eu', color: '#1A1A1A' },
}

/** Alternative spellings (lower-case) → canonical name in BRANDS. */
export const BRAND_ALIASES: Record<string, string> = {
  'mercedes-benz': 'Mercedes',
  'mercedes benz': 'Mercedes',
  'mercedes-amg': 'Mercedes',
  'vw': 'Volkswagen',
  'citroen': 'Citroën',
  'škoda': 'Skoda',
  'alfa': 'Alfa Romeo',
  'ds automobiles': 'DS',
  'lynk&co': 'Lynk & Co',
  'lynk and co': 'Lynk & Co',
  'mg motor': 'MG',
  'smart #': 'Smart',
}
