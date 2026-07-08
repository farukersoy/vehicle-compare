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

  return (
    <div className="min-h-screen" style={{ background: '#0B1F3A' }}>

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-2"
           style={{ color: '#E8772E' }}>
          {t.tagline}
        </p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
          {t.title}
        </h1>
        <p className="text-white/40 mt-2 text-base max-w-lg">{t.subtitle}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-[1fr_148px_1fr] gap-4 items-stretch">

          <LargeVehicleCard vehicle={referenceVehicle} result={referenceResult} t={t} />

          {selectedVehicle && selectedResult ? (
            <ComparisonDelta reference={referenceResult} comparison={selectedResult} t={t} />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center
                            gap-3 text-white/20 min-w-[120px]">
              <div className="text-3xl">↔</div>
              <p className="text-[11px] text-center leading-relaxed text-white/30">
                {t.pickPrompt}
              </p>
            </div>
          )}

          {selectedVehicle && selectedResult ? (
            <LargeVehicleCard vehicle={selectedVehicle} result={selectedResult} t={t} />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-white/10
                            flex flex-col items-center justify-center
                            text-white/20 gap-4 p-6 min-h-[420px]">
              <div className="text-5xl">🚗</div>
              <p className="font-display font-semibold text-white/40 text-lg text-center">
                {t.pickPrompt}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Vehicle selector — right below, big heading */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-display font-bold text-white mb-6">
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
      <div className="border-t border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto text-xs text-white/30 text-center space-y-1">
          <p>{t.footer1}</p>
          <p>{t.footer2}</p>
        </div>
      </div>

    </div>
  )
}
