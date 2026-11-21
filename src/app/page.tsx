'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { vehicles, REFERENCE_VEHICLE_ID } from '@/data/vehicles'
import { calculateCost, DEFAULT_SETTINGS } from '@/lib/calculations'
import { CostResult, Settings } from '@/types'
import { Lang, translations } from '@/lib/i18n'
import { smoothScrollTo } from '@/lib/motion'
import { displayDelta } from '@/lib/display'
import SettingsBar, { LanguageSwitch } from '@/components/SettingsBar'
import { LargeVehicleCard } from '@/components/VehicleCard'
import ComparisonDelta, { formatCostDiff } from '@/components/ComparisonDelta'
import VehicleGrid from '@/components/VehicleGrid'
import { IconArrowUp, IconCar } from '@/components/Icons'

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [lang, setLang] = useState<Lang>('de')   // German by default

  const t = translations[lang]

  const referenceVehicle = vehicles.find((v) => v.id === REFERENCE_VEHICLE_ID)!
  const selectedVehicle  = vehicles.find((v) => v.id === selectedId) ?? null

  const allResults = useMemo(() => {
    const map = new Map<string, CostResult>()
    vehicles.forEach((v) => map.set(v.id, calculateCost(v, settings)))
    return map
  }, [settings])

  const referenceResult = allResults.get(REFERENCE_VEHICLE_ID)!
  const selectedResult  = selectedId ? allResults.get(selectedId) ?? null : null

  // Same rounded comparison as the delta band, so badges and numbers always agree
  const referenceCheaper = selectedResult
    ? displayDelta(referenceResult, selectedResult).costDiff >= 0
    : true

  // ── Scroll to the comparison after a selection ────────────────────────────
  const compareRef = useRef<HTMLElement>(null)
  const pickerRef  = useRef<HTMLElement>(null)
  const scrollPending = useRef(false)

  const handleSelect = useCallback((id: string) => {
    scrollPending.current = true
    setSelectedId(id)
  }, [])

  useEffect(() => {
    if (!scrollPending.current) return
    scrollPending.current = false
    smoothScrollTo(compareRef.current)
  }, [selectedId])

  // ── Mobile summary bar: visible once the comparison is scrolled past ──────
  const [pastCompare, setPastCompare] = useState(false)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = compareRef.current
      setPastCompare(!!el && el.getBoundingClientRect().bottom < 0)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const showSummaryBar = pastCompare && !!selectedVehicle && !!selectedResult
  const costDiff = selectedResult ? displayDelta(referenceResult, selectedResult).costDiff : 0

  return (
    <div className="min-h-screen bg-page">

      {/* Header — wordmark + language (always visible) */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <span className="font-display font-bold text-base tracking-tight text-ink">EV COMPARE</span>
          <LanguageSwitch lang={lang} onLangChange={setLang} t={t} />
        </div>
      </header>

      {/* Intro */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-page">{t.tagline}</p>
        <h1 className="mt-2 font-display font-semibold text-[28px] sm:text-4xl leading-tight text-ink">
          {t.title}
        </h1>
        <p className="mt-2 text-[15px] sm:text-base leading-relaxed text-muted-page max-w-2xl">{t.subtitle}</p>
      </div>

      {/* Settings */}
      <SettingsBar
        settings={settings}
        onChange={(p) => setSettings((s) => ({ ...s, ...p }))}
        t={t}
      />

      {/* Comparison */}
      <section ref={compareRef} aria-label={t.compareHeading}
               className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 scroll-mt-4">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_224px_minmax(0,1fr)] lg:gap-6 items-stretch">

          {/* Reference car — mobile: 1st · tablet: 2nd (under the delta) · desktop: left */}
          <div className="order-1 md:order-2 lg:order-1 min-w-0">
            <LargeVehicleCard
              vehicle={referenceVehicle}
              result={referenceResult}
              t={t}
              priority
              cheaperBadgeLabel={selectedResult && referenceCheaper ? t.opelCheaper : undefined}
              cheaperBadgeTone="green"
            />
          </div>

          {/* Delta — mobile: band between the cards · tablet: full-width band on top · desktop: middle column */}
          {selectedVehicle && selectedResult ? (
            <div className="order-2 md:order-1 md:col-span-2 lg:col-span-1 lg:order-2 min-w-0">
              <ComparisonDelta reference={referenceResult} comparison={selectedResult} t={t} />
            </div>
          ) : (
            <div aria-hidden className="hidden lg:flex lg:order-2 items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-page">vs</span>
            </div>
          )}

          {/* Compared car */}
          <div className="order-3 min-w-0">
            {selectedVehicle && selectedResult ? (
              <div key={selectedVehicle.id} className="animate-card-in h-full">
                <LargeVehicleCard
                  vehicle={selectedVehicle}
                  result={selectedResult}
                  t={t}
                  cheaperBadgeLabel={!referenceCheaper ? t.rivalCheaper : undefined}
                  cheaperBadgeTone="red"
                  charge={{
                    rate: settings.chargeRate,
                    onChange: (rate) => setSettings((s) => ({ ...s, chargeRate: rate })),
                  }}
                />
              </div>
            ) : (
              // The whole placeholder is one tap target that scrolls down to the picker.
              <button type="button" onClick={() => smoothScrollTo(pickerRef.current)}
                className="group w-full h-full min-h-[220px] rounded-xl border-2 border-dashed border-border bg-surface/60
                           flex flex-col items-center justify-center gap-4 p-6 text-center
                           hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <IconCar size={40} className="text-muted" />
                <span className="font-display font-semibold text-lg text-ink max-w-[16rem]">{t.pickPrompt}</span>
                <span className="inline-flex items-center min-h-11 px-6 rounded-full bg-accent text-white text-sm font-semibold
                                 group-hover:bg-ink/90">
                  {t.pickVehicle}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Vehicle picker */}
      <section ref={pickerRef} className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16 scroll-mt-4">
        <h2 className="font-display font-semibold text-xl sm:text-2xl text-ink mb-4">{t.chooseVehicle}</h2>
        <VehicleGrid
          vehicles={vehicles}
          results={allResults}
          selectedId={selectedId}
          onSelect={handleSelect}
          t={t}
        />
      </section>

      {/* Footer */}
      <footer className={`border-t border-border px-4 sm:px-6 py-8 ${showSummaryBar ? 'pb-24 md:pb-8' : ''}`}>
        <div className="max-w-3xl mx-auto text-xs leading-relaxed text-muted-page text-center space-y-1.5">
          <p>{t.footer1}</p>
          <p>{t.footer2}</p>
          <p>{t.footer3}</p>
          <p>{t.footerPhev}</p>
          <p>
            <Link href="/credits" className="underline underline-offset-2 hover:text-ink">{t.imageCredits}</Link>
          </p>
        </div>
      </footer>

      {/* Mobile summary bar */}
      {showSummaryBar && selectedVehicle && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-bar-in">
          <button type="button" onClick={() => smoothScrollTo(compareRef.current)}
            aria-label={t.backToComparison}
            className="w-full min-h-12 flex items-center gap-3 rounded-full bg-accent text-white px-4
                       shadow-[0_8px_24px_-8px_rgba(11,31,58,0.5)]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span className="text-sm truncate min-w-0">
              {referenceVehicle.brand} vs {selectedVehicle.model}
            </span>
            <span className={`ml-auto inline-flex items-center h-7 px-2.5 rounded-full text-sm font-semibold
                              font-mono tabular-nums whitespace-nowrap
                              ${costDiff >= 0 ? 'bg-positive-soft text-positive-ink' : 'bg-attention-soft text-attention-ink'}`}>
              {formatCostDiff(costDiff)}<span className="text-xs font-normal ml-1">/100 km</span>
            </span>
            <IconArrowUp size={18} className="flex-shrink-0" />
          </button>
        </div>
      )}

    </div>
  )
}
