'use client'

import { CostResult } from '@/types'
import { fmt2, fmtCO2, fmtCH, annualCostCHF, annualCO2Kg, ANNUAL_KM } from '@/lib/calculations'
import { Translation } from '@/lib/i18n'
import { useCountUp } from '@/lib/motion'

interface Props {
  reference: CostResult
  comparison: CostResult
  t: Translation
}

/** Signed cost difference (comparison − reference) formatted as "+ CHF 1.23" / "− CHF 1.23". */
export function formatCostDiff(diff: number): string {
  return `${diff >= 0 ? '+' : '−'} CHF ${fmt2(Math.abs(diff))}`
}

/**
 * The hero of the comparison: below lg it is a full-width band between the
 * stacked cards, from lg up a column between the two cards.
 */
export default function ComparisonDelta({ reference, comparison, t }: Props) {
  const costDiff   = comparison.costPer100kmCHF - reference.costPer100kmCHF
  const co2Diff    = comparison.co2TotalGkm     - reference.co2TotalGkm
  const annualDiff = annualCostCHF(Math.abs(costDiff))
  const annualCO2  = Math.abs(annualCO2Kg(co2Diff))

  // positive = compared car costs more = Opel wins = green; rival cheaper = red.
  const opelWins = costDiff >= 0
  const animated = useCountUp(costDiff)

  const tone = opelWins
    ? { band: 'bg-positive-soft border-positive/30', ink: 'text-positive-ink', pill: 'bg-surface text-positive-ink' }
    : { band: 'bg-attention-soft border-attention/30', ink: 'text-attention-ink', pill: 'bg-surface text-attention-ink' }
  const co2Ink = co2Diff >= 0 ? 'text-positive-ink' : 'text-attention-ink'

  const signedCo2 = `${co2Diff >= 0 ? '+' : '−'}${fmtCO2(Math.abs(co2Diff))}`

  return (
    <section
      aria-label={t.differencePer100}
      className={`rounded-xl border ${tone.band} px-4 py-4 sm:px-6 sm:py-5
                  lg:px-4 lg:py-6 lg:h-full lg:flex lg:flex-col lg:justify-center lg:text-center`}
    >
      <div className="flex items-center justify-between gap-3 lg:flex-col lg:gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-page">{t.differencePer100}</p>
        <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-semibold ${tone.pill}`}>
          {opelWins ? t.opelCheaper : t.rivalCheaper}
        </span>
      </div>

      {/* Hero number — counts up on change; screen readers get the final value */}
      <p className={`mt-2 font-display font-semibold text-[40px] lg:text-[32px] xl:text-4xl leading-none
                     tabular-nums whitespace-nowrap ${tone.ink}`}
         aria-hidden="true">
        {formatCostDiff(animated)}
      </p>
      <p className="sr-only" aria-live="polite">{formatCostDiff(costDiff)} /100 km</p>

      <div className="mt-4 pt-4 border-t border-ink/10 grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
        <div>
          <p className="text-xs text-muted-page">{t.co2Difference}</p>
          <p className={`font-mono font-semibold text-[15px] tabular-nums ${co2Ink}`}>
            {signedCo2} g/km
          </p>
        </div>
        <div className="text-right lg:text-center">
          <p className="text-xs text-muted-page">{t.annualAt} {fmtCH(ANNUAL_KM)} km</p>
          <p className={`font-mono font-semibold text-[15px] tabular-nums ${tone.ink}`}>
            CHF {fmtCH(annualDiff)}
          </p>
          <p className="text-xs text-muted-page">{fmtCH(annualCO2)} kg CO₂</p>
        </div>
      </div>
    </section>
  )
}
