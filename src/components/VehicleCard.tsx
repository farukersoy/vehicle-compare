'use client'

import VehicleVisual from './VehicleVisual'
import BrandLogo from './BrandLogo'
import { IconBolt, IconFuel, IconHome, IconLeaf } from './Icons'
import { Segmented } from './Controls'
import { Vehicle, CostResult, Settings } from '@/types'
import { fmt2, fmtCO2, fmtCH } from '@/lib/calculations'
import { Translation } from '@/lib/i18n'
import { isAiImage } from '@/lib/photo-credits'

// Shared soft card shadow (ink-tinted, very low opacity)
export const CARD_SHADOW =
  'shadow-[0_1px_2px_rgba(11,31,58,0.04),0_8px_24px_-12px_rgba(11,31,58,0.14)]'

// ─── Small building blocks ────────────────────────────────────────────────────

function BrandDot({ color }: { color: string }) {
  // The only place a brand colour appears: a tiny identifying dot.
  return <span aria-hidden className="inline-block size-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
}

function TypePill({ type, overlay = false }: { type: Vehicle['type']; overlay?: boolean }) {
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold text-ink
                      ${overlay ? 'bg-surface/95 shadow-sm' : 'bg-surface border border-border'}`}>
      {type}
    </span>
  )
}

function RangeBadge({ km, caption, compact = false }: { km: number; caption: string; compact?: boolean }) {
  return (
    <div className={`flex-shrink-0 rounded-xl bg-range text-white text-right
                     shadow-[0_4px_12px_-4px_rgba(15,122,92,0.55)]
                     ${compact ? 'px-2 py-1 max-w-[7.5rem]' : 'px-3 py-2 max-w-[11rem]'}`}>
      <div className={`font-display font-semibold leading-tight tabular-nums whitespace-nowrap
                       ${compact ? 'text-[13px]' : 'text-lg'}`}>
        ≈ {fmtCH(km)} km
      </div>
      <div className={`text-xs leading-snug text-white/95 ${compact ? 'truncate' : ''}`}>{caption}</div>
    </div>
  )
}

// ─── Large card (comparison panel) ────────────────────────────────────────────

interface LargeProps {
  vehicle: Vehicle
  result: CostResult
  t: Translation
  /** Text for the "this one's cheaper" badge; omit to hide it. */
  cheaperBadgeLabel?: string
  /** Green when Opel/reference wins, red when the rival wins. */
  cheaperBadgeTone?: 'green' | 'red'
  /** Eager-load the photo (above the fold). */
  priority?: boolean
  /** Charging control for the compared vehicle (shown for BEV/PHEV only). */
  charge?: {
    rate: Settings['chargeRate']
    onChange: (rate: Settings['chargeRate']) => void
  }
}

export function LargeVehicleCard({
  vehicle, result, t, cheaperBadgeLabel, cheaperBadgeTone = 'green', priority = false, charge,
}: LargeProps) {
  const showChargeToggle = !vehicle.isReference && !!charge && vehicle.type !== 'HEV'

  return (
    <article className={`bg-surface rounded-xl border border-border ${CARD_SHADOW} flex flex-col h-full`}>
      <div className="p-4 sm:p-6 flex flex-col gap-4 flex-1">

        {/* Top row: type pill left, range badge in the top-right corner (normal flow, no overlap).
            Fixed height only from md, where the cards sit side by side and must align. */}
        <div className="flex items-start justify-between gap-3 md:min-h-[5.5rem]">
          <div className="pt-1"><TypePill type={vehicle.type} /></div>
          {vehicle.rangeKm != null && (
            <RangeBadge km={vehicle.rangeKm} caption={vehicle.rangeNote ?? t.range} />
          )}
        </div>

        {/* Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-xl bg-sunken flex items-center justify-center flex-shrink-0">
            <BrandLogo brand={vehicle.brand} domain={vehicle.brandDomain} size={26} />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display font-semibold text-lg leading-tight text-ink">
              <span className="truncate">{vehicle.brand}</span>
              <BrandDot color={vehicle.brandColor} />
            </p>
            <p className="text-sm text-muted leading-snug truncate">{vehicle.model}</p>
          </div>
        </div>

        <p className="text-[13px] leading-snug text-muted min-h-[1.25rem]">
          {vehicle.isReference ? t.yourReference : t.typeLabels[vehicle.type]}
        </p>

        {/* Visual — reserved 16:9 box, so no layout shift */}
        <div className="relative aspect-[16/9] rounded-lg bg-sunken overflow-hidden">
          <VehicleVisual vehicle={vehicle} priority={priority} className="p-3"
                         sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1023px) 45vw, 420px" />
          {cheaperBadgeLabel && (
            <span className={`absolute top-2 left-2 z-10 inline-flex items-center h-7 px-2.5 rounded-full
                              text-xs font-semibold shadow-sm
                              ${cheaperBadgeTone === 'red'
                                ? 'bg-attention-soft text-attention-ink'
                                : 'bg-positive-soft text-positive-ink'}`}>
              {cheaperBadgeLabel}
            </span>
          )}
          {/* AI-generated image: subtle caption bottom-right, clear of the top-left "cheaper" badge
              (type pill and range badge sit above the image box). */}
          {vehicle.image && isAiImage(vehicle.id) && (
            <span className="absolute bottom-1.5 right-2 z-10 px-1.5 rounded bg-surface/80 text-[12px] leading-5 text-muted pointer-events-none">
              {t.illustration}
            </span>
          )}
        </div>

        {/* Cost */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t.energyCost}</p>

          {/* Charging: fixed toggle-height slot so both cards' numbers line up side by side.
              Reference: static (always home). Compared BEV/PHEV: home/public toggle. HEV: no grid power. */}
          {vehicle.isReference ? (
            <p className="mt-2 min-h-[50px] flex items-center gap-1.5 text-sm text-muted">
              <IconHome size={15} /> {t.chargingAlwaysHome}
            </p>
          ) : showChargeToggle ? (
            <div className="mt-2">
              <Segmented label={t.charging} value={charge!.rate} onChange={charge!.onChange}
                options={[
                  { value: 'home', label: t.home, icon: <IconHome size={15} /> },
                  { value: 'public', label: t.public, icon: <IconBolt size={15} /> },
                ]} />
            </div>
          ) : (
            <div aria-hidden className="hidden md:block mt-2 h-[50px]" />
          )}

          <div className="flex items-baseline gap-1.5 mt-3">
            <span className="font-display font-semibold text-[32px] sm:text-4xl leading-none tabular-nums text-ink">
              CHF {fmt2(result.costPer100kmCHF)}
            </span>
            <span className="text-sm text-muted">/100 km</span>
          </div>

          <div className="mt-3 pt-3 border-t border-border space-y-1.5 min-h-[3.5rem]">
            {result.electricKwhUsed > 0 && (
              <div className="flex justify-between gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted">
                  <IconBolt size={14} /> {fmt2(result.electricKwhUsed)} kWh
                </span>
                <span className="font-mono text-ink tabular-nums">CHF {fmt2(result.electricCostPer100km)}</span>
              </div>
            )}
            {result.fuelLUsed > 0 && (
              <div className="flex justify-between gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted">
                  <IconFuel size={14} /> {fmt2(result.fuelLUsed)} L
                </span>
                <span className="font-mono text-ink tabular-nums">CHF {fmt2(result.fuelCostPer100km)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Owner's real billing — reference vehicle only, display only */}
        {vehicle.isReference && vehicle.invoice && (
          <div className="rounded-lg bg-page px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-page mb-2">
              {t.yourBilling} · {fmtCH(vehicle.invoice.km)} km
            </p>
            <dl className="space-y-1">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-page">{t.electricity} {fmtCH(vehicle.invoice.electricityKwh, 2)} kWh</dt>
                <dd className="font-mono text-ink tabular-nums">CHF {fmtCH(vehicle.invoice.electricityCHF, 2)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-page">{t.petrol} {fmtCH(vehicle.invoice.fuelL, 2)} L</dt>
                <dd className="font-mono text-ink tabular-nums">CHF {fmtCH(vehicle.invoice.fuelCHF, 2)}</dd>
              </div>
              <div className="flex justify-between gap-3 pt-1.5 mt-1.5 border-t border-border font-semibold">
                <dt className="text-ink">{t.total}</dt>
                <dd className="font-mono text-ink tabular-nums">CHF {fmtCH(vehicle.invoice.totalCHF, 2)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-page">{t.per100km}</dt>
                <dd className="font-mono text-ink tabular-nums">CHF {fmt2(vehicle.invoice.costPer100kmCHF)}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* CO2 */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted truncate">{vehicle.segment}</span>
          <span className="flex items-center gap-1.5 font-mono text-ink tabular-nums whitespace-nowrap">
            <IconLeaf size={14} className="text-muted" />
            {fmtCO2(result.co2TotalGkm)} g/km CO₂
          </span>
        </div>

        {/* Data quality — pinned to bottom */}
        <p className="flex items-start gap-2 mt-auto text-xs leading-snug text-muted">
          <span aria-hidden className="mt-1 size-2 rounded-full flex-shrink-0"
                style={{ background: vehicle.dataQuality === 'measured' ? '#16A37A' : '#94A3B8' }} />
          <span>
            {vehicle.dataQuality === 'measured' ? t.measured : t.estimated}{' — '}{vehicle.sourceNote}
          </span>
        </p>
      </div>
    </article>
  )
}

// ─── Thumbnail card (grid selector) ───────────────────────────────────────────

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

export function ThumbVehicleCard({
  vehicle, result, isSelected, onClick, revealDelayMs = 0, rangeLabel,
}: ThumbProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      style={{ animation: 'card-reveal 0.35s ease-out both', animationDelay: `${revealDelayMs}ms` }}
      className={`w-full h-full text-left bg-surface rounded-xl border p-3 flex flex-col gap-2
                  transition-[border-color,box-shadow] duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                  ${isSelected
                    ? 'border-accent ring-1 ring-accent shadow-md'
                    : 'border-border hover:border-slate-300 hover:shadow-sm'}`}
    >
      {/* Logo + range badge */}
      <div className="flex items-start justify-between gap-2 min-h-7">
        <div className="size-7 rounded-lg bg-sunken flex items-center justify-center flex-shrink-0">
          <BrandLogo brand={vehicle.brand} domain={vehicle.brandDomain} size={16} />
        </div>
        {vehicle.rangeKm != null && (
          <RangeBadge km={vehicle.rangeKm} caption={rangeLabel} compact />
        )}
      </div>

      {/* Visual — reserved 4:3 box; type pill overlaid */}
      <div className="relative aspect-[4/3] rounded-lg bg-sunken overflow-hidden">
        <VehicleVisual vehicle={vehicle} className="p-1.5"
                       sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 230px" />
        <span className="absolute top-1.5 left-1.5 z-10"><TypePill type={vehicle.type} overlay /></span>
      </div>

      {/* Name */}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[15px] font-semibold text-ink font-display leading-tight">
          <span className="truncate">{vehicle.brand}</span>
          <BrandDot color={vehicle.brandColor} />
        </p>
        <p className="text-xs text-muted truncate mt-0.5">{vehicle.model}</p>
      </div>

      {/* Cost */}
      <p className="mt-auto font-mono font-semibold text-sm tabular-nums text-ink">
        CHF {fmt2(result.costPer100kmCHF)}
        <span className="text-xs font-normal text-muted ml-1">/100 km</span>
      </p>
    </button>
  )
}
