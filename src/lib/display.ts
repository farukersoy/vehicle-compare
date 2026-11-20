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
