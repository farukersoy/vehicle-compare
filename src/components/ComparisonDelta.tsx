'use client'

import { CostResult } from '@/types'
import { fmt2, fmtInt, fmtCO2, annualCostCHF, annualCO2Kg, ANNUAL_KM } from '@/lib/calculations'
import { Translation } from '@/lib/i18n'

interface Props {
  reference: CostResult
  comparison: CostResult
  t: Translation
}

export default function ComparisonDelta({ reference, comparison, t }: Props) {
  const costDiff    = comparison.costPer100kmCHF - reference.costPer100kmCHF
  const co2Diff     = comparison.co2TotalGkm     - reference.co2TotalGkm
  const annualDiff  = annualCostCHF(Math.abs(costDiff))
  const annualCO2   = Math.abs(annualCO2Kg(co2Diff))

  // positive = comparison costs more = Opel wins = green
  const opelWins = costDiff >= 0
  const winColor  = opelWins ? '#16A37A' : '#E8772E'

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2 py-6 min-w-[140px]">

      <div className="text-[10px] font-bold tracking-[0.25em] text-white/30 uppercase">vs</div>

      {/* Hero delta */}
      <div className="text-center">
        <div className="font-display font-bold text-3xl leading-none" style={{ color: winColor }}>
          {costDiff >= 0 ? '+' : '−'} CHF {fmt2(Math.abs(costDiff))}
        </div>
        <div className="text-[11px] text-white/40 mt-1">/100 km</div>
      </div>

      {/* Label */}
      <div
        className="text-[10px] font-bold px-2.5 py-1 rounded-full text-center leading-tight"
        style={{ background: winColor + '20', color: winColor }}
      >
        {opelWins ? t.opelCheaper : t.rivalCheaper}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10" />

      {/* CO2 */}
      <div className="text-center">
        <div
          className="font-mono font-bold text-lg"
          style={{ color: co2Diff >= 0 ? '#16A37A' : '#E8772E' }}
        >
          {co2Diff >= 0 ? '+' : '−'}{fmtCO2(Math.abs(co2Diff))}
          <span className="text-xs ml-0.5">g/km</span>
        </div>
        <div className="text-[10px] text-white/30">CO₂</div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Annual */}
      <div className="text-center rounded-xl bg-white/5 px-3 py-3 w-full">
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">
          {fmtInt(ANNUAL_KM)} km/yr
        </p>
        <p className="font-mono font-bold text-base" style={{ color: winColor }}>
          CHF {fmtInt(annualDiff)}
        </p>
        <p className="text-[9px] text-white/30 mt-0.5">
          {fmtInt(annualCO2)} kg CO₂
        </p>
      </div>
    </div>
  )
}
