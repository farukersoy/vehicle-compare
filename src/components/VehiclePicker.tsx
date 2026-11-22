'use client'

import { useEffect, useMemo, useState } from 'react'
import { Vehicle, VehicleType, CostResult } from '@/types'
import { brands } from '@/data/vehicles'
import VehicleVisual from './VehicleVisual'
import BrandLogo from './BrandLogo'
import { IconChevronDown, IconSearch } from './Icons'
import { fmt2 } from '@/lib/calculations'
import { shownDiff, shownValues } from '@/lib/display'
import { Translation } from '@/lib/i18n'

interface Props {
  vehicles: Vehicle[]
  /** Each vehicle at its own default charging rate. */
  results: Map<string, CostResult>
  referenceResult: CostResult
  selectedId: string | null
  onSelect: (id: string) => void
  t: Translation
}

type TypeFilter = 'ALL' | VehicleType
type SortKey = 'cost' | 'diff' | 'co2'

const PAGE_SIZE = 12

const selectClass = `w-full min-h-11 appearance-none rounded-xl border border-border bg-surface pl-4 pr-10
                     text-base sm:text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`

function DiffText({ diff, t }: { diff: number; t: Translation }) {
  const text = diff === 0 ? t.diffSame
    : (diff > 0 ? t.diffMore : t.diffLess).replace('{d}', `CHF ${fmt2(Math.abs(diff))}`)
  // Same colour logic as the result sentence: green = reference cheaper, red = this car cheaper.
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-lg text-xs font-semibold tabular-nums whitespace-nowrap
                      ${diff >= 0 ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'}`}>
      {text}<span className="sr-only"> {t.vsReference}</span>
    </span>
  )
}

function PickerRow({ vehicle, result, referenceResult, selected, onSelect, t }: {
  vehicle: Vehicle; result: CostResult; referenceResult: CostResult; selected: boolean; onSelect: () => void; t: Translation
}) {
  const cost = shownValues(result).cost
  const diff = shownDiff(referenceResult, result).cost
  return (
    <li className="min-w-0">
      <button type="button" onClick={onSelect} aria-pressed={selected}
        className={`w-full min-h-16 flex items-center gap-3 rounded-xl border bg-surface px-3 py-2 text-left
                    transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                    ${selected ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-muted/40'}`}>
        <BrandLogo brand={vehicle.brand} size={20} className="text-muted flex-shrink-0" />
        <span className="relative w-14 sm:w-16 aspect-[16/10] flex-shrink-0 rounded-lg bg-page overflow-hidden">
          <VehicleVisual vehicle={vehicle} sizes="64px" className="p-0.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink truncate">{vehicle.brand}</span>
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted truncate">{vehicle.model}</span>
            <span className="flex-shrink-0 inline-flex items-center h-5 px-2 rounded-full border border-border text-[11px] font-semibold text-ink">
              {vehicle.type}
            </span>
          </span>
        </span>
        <span className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className="text-sm font-semibold text-ink tabular-nums whitespace-nowrap">
            CHF {fmt2(cost)}<span className="text-xs font-normal text-muted"> /100 km</span>
          </span>
          <DiffText diff={diff} t={t} />
        </span>
      </button>
    </li>
  )
}

export default function VehiclePicker({ vehicles, results, referenceResult, selectedId, onSelect, t }: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [brandFilter, setBrandFilter] = useState('ALL')
  const [sort, setSort] = useState<SortKey>('cost')
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [typeFilter, brandFilter, query, sort])

  // Only offer type chips that have at least one pickable vehicle.
  const availableTypes = useMemo(() => new Set(vehicles.filter((v) => !v.isReference).map((v) => v.type)), [vehicles])
  const tabs: { label: string; value: TypeFilter }[] = [
    { label: t.typeAll, value: 'ALL' },
    ...(['BEV', 'PHEV', 'HEV'] as const).filter((x) => availableTypes.has(x)).map((x) => ({ label: x, value: x })),
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const key = (v: Vehicle) => {
      const r = results.get(v.id)!
      if (sort === 'co2') return shownValues(r).co2
      if (sort === 'diff') return Math.abs(shownDiff(referenceResult, r).cost)
      return shownValues(r).cost
    }
    return vehicles
      .filter((v) => !v.isReference && results.has(v.id))
      .filter((v) => typeFilter === 'ALL' || v.type === typeFilter)
      .filter((v) => brandFilter === 'ALL' || v.brand === brandFilter)
      .filter((v) => !q || `${v.brand} ${v.model}`.toLowerCase().includes(q))
      .map((v) => ({ v, k: key(v) }))
      .sort((a, b) => a.k - b.k || `${a.v.brand} ${a.v.model}`.localeCompare(`${b.v.brand} ${b.v.model}`))
      .map(({ v }) => v)
  }, [vehicles, results, referenceResult, typeFilter, brandFilter, query, sort])

  const visible = filtered.slice(0, visibleCount)
  const canShowMore = visibleCount < filtered.length
  const canShowLess = !canShowMore && visibleCount > PAGE_SIZE

  return (
    <section>
      {/* Toolbar */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="relative min-w-0">
          <span className="sr-only">{t.searchPlaceholder}</span>
          <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          {/* 16px text so iOS doesn't zoom on focus */}
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder} autoComplete="off" enterKeyHint="search"
            className="w-full min-h-11 rounded-xl border border-border bg-surface pl-11 pr-4 text-base sm:text-sm text-ink
                       placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
        </label>
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <label className="relative min-w-0">
            <span className="sr-only">{t.brandFilter}</span>
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className={selectClass}>
              <option value="ALL">{t.allBrands}</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <IconChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </label>
          <label className="relative min-w-0">
            <span className="sr-only">{t.sortLabel}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClass}>
              <option value="cost">{t.sortCost}</option>
              <option value="diff">{t.sortDiff}</option>
              <option value="co2">{t.sortCo2}</option>
            </select>
            <IconChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </label>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div role="group" aria-label={t.typeFilter} className="no-scrollbar flex gap-2 overflow-x-auto py-0.5 flex-1 min-w-0">
          {tabs.map(({ label, value }) => {
            const active = typeFilter === value
            return (
              <button key={value} type="button" aria-pressed={active} onClick={() => setTypeFilter(value)}
                className={`flex-shrink-0 min-h-11 px-5 rounded-full border text-sm font-semibold
                            transition-colors duration-150 motion-reduce:transition-none
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                            ${active ? 'bg-accent border-accent text-white' : 'bg-surface border-border text-ink hover:border-muted/40'}`}>
                {label}
              </button>
            )
          })}
        </div>
        <span className="text-sm text-muted whitespace-nowrap flex-shrink-0" aria-live="polite">
          {filtered.length} {t.vehicles}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-[15px] text-muted">{t.noResults}</p>
      ) : (
        <ul className="mt-4 grid gap-2 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {visible.map((v) => (
            <PickerRow key={v.id} vehicle={v} result={results.get(v.id)!} referenceResult={referenceResult}
              selected={v.id === selectedId} onSelect={() => onSelect(v.id)} t={t} />
          ))}
        </ul>
      )}

      {(canShowMore || canShowLess) && (
        <div className="flex justify-center mt-6">
          <button type="button"
            onClick={() => canShowMore
              ? setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
              : setVisibleCount(PAGE_SIZE)}
            className="min-h-11 px-6 rounded-xl border border-border bg-surface text-sm font-semibold text-ink
                       hover:border-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {canShowMore ? t.loadMore : t.showLess}
          </button>
        </div>
      )}
    </section>
  )
}
