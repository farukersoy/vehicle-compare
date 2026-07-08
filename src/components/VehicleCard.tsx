'use client'

import VehicleVisual from './VehicleVisual'
import BrandLogo from './BrandLogo'
import { Vehicle, CostResult } from '@/types'
import { fmt2, fmtCO2 } from '@/lib/calculations'
import { Translation } from '@/lib/i18n'

// ─── Large card (comparison panel) ────────────────────────────────────────────

interface LargeProps {
  vehicle: Vehicle
  result: CostResult
  t: Translation
}

export function LargeVehicleCard({ vehicle, result, t }: LargeProps) {
  const c = vehicle.brandColor

  return (
    // h-full + flex → equal height in the grid
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="h-1.5" style={{ background: c }} />

      <div className="p-6 flex flex-col gap-5 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                 style={{ background: c + '18' }}>
              <BrandLogo brand={vehicle.brand} domain={vehicle.brandDomain} size={32} />
            </div>
            <div>
              <p className="font-display font-bold text-navy text-xl leading-tight">
                {vehicle.brand}
              </p>
              <p className="text-sm text-gray-400 leading-tight">{vehicle.model}</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: c + '18', color: c }}>
            {vehicle.type}
          </span>
        </div>

        {/* Reference badge — fixed height slot so both cards align */}
        <div className="h-9 flex items-center">
          {vehicle.isReference ? (
            <div className="w-full text-xs font-semibold px-3 py-2 rounded-lg text-center"
                 style={{ background: c + '18', color: c }}>
              {t.yourReference}
            </div>
          ) : (
            <div className="w-full text-xs font-medium px-3 py-2 rounded-lg text-center text-gray-400 bg-gray-50">
              {t.typeLabels[vehicle.type]}
            </div>
          )}
        </div>

        {/* Visual — fixed height */}
        <div className="rounded-xl h-40 flex items-center justify-center overflow-hidden"
             style={{ background: c + '10' }}>
          <VehicleVisual vehicle={vehicle} className="w-full h-full p-2" />
        </div>

        {/* Hero cost */}
        <div className="rounded-xl p-5" style={{ background: c + '0D' }}>
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
            {t.energyCost}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-4xl" style={{ color: c }}>
              CHF {fmt2(result.costPer100kmCHF)}
            </span>
            <span className="text-gray-400 text-sm">/100km</span>
          </div>

          {/* Breakdown — fixed height slot (2 rows) */}
          <div className="mt-3 pt-3 border-t space-y-1.5 min-h-[52px]"
               style={{ borderColor: c + '30' }}>
            {result.electricKwhUsed > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">⚡ {fmt2(result.electricKwhUsed)} kWh</span>
                <span className="font-mono font-semibold text-gray-700">
                  CHF {fmt2(result.electricCostPer100km)}
                </span>
              </div>
            )}
            {result.fuelLUsed > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">⛽ {fmt2(result.fuelLUsed)} L</span>
                <span className="font-mono font-semibold text-gray-700">
                  CHF {fmt2(result.fuelCostPer100km)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CO2 row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 text-xs">{vehicle.segment}</span>
          <span className="font-mono font-semibold text-gray-600">
            {fmtCO2(result.co2TotalGkm)} g/km CO₂
          </span>
        </div>

        {/* Data quality — pinned to bottom */}
        <div className="flex items-center gap-1.5 mt-auto">
          <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: vehicle.dataQuality === 'measured' ? '#16A37A' : '#94A3B8' }} />
          <span className="text-[10px] text-gray-400 leading-tight">
            {vehicle.dataQuality === 'measured' ? t.measured : t.estimated}
            {' — '}{vehicle.sourceNote}
          </span>
        </div>

      </div>
    </div>
  )
}

// ─── Thumbnail card (grid selector) — larger ──────────────────────────────────

interface ThumbProps {
  vehicle: Vehicle
  result: CostResult
  isSelected: boolean
  onClick: () => void
}

export function ThumbVehicleCard({ vehicle, result, isSelected, onClick }: ThumbProps) {
  const c = vehicle.brandColor

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-2xl border-2 p-4 transition-all duration-200
        hover:-translate-y-1 hover:shadow-xl focus:outline-none
        ${isSelected ? 'shadow-lg' : 'border-gray-100 bg-white hover:border-gray-200'}
      `}
      style={isSelected ? { borderColor: c, background: c + '08' } : {}}
    >
      {/* Logo + type */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
             style={{ background: c + '15' }}>
          <BrandLogo brand={vehicle.brand} domain={vehicle.brandDomain} size={26} />
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: c + '18', color: c }}>
          {vehicle.type}
        </span>
      </div>

      {/* Visual — bigger */}
      <div className="rounded-xl h-20 flex items-center justify-center overflow-hidden mb-3"
           style={{ background: isSelected ? c + '10' : '#F8FAFC' }}>
        <VehicleVisual vehicle={vehicle} className="w-full h-full p-1" />
      </div>

      {/* Name */}
      <p className="text-sm font-bold text-navy font-display truncate">{vehicle.brand}</p>
      <p className="text-xs text-gray-400 truncate">{vehicle.model}</p>

      {/* Cost */}
      <p className="font-mono font-bold text-base mt-2"
         style={{ color: isSelected ? c : '#374151' }}>
        CHF {fmt2(result.costPer100kmCHF)}
        <span className="text-[10px] font-normal text-gray-400 ml-0.5">/100km</span>
      </p>
    </button>
  )
}
