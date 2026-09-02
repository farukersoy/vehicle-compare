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

  // positive = comparison costs more = Opel wins = green.
  // Rival cheaper uses red (not orange) — it's the "pay attention" signal.
  const opelWins = costDiff >= 0
  const winColor  = opelWins ? '#16A37A' : '#DC2626'
  const co2Color  = co2Diff >= 0 ? '#16A37A' : '#E8772E'

  const cheaperLabel = opelWins ? t.opelCheaper : t.rivalCheaper
  const signedCost = `${costDiff >= 0 ? '+' : '−'} CHF ${fmt2(Math.abs(costDiff))}`
  const signedCo2 = `${co2Diff >= 0 ? '+' : '−'}${fmtCO2(Math.abs(co2Diff))}`

  return (
    <>
      {/* Desktop — narrow vertical column between the two cards */}
      <div className="hidden md:flex flex-col items-center justify-center gap-5 px-2 py-8 min-w-[140px]">

        <div className="text-[10px] font-bold tracking-[0.25em] text-gray-300 uppercase">vs</div>

        {/* Hero delta */}
        <div className="text-center">
          <div className="font-display font-bold text-4xl leading-none tabular-nums" style={{ color: winColor }}>
            {signedCost}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">/100 km</div>
        </div>

        {/* Label */}
        <div
          className="text-[10px] font-bold px-2.5 py-1 rounded-full text-center leading-tight"
          style={{ background: winColor + '18', color: winColor }}
        >
          {cheaperLabel}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border" />

        {/* CO2 */}
        <div className="text-center">
          <div className="font-mono font-bold text-lg tabular-nums" style={{ color: co2Color }}>
            {signedCo2}
            <span className="text-xs ml-0.5">g/km</span>
          </div>
          <div className="text-[10px] text-gray-400">CO₂</div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Annual */}
        <div className="text-center rounded-xl bg-surface-sunken px-3 py-3 w-full">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">
            {fmtInt(ANNUAL_KM)} km/yr
          </p>
          <p className="font-mono font-bold text-base tabular-nums" style={{ color: winColor }}>
            CHF {fmtInt(annualDiff)}
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5">
            {fmtInt(annualCO2)} kg CO₂
          </p>
        </div>
      </div>

      {/* Mobile — horizontal band between the two stacked cards */}
      <div className="flex md:hidden items-center justify-between gap-4
                       rounded-2xl border border-border bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold tracking-[0.2em] text-gray-300 uppercase">vs</span>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full leading-tight"
              style={{ background: winColor + '18', color: winColor }}
            >
              {cheaperLabel}
            </span>
          </div>
          <div className="font-display font-bold text-2xl leading-none tabular-nums" style={{ color: winColor }}>
            {signedCost}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">/100 km</div>
        </div>

        <div className="w-px self-stretch bg-border" />

        <div className="text-right">
          <div className="font-mono font-bold text-sm tabular-nums" style={{ color: co2Color }}>
            {signedCo2}<span className="text-[10px] ml-0.5">g/km CO₂</span>
          </div>
          <p className="font-mono font-bold text-sm tabular-nums mt-1.5" style={{ color: winColor }}>
            CHF {fmtInt(annualDiff)}<span className="text-[10px] font-normal text-gray-400">/{t.perYear}</span>
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5">
            {fmtInt(annualCO2)} kg CO₂ · {fmtInt(ANNUAL_KM)} km
          </p>
        </div>
      </div>
    </>
  )
}
