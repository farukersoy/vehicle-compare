import { Vehicle, Settings, CostResult } from '@/types'

// ─── Default settings ──────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Settings = {
  chargeRate: 'home',
  phevScenario: 'full',
  co2GridGkwh: 30,        // Swiss grid average 2026 (SFOE)
  homePriceCHF: 0.31,     // CHF/kWh typical Swiss home tariff
  publicPriceCHF: 0.59,   // CHF/kWh public fast charger (avg. Switzerland)
  fuelPriceCHF: 1.72,     // CHF/litre petrol 95 (Swiss avg. mid-2026)
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** g CO2 emitted per litre of petrol burned (WLTP/EU standard) */
const CO2_G_PER_LITRE_PETROL = 2330

/** Swiss average annual mileage (km) */
export const ANNUAL_KM = 15_000

// ─── Core calculation ──────────────────────────────────────────────────────────

/**
 * Calculate energy cost and CO2 for a vehicle under given settings.
 *
 * Rules:
 *  - BEV:  only electric cost, no fuel
 *  - HEV:  only fuel cost (battery never charges from grid)
 *  - PHEV: electric + fuel — switches to empty-battery scenario when requested
 */
export function calculateCost(vehicle: Vehicle, settings: Settings): CostResult {
  const {
    chargeRate,
    phevScenario,
    co2GridGkwh,
    homePriceCHF,
    publicPriceCHF,
    fuelPriceCHF,
  } = settings

  const kwhPrice = chargeRate === 'home' ? homePriceCHF : publicPriceCHF

  // Determine effective consumption based on vehicle type + scenario
  let electricKwhUsed = vehicle.electricKwh100km
  let fuelLUsed = vehicle.fuelL100km

  if (vehicle.type === 'HEV') {
    // HEV never draws from grid
    electricKwhUsed = 0
  }

  if (vehicle.type === 'PHEV' && phevScenario === 'empty') {
    // Simulate worst-case: battery is flat, running on fuel only
    electricKwhUsed = 0
    fuelLUsed = vehicle.fuelL100kmEmpty ?? vehicle.fuelL100km * 3.5
  }

  // ── Cost ──────────────────────────────────────────────────────────────────────
  const electricCostPer100km = electricKwhUsed * kwhPrice
  const fuelCostPer100km = fuelLUsed * fuelPriceCHF

  // ── CO2 ───────────────────────────────────────────────────────────────────────
  // Tailpipe: fuelL [L/100km] × 2330 [gCO2/L] ÷ 100 = gCO2/km
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
  return Math.round(n).toString()
}
