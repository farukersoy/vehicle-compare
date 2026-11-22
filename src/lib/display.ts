import { CostResult } from '@/types'
import { annualCostCHF, annualCO2Kg, fmt2, fmtCO2 } from '@/lib/calculations'

/**
 * Differences as the user sees them: each value is first rounded to its
 * displayed precision (CHF to 2 decimals, CO₂ to 1 decimal, using the same
 * formatters as the cards), then subtracted. So "6.83 vs 5.37" always shows
 * a delta of 1.46, never 1.47. Annual figures derive from the rounded delta.
 */
export interface DisplayDelta {
  /** comparison − reference, CHF per 100 km, 2 decimals (positive = reference cheaper) */
  costDiff: number
  /** comparison − reference, g CO₂/km, 1 decimal */
  co2Diff: number
  /** |costDiff| over the annual mileage, CHF */
  annualCostCHF: number
  /** |co2Diff| over the annual mileage, kg */
  annualCO2Kg: number
}

const shownCost = (r: CostResult) => Number(fmt2(r.costPer100kmCHF))
const shownCO2  = (r: CostResult) => Number(fmtCO2(r.co2TotalGkm))

export function displayDelta(reference: CostResult, comparison: CostResult): DisplayDelta {
  const costDiff = Number((shownCost(comparison) - shownCost(reference)).toFixed(2))
  const co2Diff  = Number((shownCO2(comparison)  - shownCO2(reference)).toFixed(1))
  return {
    costDiff,
    co2Diff,
    annualCostCHF: annualCostCHF(Math.abs(costDiff)),
    annualCO2Kg:   Math.abs(annualCO2Kg(co2Diff)),
  }
}

// ─── Compare panel rows ───────────────────────────────────────────────────────

/** Values exactly as the compare panel shows them (already rounded). */
export interface ShownValues {
  /** CHF per 100 km, 2 decimals */
  cost: number
  /** CHF per year at ANNUAL_KM, whole francs, from the rounded per-100-km value */
  year: number
  /** g CO₂ per km, 1 decimal */
  co2: number
}

export function shownValues(r: CostResult): ShownValues {
  const cost = shownCost(r)
  return { cost, year: Math.round(annualCostCHF(cost)), co2: shownCO2(r) }
}

/**
 * Differences for the result sentence and the sticky bar, computed from the
 * displayed values (comparison − reference): the per-year figure is the
 * difference of the two displayed yearly costs, so the rows always add up.
 */
export function shownDiff(reference: CostResult, comparison: CostResult) {
  const a = shownValues(reference)
  const b = shownValues(comparison)
  return {
    cost: Number((b.cost - a.cost).toFixed(2)),
    year: b.year - a.year,
    co2: Number((b.co2 - a.co2).toFixed(1)),
  }
}

/** Index of the best value (0 = reference, 1 = compared) or null on a tie / missing value. */
export function bestIndex(a: number | null | undefined, b: number | null | undefined, higherIsBetter = false): 0 | 1 | null {
  if (a == null || b == null || a === b) return null
  return (higherIsBetter ? a > b : a < b) ? 0 : 1
}
