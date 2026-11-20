'use client'

import { Settings } from '@/types'
import { Lang, Translation } from '@/lib/i18n'

interface Props {
  settings: Settings
  onChange: (next: Partial<Settings>) => void
  showPhevToggle: boolean
  t: Translation
  lang: Lang
  onLangChange: (l: Lang) => void
}

export default function SettingsBar({
  settings, onChange, showPhevToggle, t, lang, onLangChange,
}: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-4 py-4 border-t border-b border-border">

        {/* Charge rate */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">{t.charge}</span>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {(['home', 'public'] as const).map((rate) => (
              <button key={rate} onClick={() => onChange({ chargeRate: rate })}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors
                  ${settings.chargeRate === rate
                    ? 'bg-energy text-white' : 'bg-white text-gray-500 hover:bg-surface-muted'}`}>
                {rate === 'home' ? t.home : t.public}
              </button>
            ))}
          </div>
        </div>

        {/* PHEV scenario */}
        {showPhevToggle && (
          <>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">{t.phevBattery}</span>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['full', 'empty'] as const).map((s) => (
                  <button key={s} onClick={() => onChange({ phevScenario: s })}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors
                      ${settings.phevScenario === s
                        ? 'bg-energy text-white' : 'bg-white text-gray-500 hover:bg-surface-muted'}`}>
                    {s === 'full' ? t.full : t.empty}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Fuel price (applies to all vehicles) */}
        <div className="w-px h-6 bg-border hidden sm:block" />
        <label className="flex items-center gap-2">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">{t.fuelPrice}</span>
          <span className="flex items-center rounded-lg border border-border bg-white px-2 py-1">
            <span className="text-xs text-gray-400 mr-1">CHF</span>
            <input type="number" min={0} step={0.001} inputMode="decimal"
              value={settings.fuelPriceCHF}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isFinite(v) && v >= 0) onChange({ fuelPriceCHF: v })
              }}
              className="w-16 font-mono text-navy text-xs bg-transparent focus:outline-none" />
            <span className="text-xs text-gray-400 ml-1">/L</span>
          </span>
        </label>

        {/* CO2 slider */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
            {t.gridCo2}
          </span>
          <input type="range" min={10} max={120} step={5}
            value={settings.co2GridGkwh}
            onChange={(e) => onChange({ co2GridGkwh: Number(e.target.value) })}
            className="w-24 accent-energy" />
          <span className="font-mono text-navy text-xs w-16">
            {settings.co2GridGkwh} g/kWh
          </span>
        </div>

        {/* Language switch */}
        <div className="flex rounded-lg overflow-hidden border border-border">
          {(['de', 'en'] as const).map((l) => (
            <button key={l} onClick={() => onLangChange(l)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors
                ${lang === l ? 'bg-navy text-white' : 'bg-white text-gray-500 hover:bg-surface-muted'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
