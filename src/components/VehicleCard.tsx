'use client'

import VehicleVisual from './VehicleVisual'
import BrandLogo from './BrandLogo'
import { Vehicle, CostResult } from '@/types'
import { fmt2, fmtCO2, fmtCH } from '@/lib/calculations'
import { Translation } from '@/lib/i18n'

// ─── Range badge ───────────────────────────────────────────────────────────────

function RangeBadge({ km, caption, compact = false, className = '' }: {
  km: number
  caption: string
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={`flex-shrink-0 rounded-xl text-white text-right shadow-md shadow-emerald-900/20
                  ${compact ? 'px-2 py-1 max-w-[6.5rem]' : 'px-3 py-1.5 max-w-[8.5rem] sm:max-w-[11rem] md:max-w-[8.5rem] lg:max-w-[11rem]'} ${className}`}
      style={{ background: '#16A37A' }}
    >
      <div className={`font-display font-bold leading-tight tabular-nums whitespace-nowrap
                       ${compact ? 'text-xs' : 'text-base sm:text-lg'}`}>
        ≈ {fmtCH(km)} km
      </div>
      <div className={`leading-tight opacity-90 ${compact ? 'text-[8px] truncate' : 'text-[9px] sm:text-[10px]'}`}>
        {caption}
      </div>
    </div>
  )
}

// ─── Large card (comparison panel) ────────────────────────────────────────────

interface LargeProps {
  vehicle: Vehicle
  result: CostResult
  t: Translation
  /** Text for a subtle "this one's cheaper" corner badge; omit to hide it. */
  cheaperBadgeLabel?: string
  /** Green when Opel/reference wins, red when the rival wins — same semantics as ComparisonDelta. */
  cheaperBadgeTone?: 'green' | 'red'
}

export function LargeVehicleCard({ vehicle, result, t, cheaperBadgeLabel, cheaperBadgeTone = 'green' }: LargeProps) {
  const c = vehicle.brandColor

  return (
    // h-full + flex → equal height in the grid
    <div className="relative bg-white rounded-2xl overflow-hidden border border-border shadow-lg shadow-slate-200/60 flex flex-col h-full">
      <div className="h-1.5" style={{ background: c }} />

      <div className="p-5 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-5 lg:gap-6 flex-1">

        {/* Top row — type pill on the left, range badge in the top-right corner.
            In normal flow (not absolute) so nothing overlaps at any width; fixed
            min-height keeps both cards aligned. The "cheaper" badge sits on the
            visual below so it never competes with the range badge. */}
        <div className="flex items-start justify-between gap-2 min-h-[3.5rem]">
          <div className="flex flex-wrap items-center gap-1.5 min-w-[3rem] flex-1 pt-1">
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: c + '18', color: c }}>
              {vehicle.type}
            </span>
          </div>
          {vehicle.rangeKm != null && (
            <RangeBadge km={vehicle.rangeKm} caption={vehicle.rangeNote ?? t.range}
                        className="-mt-2 -mr-2 sm:-mt-3 sm:-mr-3 lg:-mt-5 lg:-mr-5" />
          )}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: c + '18' }}>
            <BrandLogo brand={vehicle.brand} domain={vehicle.brandDomain} size={32} />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-navy text-xl leading-tight truncate">
              {vehicle.brand}
            </p>
            <p className="text-sm text-gray-400 leading-tight truncate">{vehicle.model}</p>
          </div>
        </div>

        {/* Reference badge — fixed height slot so both cards align */}
        <div className="h-9 flex items-center">
          {vehicle.isReference ? (
            <div className="w-full text-xs font-semibold px-3 py-2 rounded-lg text-center"
                 style={{ background: c + '18', color: c }}>
              {t.yourReference}
            </div>
          ) : (
            <div className="w-full text-xs font-medium px-3 py-2 rounded-lg text-center text-gray-400 bg-surface-sunken">
              {t.typeLabels[vehicle.type]}
            </div>
          )}
        </div>

        {/* Visual — fixed height, scales up on larger screens */}
        <div className="relative rounded-xl h-40 sm:h-48 lg:h-56 flex items-center justify-center overflow-hidden"
             style={{ background: c + '10' }}>
          <VehicleVisual vehicle={vehicle} className="w-full h-full p-2" />
          {cheaperBadgeLabel && (
            <span className={`absolute top-2 left-2 z-10 text-[9px] font-bold uppercase tracking-wider
                              px-2 py-1 rounded-full shadow-sm ${cheaperBadgeTone === 'red' ? 'bg-red-50 text-red-600' : 'bg-white text-eco'}`}>
              {cheaperBadgeLabel}
            </span>
          )}
        </div>

        {/* Hero cost */}
        <div className="rounded-xl p-5" style={{ background: c + '0D' }}>
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
            {t.energyCost}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-4xl lg:text-5xl tabular-nums" style={{ color: c }}>
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

        {/* Owner's real billing — reference vehicle only, display only */}
        {vehicle.isReference && vehicle.invoice && (
          <div className="rounded-xl border px-4 py-3 text-xs" style={{ borderColor: c + '30' }}>
            <p className="font-semibold uppercase tracking-wider text-[10px] mb-1.5" style={{ color: c }}>
              {t.yourBilling}
            </p>
            <div className="space-y-0.5 text-gray-500">
              <div className="flex justify-between gap-2">
                <span>{fmtCH(vehicle.invoice.km)} km</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>⚡ {t.electricity} {fmtCH(vehicle.invoice.electricityKwh, 2)} kWh</span>
                <span className="font-mono text-gray-700">CHF {fmtCH(vehicle.invoice.electricityCHF, 2)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>⛽ {t.petrol} {fmtCH(vehicle.invoice.fuelL, 2)} L</span>
                <span className="font-mono text-gray-700">CHF {fmtCH(vehicle.invoice.fuelCHF, 2)}</span>
              </div>
              <div className="flex justify-between gap-2 pt-1 mt-1 border-t font-semibold text-gray-700"
                   style={{ borderColor: c + '30' }}>
                <span>{t.total}</span>
                <span className="font-mono">CHF {fmtCH(vehicle.invoice.totalCHF, 2)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>{t.per100km}</span>
                <span className="font-mono">CHF {fmt2(vehicle.invoice.costPer100kmCHF)}</span>
              </div>
            </div>
          </div>
        )}

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
  /** Stagger delay (ms) for the on-mount reveal animation. */
  revealDelayMs?: number
  /** Short caption under the range badge (e.g. "Reichweite"). */
  rangeLabel: string
}

export function ThumbVehicleCard({ vehicle, result, isSelected, onClick, revealDelayMs = 0, rangeLabel }: ThumbProps) {
  const c = vehicle.brandColor

  return (
    <button
      onClick={onClick}
      style={{
        animation: 'card-reveal 0.4s ease-out both',
        animationDelay: `${revealDelayMs}ms`,
        ...(isSelected ? { borderColor: c, background: c + '08' } : {}),
      }}
      className={`
        w-full text-left rounded-lg border p-3 transition-colors duration-150
        focus:outline-none
        ${isSelected ? '' : 'border-border bg-white hover:border-gray-300'}
      `}
    >
      {/* Logo + range badge (top-right corner) */}
      <div className="flex items-start justify-between gap-1 mb-2 min-h-9">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: c + '15' }}>
          <BrandLogo brand={vehicle.brand} domain={vehicle.brandDomain} size={20} />
        </div>
        {vehicle.rangeKm != null && (
          <RangeBadge km={vehicle.rangeKm} caption={rangeLabel} compact className="-mt-1 -mr-1" />
        )}
      </div>

      {/* Visual — smaller, quieter than the comparison hero above; type pill overlaid */}
      <div className="relative rounded-lg h-16 flex items-center justify-center overflow-hidden mb-2"
           style={{ background: isSelected ? c + '10' : 'var(--color-surface-sunken)' }}>
        <VehicleVisual vehicle={vehicle} className="w-full h-full p-1" />
        <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/90"
              style={{ color: c }}>
          {vehicle.type}
        </span>
      </div>

      {/* Name */}
      <p className="text-sm font-semibold text-navy font-display truncate">{vehicle.brand}</p>
      <p className="text-[11px] text-gray-400 truncate">{vehicle.model}</p>

      {/* Cost */}
      <p className="font-mono font-bold text-sm mt-1.5 tabular-nums"
         style={{ color: isSelected ? c : '#374151' }}>
        CHF {fmt2(result.costPer100kmCHF)}
        <span className="text-[9px] font-normal text-gray-400 ml-0.5">/100km</span>
      </p>
    </button>
  )
}
