'use client'

import { useState } from 'react'
import { Settings } from '@/types'
import { Lang, Translation } from '@/lib/i18n'
import {
  IconBatteryFull, IconBatteryLow, IconBolt, IconChevronDown, IconHome, IconSliders,
} from './Icons'

// ─── Shared controls ──────────────────────────────────────────────────────────

interface SegOption<V extends string> { value: V; label: string; icon?: React.ReactNode }

function Segmented<V extends string>({ value, options, onChange, label }: {
  value: V
  options: SegOption<V>[]
  onChange: (v: V) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-border bg-page p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button key={o.value} type="button" aria-pressed={active} onClick={() => onChange(o.value)}
            className={`min-h-11 px-4 rounded-full inline-flex items-center gap-1.5 text-sm font-semibold
                        transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
                        ${active ? 'bg-accent text-white shadow-sm' : 'text-ink hover:bg-surface'}`}>
            {o.icon}{o.label}
          </button>
        )
      })}
    </div>
  )
}

function Field({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  const Tag = htmlFor ? 'label' : 'div'
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <Tag {...(htmlFor ? { htmlFor } : {})}
           className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</Tag>
      {children}
    </div>
  )
}

// ─── Language switch (lives in the header, always visible) ────────────────────

export function LanguageSwitch({ lang, onLangChange, t }: {
  lang: Lang
  onLangChange: (l: Lang) => void
  t: Translation
}) {
  return (
    <div role="group" aria-label={t.language} className="inline-flex rounded-full border border-border bg-page p-0.5">
      {(['de', 'en'] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => onLangChange(l)}
          className={`min-h-11 min-w-11 px-3 rounded-full text-sm font-semibold transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
                      ${lang === l ? 'bg-accent text-white' : 'text-ink hover:bg-surface'}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

// ─── Settings: compact toggle row on mobile/tablet, inline strip on desktop ──

interface Props {
  settings: Settings
  onChange: (next: Partial<Settings>) => void
  showPhevToggle: boolean
  t: Translation
}

export default function SettingsBar({ settings, onChange, showPhevToggle, t }: Props) {
  const [open, setOpen] = useState(false)

  const summary = [
    settings.chargeRate === 'home' ? t.home : t.public,
    showPhevToggle ? (settings.phevScenario === 'full' ? t.full : t.empty) : null,
    `${settings.co2GridGkwh} g/kWh`,
    `CHF ${settings.fuelPriceCHF}/L`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Compact row (below lg) */}
      <button type="button" aria-expanded={open} aria-controls="settings-panel" onClick={() => setOpen((o) => !o)}
        className="lg:hidden w-full min-h-12 flex items-center gap-3 rounded-xl border border-border bg-surface
                   px-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <IconSliders size={18} className="text-ink flex-shrink-0" />
        <span className="text-sm font-semibold text-ink flex-shrink-0">{t.settings}</span>
        <span className="ml-auto text-xs text-muted truncate min-w-0">{summary}</span>
        <IconChevronDown size={18}
          className={`text-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel — toggled below lg, always visible as a strip from lg */}
      <div id="settings-panel" className={`${open ? 'block' : 'hidden'} lg:block mt-2 lg:mt-0`}>
        <div className="rounded-xl border border-border bg-surface p-4 grid gap-4 sm:grid-cols-2
                        lg:flex lg:flex-wrap lg:items-end lg:gap-x-8 lg:gap-y-4 lg:px-6">
          <Field label={t.charge}>
            <Segmented label={t.charge} value={settings.chargeRate}
              onChange={(v) => onChange({ chargeRate: v })}
              options={[
                { value: 'home', label: t.home, icon: <IconHome size={15} /> },
                { value: 'public', label: t.public, icon: <IconBolt size={15} /> },
              ]} />
          </Field>

          {showPhevToggle && (
            <Field label={t.phevBattery}>
              <Segmented label={t.phevBattery} value={settings.phevScenario}
                onChange={(v) => onChange({ phevScenario: v })}
                options={[
                  { value: 'full', label: t.full, icon: <IconBatteryFull size={15} /> },
                  { value: 'empty', label: t.empty, icon: <IconBatteryLow size={15} /> },
                ]} />
            </Field>
          )}

          <Field label={t.gridCo2} htmlFor="grid-co2">
            <div className="flex items-center gap-3">
              <input id="grid-co2" type="range" min={10} max={120} step={5}
                value={settings.co2GridGkwh}
                onChange={(e) => onChange({ co2GridGkwh: Number(e.target.value) })}
                className="range-input flex-1 min-w-0 lg:w-36 lg:flex-none" />
              <span className="font-mono text-sm text-ink tabular-nums whitespace-nowrap w-20 text-right">
                {settings.co2GridGkwh} g/kWh
              </span>
            </div>
          </Field>

          <Field label={t.fuelPrice} htmlFor="fuel-price">
            <div className="inline-flex items-center min-h-11 rounded-full border border-border bg-surface px-4
                            focus-within:ring-2 focus-within:ring-accent w-fit">
              <span className="text-sm text-muted mr-1.5">CHF</span>
              <input id="fuel-price" type="number" min={0} step={0.001} inputMode="decimal"
                value={settings.fuelPriceCHF}
                onChange={(e) => {
                  if (e.target.value === '') return
                  const v = Number(e.target.value)
                  if (Number.isFinite(v) && v >= 0) onChange({ fuelPriceCHF: v })
                }}
                className="w-20 h-11 font-mono text-base text-ink tabular-nums bg-transparent focus:outline-none" />
              <span className="text-sm text-muted ml-1">/L</span>
            </div>
          </Field>
        </div>
      </div>
    </div>
  )
}
