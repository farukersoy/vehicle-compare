'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { vehicles, REFERENCE_VEHICLE_ID } from '@/data/vehicles'
import { calculateCost, DEFAULT_SETTINGS } from '@/lib/calculations'
import { CostResult, Settings, Vehicle } from '@/types'
import { Lang, translations } from '@/lib/i18n'
import { smoothScrollTo } from '@/lib/motion'
import { shownDiff } from '@/lib/display'
import { fmt2 } from '@/lib/calculations'
import SettingsBar, { LanguageSwitch } from '@/components/SettingsBar'
import ComparePanel from '@/components/ComparePanel'
import VehiclePicker from '@/components/VehiclePicker'
import { IconArrowUp } from '@/components/Icons'

/** Number of vehicles the reference car is compared against (shown in the subtitle). */
const COMPARED_COUNT = vehicles.filter((v) => !v.isReference).length

/**
 * Charging rate a compared vehicle starts with: battery-electric cars on the
 * public fast-charging price, plug-in hybrids at home. HEVs never use grid power.
 * Applied on every selection; a tap on the toggle is not remembered.
 */
const defaultChargeRate = (v: Vehicle): Settings['chargeRate'] => (v.type === 'BEV' ? 'public' : 'home')

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

  // Picker thumbnails: every vehicle at ITS OWN default charging rate, so the
  // grid prices stay stable while cars are selected or the toggle is tapped.
  const { co2GridGkwh, homePriceCHF, publicPriceCHF, fuelPriceCHF } = settings
  const gridResults = useMemo(() => {
    const base = { co2GridGkwh, homePriceCHF, publicPriceCHF, fuelPriceCHF }
    const map = new Map<string, CostResult>()
    vehicles.forEach((v) => map.set(v.id, calculateCost(v, { ...base, chargeRate: defaultChargeRate(v) })))
    return map
  }, [co2GridGkwh, homePriceCHF, publicPriceCHF, fuelPriceCHF])

  const referenceResult = allResults.get(REFERENCE_VEHICLE_ID)!
  const selectedResult  = selectedId ? allResults.get(selectedId) ?? null : null

  // ── Scroll to the comparison after a selection ────────────────────────────
  const compareRef = useRef<HTMLElement>(null)
  const pickerRef  = useRef<HTMLElement>(null)
  const scrollPending = useRef(false)

  const handleSelect = useCallback((id: string) => {
    scrollPending.current = true
    const v = vehicles.find((x) => x.id === id)
    if (v) setSettings((s) => ({ ...s, chargeRate: defaultChargeRate(v) }))
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
  const costDiff = selectedResult ? shownDiff(referenceResult, selectedResult).cost : 0

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
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t.tagline}</p>
        <h1 className="mt-2 font-display font-semibold text-[22px] sm:text-[26px] leading-tight text-ink">
          {t.title}
        </h1>
        <p className="mt-2 text-[15px] sm:text-base leading-relaxed text-muted max-w-2xl">
          {t.subtitle.replace('{n}', String(COMPARED_COUNT))}
        </p>
      </div>

      {/* Compare panel */}
      <section ref={compareRef} aria-label={t.compareHeading}
               className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-4">
        <ComparePanel
          reference={referenceVehicle}
          referenceResult={referenceResult}
          selected={selectedVehicle}
          selectedResult={selectedResult}
          settings={settings}
          onRateChange={(rate) => setSettings((s) => ({ ...s, chargeRate: rate }))}
          onPickVehicle={() => smoothScrollTo(pickerRef.current)}
          t={t}
        />
      </section>

      {/* Settings */}
      <div className="pt-6">
        <SettingsBar
          settings={settings}
          onChange={(p) => setSettings((s) => ({ ...s, ...p }))}
          t={t}
        />
      </div>

      {/* Vehicle picker */}
      <section ref={pickerRef} className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16 scroll-mt-4">
        <h2 className="font-display font-semibold text-lg sm:text-xl text-ink mb-4">{t.chooseVehicle}</h2>
        <VehiclePicker
          vehicles={vehicles}
          results={gridResults}
          referenceResult={referenceResult}
          selectedId={selectedId}
          onSelect={handleSelect}
          t={t}
        />
      </section>

      {/* Footer */}
      <footer className={`border-t border-border px-4 sm:px-6 py-8 ${showSummaryBar ? 'pb-24' : ''}`}>
        <div className="max-w-3xl mx-auto text-xs leading-relaxed text-muted text-center space-y-2">
          <p>{t.footerSources}</p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/methodik" className="underline underline-offset-2 hover:text-ink">{t.methodology}</Link>
            <Link href="/credits" className="underline underline-offset-2 hover:text-ink">{t.imageCredits}</Link>
            <span>{t.dataAsOf}</span>
          </p>
          <p>{t.notAdvice}</p>
        </div>
      </footer>

      {/* Sticky bar: both names and the key difference, once the panel is out of view */}
      {showSummaryBar && selectedVehicle && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-bar-in">
          <button type="button" onClick={() => smoothScrollTo(compareRef.current)}
            aria-label={t.backToComparison}
            className="mx-auto max-w-xl w-full min-h-12 flex items-center gap-3 rounded-xl bg-accent text-white px-4
                       shadow-[0_8px_24px_-8px_rgba(11,31,58,0.5)]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-accent">
            <span className="text-sm truncate min-w-0">
              {referenceVehicle.brand} {referenceVehicle.model} · {selectedVehicle.brand} {selectedVehicle.model}
            </span>
            <span className={`ml-auto inline-flex items-center h-7 px-2.5 rounded-lg text-sm font-semibold tabular-nums whitespace-nowrap
                              ${costDiff >= 0 ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'}`}>
              {costDiff === 0 ? t.diffSame : (costDiff > 0 ? t.diffMore : t.diffLess).replace('{d}', `CHF ${fmt2(Math.abs(costDiff))}`)}
            </span>
            <IconArrowUp size={18} className="flex-shrink-0" />
          </button>
        </div>
      )}

    </div>
  )
}
