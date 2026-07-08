'use client'

import { useState } from 'react'
import { Vehicle, VehicleType, CostResult } from '@/types'
import { brands } from '@/data/vehicles'
import { ThumbVehicleCard } from './VehicleCard'
import { Translation } from '@/lib/i18n'

interface Props {
  vehicles: Vehicle[]
  results: Map<string, CostResult>
  selectedId: string | null
  onSelect: (id: string) => void
  t: Translation
}

type TypeFilter = 'ALL' | VehicleType

export default function VehicleGrid({ vehicles, results, selectedId, onSelect, t }: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [brandFilter, setBrandFilter] = useState('ALL')

  const TABS: { label: string; value: TypeFilter }[] = [
    { label: t.typeAll, value: 'ALL' },
    { label: '⚡ BEV', value: 'BEV' },
    { label: '🔌 PHEV', value: 'PHEV' },
    { label: '♻️ HEV', value: 'HEV' },
  ]

  const filtered = vehicles
    .filter((v) => !v.isReference)
    .filter((v) => typeFilter === 'ALL' || v.type === typeFilter)
    .filter((v) => brandFilter === 'ALL' || v.brand === brandFilter)

  return (
    <section>
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-xl overflow-hidden border border-white/15">
          {TABS.map(({ label, value }) => (
            <button key={value} onClick={() => setTypeFilter(value)}
              className={`px-4 py-2 text-sm font-semibold transition-colors
                ${typeFilter === value
                  ? 'bg-white text-navy' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {label}
            </button>
          ))}
        </div>

        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded-xl border border-white/15 bg-white/5 text-sm text-white
                     px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30">
          <option value="ALL" className="text-navy">{t.allBrands}</option>
          {brands.map((b) => <option key={b} value={b} className="text-navy">{b}</option>)}
        </select>

        <span className="text-sm text-white/40 ml-auto">
          {filtered.length} {t.vehicles}
        </span>
      </div>

      {/* Grid — larger cards, fewer columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((v) => {
          const result = results.get(v.id)
          if (!result) return null
          return (
            <ThumbVehicleCard key={v.id} vehicle={v} result={result}
              isSelected={v.id === selectedId} onClick={() => onSelect(v.id)} />
          )
        })}
      </div>
    </section>
  )
}
