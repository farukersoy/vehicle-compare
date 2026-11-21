import { Vehicle, Settings, CostResult } from '@/types'

// ─── Default settings ──────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Settings = {
  chargeRate: 'home',
  co2GridGkwh: 50,        // g CO2/kWh default grid factor
  homePriceCHF: 0.278,    // CHF/kWh — owner's billed average (ElCom median 2026: 0.277)
  publicPriceCHF: 0.59,   // CHF/kWh — TCS median DC fast charging 2026
  fuelPriceCHF: 1.718,    // CHF/litre petrol 95 — owner's actual average (editable)
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** g CO2 per litre of petrol (well-to-wheel) */
const CO2_G_PER_LITRE_PETROL = 2780

/** Swiss average annual mileage (km) */
export const ANNUAL_KM = 15_000

// ─── Core calculation ──────────────────────────────────────────────────────────

/**
 * Calculate energy cost and CO2 for a vehicle under given settings.
 *
 * Rules:
 *  - BEV:  only electric cost, no fuel
 *  - HEV:  only fuel cost (battery never charges from grid)
 *  - PHEV: electric + fuel (values assume a regularly charged vehicle)
 *  - The reference vehicle (owner's Opel) always charges at home; the
 *    home/public toggle only applies to the compared vehicle.
 */
export function calculateCost(vehicle: Vehicle, settings: Settings): CostResult {
  const {
    chargeRate,
    co2GridGkwh,
    homePriceCHF,
    publicPriceCHF,
    fuelPriceCHF,
  } = settings

  const effectiveRate = vehicle.isReference ? 'home' : chargeRate
  const kwhPrice = effectiveRate === 'home' ? homePriceCHF : publicPriceCHF

  // Determine effective consumption based on vehicle type
  let electricKwhUsed = vehicle.electricKwh100km
  let fuelLUsed = vehicle.fuelL100km

  if (vehicle.type === 'HEV') {
    // HEV never draws from grid
    electricKwhUsed = 0
  }

  // ── Cost ──────────────────────────────────────────────────────────────────────
  const electricCostPer100km = electricKwhUsed * kwhPrice
  const fuelCostPer100km = fuelLUsed * fuelPriceCHF

  // ── CO2 ───────────────────────────────────────────────────────────────────────
  // Fuel: fuelL [L/100km] × 2780 [gCO2/L] ÷ 100 = gCO2/km
  const co2Fuel = (fuelLUsed * CO2_G_PER_LITRE_PETROL) / 100
  // Upstream electric: kWh [kWh/100km] × gridFactor [gCO2/kWh] ÷ 100 = gCO2/km
  const co2Grid = (electricKwhUsed * co2GridGkwh) / 100

  return {
    costPer100kmCHF: electricCostPer100km + fuelCostPer100km,
    electricCostPer100km,
    fuelCostPer100km,
    co2TotalGkm: co2Fuel + co2Grid,
    electricKwhUsed,
    fuelLUsed,
  }
}

// ─── Projection helpers ────────────────────────────────────────────────────────

export function annualCostCHF(costPer100km: number, km = ANNUAL_KM): number {
  return (costPer100km * km) / 100
}

export function annualCO2Kg(co2Gkm: number, km = ANNUAL_KM): number {
  return (co2Gkm * km) / 1000
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

export function fmt2(n: number): string {
  return n.toFixed(2)
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-CH')
}

export function fmtCO2(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1)
}

/** Swiss number format with ASCII apostrophe thousands separator, e.g. 1'561.11 */
export function fmtCH(n: number, decimals = 0): string {
  const [int, frac] = n.toFixed(decimals).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "'")
  return frac ? `${grouped}.${frac}` : grouped
}
