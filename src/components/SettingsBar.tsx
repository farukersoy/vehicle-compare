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
    <div className="sticky top-0 z-30 bg-navy/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">

        {/* Charge rate */}
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs uppercase tracking-widest">{t.charge}</span>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {(['home', 'public'] as const).map((rate) => (
              <button key={rate} onClick={() => onChange({ chargeRate: rate })}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors
                  ${settings.chargeRate === rate
                    ? 'bg-energy text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                {rate === 'home' ? t.home : t.public}
              </button>
            ))}
          </div>
        </div>

        {/* PHEV scenario */}
        {showPhevToggle && (
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs uppercase tracking-widest">{t.phevBattery}</span>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              {(['full', 'empty'] as const).map((s) => (
                <button key={s} onClick={() => onChange({ phevScenario: s })}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors
                    ${settings.phevScenario === s
                      ? 'bg-energy text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                  {s === 'full' ? t.full : t.empty}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CO2 slider */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-white/50 text-xs uppercase tracking-widest whitespace-nowrap">
            {t.gridCo2}
          </span>
          <input type="range" min={10} max={120} step={5}
            value={settings.co2GridGkwh}
            onChange={(e) => onChange({ co2GridGkwh: Number(e.target.value) })}
            className="w-24 accent-energy" />
          <span className="font-mono text-white text-xs w-16">
            {settings.co2GridGkwh} g/kWh
          </span>
        </div>

        {/* Language switch */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {(['de', 'en'] as const).map((l) => (
            <button key={l} onClick={() => onLangChange(l)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors
                ${lang === l ? 'bg-white text-navy' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
