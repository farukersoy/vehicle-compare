'use client'

import { useMemo, useState } from 'react'
import { vehicles, REFERENCE_VEHICLE_ID } from '@/data/vehicles'
import { calculateCost, DEFAULT_SETTINGS } from '@/lib/calculations'
import { Settings } from '@/types'
import { Lang, translations } from '@/lib/i18n'
import SettingsBar from '@/components/SettingsBar'
import { LargeVehicleCard } from '@/components/VehicleCard'
import ComparisonDelta from '@/components/ComparisonDelta'
import VehicleGrid from '@/components/VehicleGrid'

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [lang, setLang] = useState<Lang>('de')   // German by default

  const t = translations[lang]

  const referenceVehicle = vehicles.find((v) => v.id === REFERENCE_VEHICLE_ID)!
  const selectedVehicle  = vehicles.find((v) => v.id === selectedId) ?? null

  const allResults = useMemo(() => {
    const map = new Map()
    vehicles.forEach((v) => map.set(v.id, calculateCost(v, settings)))
    return map
  }, [settings])

  const referenceResult = allResults.get(REFERENCE_VEHICLE_ID)!
  const selectedResult  = selectedId ? allResults.get(selectedId) ?? null : null

  const showPhevToggle =
    referenceVehicle.type === 'PHEV' || selectedVehicle?.type === 'PHEV'

  const referenceCheaper = selectedResult
    ? referenceResult.costPer100kmCHF <= selectedResult.costPer100kmCHF
    : true

  return (
    <div className="min-h-screen bg-white">

      {/* Wordmark bar */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-6 py-4">
          <span className="font-display font-bold text-lg text-navy tracking-tight">
            EV COMPARE
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-2"
           style={{ color: '#E8772E' }}>
          {t.tagline}
        </p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-navy leading-tight">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-2 text-base max-w-lg">{t.subtitle}</p>
      </header>

      {/* Settings + language */}
      <SettingsBar
        settings={settings}
        onChange={(p) => setSettings((s) => ({ ...s, ...p }))}
        showPhevToggle={showPhevToggle}
        t={t}
        lang={lang}
        onLangChange={setLang}
      />

      {/* Comparison cards */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-border bg-surface-sunken p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_148px_1fr] gap-4 items-stretch">

            <LargeVehicleCard
              vehicle={referenceVehicle}
              result={referenceResult}
              t={t}
              cheaperBadgeLabel={selectedResult && referenceCheaper ? t.opelCheaper : undefined}
            />

            {selectedVehicle && selectedResult ? (
              <ComparisonDelta reference={referenceResult} comparison={selectedResult} t={t} />
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center
                              gap-3 text-gray-300 min-w-[120px]">
                <div className="text-3xl">↔</div>
                <p className="text-[11px] text-center leading-relaxed text-gray-400">
                  {t.pickPrompt}
                </p>
              </div>
            )}

            {selectedVehicle && selectedResult ? (
              <LargeVehicleCard
                vehicle={selectedVehicle}
                result={selectedResult}
                t={t}
                cheaperBadgeLabel={!referenceCheaper ? t.rivalCheaper : undefined}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200
                              flex flex-col items-center justify-center
                              text-gray-300 gap-4 p-6 min-h-[420px]">
                <div className="text-5xl">🚗</div>
                <p className="font-display font-semibold text-gray-400 text-lg text-center">
                  {t.pickPrompt}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Vehicle selector — right below, big heading */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-display font-bold text-navy mb-6">
          {t.chooseVehicle}
        </h2>
        <VehicleGrid
          vehicles={vehicles}
          results={allResults}
          selectedId={selectedId}
          onSelect={setSelectedId}
          t={t}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-8">
        <div className="max-w-6xl mx-auto text-xs text-gray-400 text-center space-y-1">
          <p>{t.footer1}</p>
          <p>{t.footer2}</p>
        </div>
      </div>

    </div>
  )
}
