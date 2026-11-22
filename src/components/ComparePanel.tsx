'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import VehicleVisual from './VehicleVisual'
import BrandLogo from './BrandLogo'
import { Segmented } from './Controls'
import { IconBolt, IconCar, IconCheck, IconChevronDown, IconFuel, IconHome, IconInfo } from './Icons'
import { CostResult, Settings, Vehicle } from '@/types'
import { ANNUAL_KM, fmt2, fmtCH, fmtCO2 } from '@/lib/calculations'
import { bestIndex, shownDiff, shownValues } from '@/lib/display'
import { isAiImage } from '@/lib/photo-credits'
import { useCountUp } from '@/lib/motion'
import { Translation } from '@/lib/i18n'

interface Props {
  reference: Vehicle
  referenceResult: CostResult
  selected: Vehicle | null
  selectedResult: CostResult | null
  settings: Settings
  onRateChange: (rate: Settings['chargeRate']) => void
  onPickVehicle: () => void
  t: Translation
}

const fill = (tpl: string, values: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '')

// ─── Small parts ──────────────────────────────────────────────────────────────

function TypeChip({ type }: { type: Vehicle['type'] }) {
  return (
    <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-border bg-surface text-xs font-semibold text-ink">
      {type}
    </span>
  )
}

/** Two lines at most: the distance and one short caption. */
function RangeBadge({ km, caption }: { km: number; caption: string }) {
  return (
    <div className="inline-block rounded-lg bg-range text-white text-right px-2.5 py-1.5 max-w-[9rem]">
      <div className="font-display font-semibold text-base leading-tight tabular-nums whitespace-nowrap">≈ {fmtCH(km)} km</div>
      <div className="text-xs leading-tight whitespace-nowrap truncate">{caption}</div>
    </div>
  )
}

/** "i" button (44 px target) that shows a short note below its row. */
function InfoButton({ label, open, onToggle, controls }: { label: string; open: boolean; onToggle: () => void; controls: string }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={controls} aria-label={label}
      className="-my-2 inline-flex items-center justify-center size-11 rounded-xl text-muted hover:text-ink
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <IconInfo size={16} />
    </button>
  )
}

function VehicleHeader({ vehicle, isReference, t }: { vehicle: Vehicle; isReference: boolean; t: Translation }) {
  return (
    <div className="min-w-0 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 min-h-7">
        <BrandLogo brand={vehicle.brand} size={28} className="text-ink" />
        <TypeChip type={vehicle.type} />
      </div>
      <div className="relative aspect-[16/10] rounded-xl bg-page overflow-hidden">
        <VehicleVisual vehicle={vehicle} priority={isReference} className="p-2"
          sizes="(max-width: 639px) 45vw, (max-width: 1151px) 40vw, 460px" />
        {vehicle.image && isAiImage(vehicle.id) && (
          <span className="absolute bottom-1.5 right-2 z-10 px-1.5 rounded bg-surface/80 text-[12px] leading-5 text-muted pointer-events-none">
            {t.illustration}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-[17px] sm:text-lg leading-tight text-ink truncate">{vehicle.brand}</p>
        <p className="text-sm text-muted leading-snug truncate">{vehicle.model}</p>
      </div>
      {isReference && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="border-l-[3px] border-highlight pl-2 text-xs leading-snug text-ink">{t.yourReference}</p>
          {vehicle.rangeKm != null && <RangeBadge km={vehicle.rangeKm} caption={t.rangeReference} />}
        </div>
      )}
    </div>
  )
}

function Placeholder({ onPick, t }: { onPick: () => void; t: Translation }) {
  return (
    <div className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 p-4 text-center">
      <IconCar size={32} className="text-muted" />
      <p className="text-sm text-muted max-w-[12rem]">{t.pickPrompt}</p>
      <button type="button" onClick={onPick}
        className="min-h-11 px-5 rounded-xl bg-accent text-white text-sm font-semibold
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
        {t.pickVehicle}
      </button>
    </div>
  )
}

/** One value cell; the best cell is bold with a check icon and an sr-only label. */
function Cell({ text, best, big, t }: { text: string; best: boolean; big?: boolean; t: Translation }) {
  return (
    <div className={`min-w-0 flex items-baseline gap-1.5 ${big ? 'font-display text-[26px] sm:text-[30px] leading-none' : 'text-lg sm:text-xl leading-tight'}
                     tabular-nums text-ink ${best ? 'font-bold' : 'font-medium'}`}>
      <span className="truncate">{text}</span>
      {best && (
        <span className="inline-flex self-center flex-shrink-0 text-ink">
          <IconCheck size={big ? 20 : 16} strokeWidth={2.5} />
          <span className="sr-only">({t.bestValue})</span>
        </span>
      )}
    </div>
  )
}

function Row({ label, unit, values, best, big, info, t }: {
  label: string; unit: string; values: [string, string]; best: 0 | 1 | null; big?: boolean
  info?: string; t: Translation
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="py-4 border-t border-border">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
        <div className="col-span-2 sm:col-span-1 flex items-center gap-1 min-w-0">
          <span className="text-sm font-medium text-muted">{label} <span className="whitespace-nowrap">({unit})</span></span>
          {info && <InfoButton label={`${t.infoAbout} ${label}`} open={open} onToggle={() => setOpen((o) => !o)} controls={id} />}
        </div>
        <Cell text={values[0]} best={best === 0} big={big} t={t} />
        <Cell text={values[1]} best={best === 1} big={big} t={t} />
      </div>
      {info && open && <p id={id} className="mt-2 text-xs leading-relaxed text-muted max-w-prose">{info}</p>}
    </div>
  )
}

function ResultSentence({ diff, yearDiff, t }: { diff: number; yearDiff: number; t: Translation }) {
  const refCheaper = diff >= 0
  const animated = useCountUp(Math.abs(diff))
  const animatedYear = useCountUp(Math.abs(yearDiff))
  const sentence = (d: number, y: number) =>
    diff === 0 ? t.resultEqual
      : fill(refCheaper ? t.resultRefCheaper : t.resultCompCheaper,
          { d: `CHF ${fmt2(d)}`, y: `CHF ${fmtCH(Math.round(y))}` })
  return (
    <div className={`rounded-xl px-4 py-4 sm:px-6 sm:py-5 ${refCheaper ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'}`}>
      <p className="font-display font-semibold text-2xl sm:text-[30px] leading-tight" aria-hidden="true">
        {sentence(animated, animatedYear)}
      </p>
      <p className="sr-only" aria-live="polite">{sentence(Math.abs(diff), Math.abs(yearDiff))}</p>
    </div>
  )
}

function DetailsSide({ vehicle, result, t }: { vehicle: Vehicle; result: CostResult; t: Translation }) {
  return (
    <div className="min-w-0 space-y-3 text-sm">
      <p className="font-semibold text-ink truncate">{vehicle.brand} {vehicle.model}</p>
      <div>
        <p className="text-xs text-muted mb-1">{t.consumption}</p>
        <ul className="space-y-1">
          {result.electricKwhUsed > 0 && (
            <li className="flex justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted"><IconBolt size={14} /> {fmt2(result.electricKwhUsed)} kWh</span>
              <span className="font-mono tabular-nums text-ink">CHF {fmt2(result.electricCostPer100km)}</span>
            </li>
          )}
          {result.fuelLUsed > 0 && (
            <li className="flex justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted"><IconFuel size={14} /> {fmt2(result.fuelLUsed)} L</span>
              <span className="font-mono tabular-nums text-ink">CHF {fmt2(result.fuelCostPer100km)}</span>
            </li>
          )}
        </ul>
      </div>
      {vehicle.isReference && vehicle.invoice && (
        <div className="rounded-xl bg-page px-3 py-2.5">
          <p className="text-xs font-semibold text-muted mb-1.5">{t.yourBilling} · {fmtCH(vehicle.invoice.km)} km</p>
          <dl className="space-y-1">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">{t.electricity} {fmtCH(vehicle.invoice.electricityKwh, 2)} kWh</dt>
              <dd className="font-mono tabular-nums text-ink">CHF {fmtCH(vehicle.invoice.electricityCHF, 2)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">{t.petrol} {fmtCH(vehicle.invoice.fuelL, 2)} L</dt>
              <dd className="font-mono tabular-nums text-ink">CHF {fmtCH(vehicle.invoice.fuelCHF, 2)}</dd>
            </div>
            <div className="flex justify-between gap-2 pt-1 border-t border-border font-semibold">
              <dt className="text-ink">{t.total}</dt>
              <dd className="font-mono tabular-nums text-ink">CHF {fmtCH(vehicle.invoice.totalCHF, 2)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">{t.per100km}</dt>
              <dd className="font-mono tabular-nums text-ink">CHF {fmt2(vehicle.invoice.costPer100kmCHF)}</dd>
            </div>
          </dl>
        </div>
      )}
      <p className="text-xs leading-snug text-muted">
        <span className="font-semibold">{vehicle.dataQuality === 'measured' ? t.measured : t.estimated}</span>
        {' — '}{vehicle.sourceNote}
      </p>
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ComparePanel({
  reference, referenceResult, selected, selectedResult, settings, onRateChange, onPickVehicle, t,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailsId = useId()

  const a = shownValues(referenceResult)
  const b = selectedResult ? shownValues(selectedResult) : null
  const diff = selectedResult ? shownDiff(referenceResult, selectedResult) : null
  const dash = '–'

  const hasRange = reference.rangeKm != null || selected?.rangeKm != null
  const showToggle = !!selected && selected.type !== 'HEV'

  const info = {
    cost: fill(t.infoCost, {
      home: settings.homePriceCHF.toFixed(3), public: settings.publicPriceCHF.toFixed(2), fuel: settings.fuelPriceCHF.toFixed(3),
    }),
    year: fill(t.infoYear, { km: fmtCH(ANNUAL_KM) }),
    co2: fill(t.infoCo2, { grid: String(settings.co2GridGkwh) }),
    range: t.infoRange,
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.12)] p-4 sm:p-6">
      {/* Headers: reference | compared */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="hidden sm:block" aria-hidden />
        <VehicleHeader vehicle={reference} isReference t={t} />
        {selected ? <VehicleHeader vehicle={selected} isReference={false} t={t} /> : <Placeholder onPick={onPickVehicle} t={t} />}
      </div>

      {/* Charging toggle of the compared car (full width on mobile, under its column from sm) */}
      {showToggle && (
        <div className="mt-4 grid sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-6">
          <div className="hidden sm:block sm:col-span-2" aria-hidden />
          <div className="flex flex-col items-end sm:items-start gap-1">
            <Segmented label={t.charging} value={settings.chargeRate} onChange={onRateChange}
              options={[
                { value: 'home', label: t.home, icon: <IconHome size={15} /> },
                { value: 'public', label: t.public, icon: <IconBolt size={15} /> },
              ]} />
            <p className="text-xs text-muted">{t.priceBasisCompared}</p>
          </div>
        </div>
      )}

      {/* Result sentence */}
      <div className="mt-5">
        {selected && diff ? (
          <ResultSentence diff={diff.cost} yearDiff={diff.year} t={t} />
        ) : (
          <p className="rounded-xl bg-page px-4 py-4 text-[15px] text-muted">{t.pickPrompt}</p>
        )}
      </div>

      {/* Four rows */}
      <div className="mt-2">
        <Row label={t.rowCost100} unit="CHF" big info={info.cost} t={t}
          values={[fmt2(a.cost), b ? fmt2(b.cost) : dash]} best={b ? bestIndex(a.cost, b.cost) : null} />
        <Row label={t.rowCostYear} unit="CHF" big info={info.year} t={t}
          values={[fmtCH(a.year), b ? fmtCH(b.year) : dash]} best={b ? bestIndex(a.year, b.year) : null} />
        <Row label={t.rowCo2} unit="g/km" info={info.co2} t={t}
          values={[fmtCO2(a.co2), b ? fmtCO2(b.co2) : dash]} best={b ? bestIndex(a.co2, b.co2) : null} />
        {hasRange && (
          <Row label={t.rowRange} unit="km" info={info.range} t={t}
            values={[reference.rangeKm != null ? fmtCH(reference.rangeKm) : dash,
                     selected ? (selected.rangeKm != null ? fmtCH(selected.rangeKm) : dash) : dash]}
            best={selected ? bestIndex(reference.rangeKm, selected.rangeKm, true) : null} />
        )}
      </div>

      {/* Details */}
      <div className="border-t border-border pt-2">
        <button type="button" onClick={() => setDetailsOpen((o) => !o)} aria-expanded={detailsOpen} aria-controls={detailsId}
          className="w-full min-h-11 flex items-center justify-between gap-2 rounded-xl px-1 text-sm font-semibold text-ink
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t.details}
          <IconChevronDown size={18} className={`text-muted transition-transform duration-200 motion-reduce:transition-none ${detailsOpen ? 'rotate-180' : ''}`} />
        </button>
        {detailsOpen && (
          <div id={detailsId} className="pt-3 pb-1">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailsSide vehicle={reference} result={referenceResult} t={t} />
              {selected && selectedResult && <DetailsSide vehicle={selected} result={selectedResult} t={t} />}
            </div>
            <p className="mt-4 text-sm">
              <Link href="/methodik" className="text-ink underline underline-offset-2">{t.methodology}</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
