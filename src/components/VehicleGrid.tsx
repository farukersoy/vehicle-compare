'use client'

import { useEffect, useMemo, useState } from 'react'
import { Vehicle, VehicleType, CostResult } from '@/types'
import { brands } from '@/data/vehicles'
import { ThumbVehicleCard } from './VehicleCard'
import { IconChevronDown, IconSearch } from './Icons'
import { Translation } from '@/lib/i18n'

interface Props {
  vehicles: Vehicle[]
  results: Map<string, CostResult>
  selectedId: string | null
  onSelect: (id: string) => void
  t: Translation
}

type TypeFilter = 'ALL' | VehicleType

const PAGE_SIZE = 12

export default function VehicleGrid({ vehicles, results, selectedId, onSelect, t }: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [brandFilter, setBrandFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [typeFilter, brandFilter, query])

  const TABS: { label: string; value: TypeFilter }[] = [
    { label: t.typeAll, value: 'ALL' },
    { label: 'BEV', value: 'BEV' },
    { label: 'PHEV', value: 'PHEV' },
    { label: 'HEV', value: 'HEV' },
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vehicles
      .filter((v) => !v.isReference)
      .filter((v) => typeFilter === 'ALL' || v.type === typeFilter)
      .filter((v) => brandFilter === 'ALL' || v.brand === brandFilter)
      .filter((v) => !q || `${v.brand} ${v.model}`.toLowerCase().includes(q))
  }, [vehicles, typeFilter, brandFilter, query])

  const visible = filtered.slice(0, visibleCount)
  const canShowMore = visibleCount < filtered.length
  const canShowLess = !canShowMore && visibleCount > PAGE_SIZE

  return (
    <section>
      {/* Search + brand */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">{t.searchPlaceholder}</span>
          <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          {/* 16px text so iOS doesn't zoom on focus */}
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder} autoComplete="off" enterKeyHint="search"
            className="w-full min-h-12 rounded-xl border border-border bg-surface pl-11 pr-4 text-base text-ink
                       placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent" />
        </label>

        <label className="relative sm:w-56">
          <span className="sr-only">{t.brandFilter}</span>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full min-h-12 appearance-none rounded-xl border border-border bg-surface pl-4 pr-10
                       text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent">
            <option value="ALL">{t.allBrands}</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <IconChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </label>
      </div>

      {/* Type chips — horizontally scrollable, bleeds to the screen edge on mobile */}
      <div className="mt-3 flex items-center gap-3">
        <div role="group" aria-label={t.typeFilter}
             className="no-scrollbar flex gap-2 overflow-x-auto -ml-4 pl-4 sm:ml-0 sm:pl-0 py-0.5 flex-1 min-w-0">
          {TABS.map(({ label, value }) => {
            const active = typeFilter === value
            return (
              <button key={value} type="button" aria-pressed={active} onClick={() => setTypeFilter(value)}
                className={`flex-shrink-0 min-h-11 px-5 rounded-full border text-sm font-semibold transition-colors
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                            ${active
                              ? 'bg-accent border-accent text-white'
                              : 'bg-surface border-border text-ink hover:border-slate-300'}`}>
                {label}
              </button>
            )
          })}
        </div>
        <span className="text-sm text-muted-page whitespace-nowrap flex-shrink-0" aria-live="polite">
          {filtered.length} {t.vehicles}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-[15px] text-muted-page">{t.noResults}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {visible.map((v, i) => {
            const result = results.get(v.id)
            if (!result) return null
            return (
              <ThumbVehicleCard key={v.id} vehicle={v} result={result}
                isSelected={v.id === selectedId} onClick={() => onSelect(v.id)}
                revealDelayMs={Math.min(i % PAGE_SIZE, 8) * 30} rangeLabel={t.range} />
            )
          })}
        </div>
      )}

      {(canShowMore || canShowLess) && (
        <div className="flex justify-center mt-6">
          <button type="button"
            onClick={() => canShowMore
              ? setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
              : setVisibleCount(PAGE_SIZE)}
            className="min-h-11 px-6 rounded-full border border-border bg-surface text-sm font-semibold text-ink
                       hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {canShowMore ? t.loadMore : t.showLess}
          </button>
        </div>
      )}
    </section>
  )
}
