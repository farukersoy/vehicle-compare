import type { Metadata } from 'next'
import Link from 'next/link'
import { vehicles, REFERENCE_VEHICLE_ID } from '@/data/vehicles'
import { DEFAULT_SETTINGS, fmtCH } from '@/lib/calculations'

export const metadata: Metadata = {
  title: 'So haben wir gerechnet · How we calculated — EV Compare',
  description: 'Price basis, data sources and assumptions behind the EV Compare figures.',
}

// Figures shown on this page come from the same constants the calculator uses.
const ref = vehicles.find((v) => v.id === REFERENCE_VEHICLE_ID)!
const km = fmtCH(ref.invoice?.km ?? 0)
const home = DEFAULT_SETTINGS.homePriceCHF.toFixed(3)
const pub = DEFAULT_SETTINGS.publicPriceCHF.toFixed(2)
const fuel = DEFAULT_SETTINGS.fuelPriceCHF.toFixed(3)
const grid = DEFAULT_SETTINGS.co2GridGkwh
const range = fmtCH(ref.rangeKm ?? 0)

interface Section { h: string; p: string[] }

const DE: Section[] = [
  { h: 'Referenzfahrzeug', p: [
    `Ein Opel Grandland X Hybrid4 (2020). Der Halter hat ${km} km gemessen.`,
    'Grundlage sind die tatsächlichen Strom- und Benzinrechnungen.',
    `Seine Durchschnittspreise: CHF ${home}/kWh Strom und CHF ${fuel}/L Benzin.`,
  ] },
  { h: 'Eine Preisbasis für alle', p: [
    `Strom zu Hause CHF ${home}/kWh. Öffentlich CHF ${pub}/kWh (TCS-Median für DC-Schnellladen). Benzin CHF ${fuel}/L.`,
    'Alle Werte gelten für alle Fahrzeuge. Sie lassen sich in den Einstellungen ändern.',
    `CO₂: Benzin 2.78 kg pro Liter, Strom ${grid} g pro kWh (Netz-Mix, einstellbar).`,
  ] },
  { h: 'Laden: Startwert', p: [
    `Wählen Sie ein Elektroauto, startet es mit dem öffentlichen Schnellladepreis (CHF ${pub}/kWh).`,
    'Ein Tipp auf den Schalter zeigt Laden zu Hause, nur für dieses Fahrzeug.',
    'Wählen Sie ein anderes Fahrzeug, gilt wieder sein Startwert.',
    'Plug-in-Hybride starten mit Laden zu Hause.',
    'Das Referenzfahrzeug wird immer mit Laden zu Hause gerechnet.',
  ] },
  { h: 'Woher die Vergleichswerte stammen', p: [
    'Die Werte der Vergleichsfahrzeuge stammen aus einer KI-gestützten Abfrage mit Google Gemini.',
    'Es sind keine unabhängigen Tests.',
    '«Gemessen» heisst: so aus dieser Abfrage übernommen. «Geschätzt» heisst: angenähert.',
  ] },
  { h: 'Plug-in-Hybride', p: [
    'PHEV-Werte gelten für regelmässig geladene Fahrzeuge.',
  ] },
  { h: 'Die grüne Reichweite', p: [
    'Bei Elektroautos: Reichweite mit voller Batterie.',
    `Beim Referenzfahrzeug: eine gemessene Fahrt von rund ${range} km, mit einer Ladung zu Hause und ohne Zwischenstopp.`,
  ] },
  { h: 'Fotos', p: [
    'Echte Fotos von Wikimedia Commons oder KI-generierte Illustrationen (Symbolbild).',
    'Details stehen bei den Bildnachweisen.',
  ] },
  { h: 'Marken und Logos', p: [
    'Marken und Logos gehören den jeweiligen Inhabern und dienen nur der Kennzeichnung.',
    'Die Logoformen stammen aus der Bibliothek Simple Icons (CC0). Fehlt ein Logo, zeigen wir die Initialen der Marke.',
  ] },
  { h: 'Keine Kaufberatung', p: [
    'Diese Seite ist keine Kaufberatung.',
    'Der reale Verbrauch hängt von Fahrweise, Jahreszeit und Strecke ab.',
  ] },
]

const EN: Section[] = [
  { h: 'Reference car', p: [
    `An Opel Grandland X Hybrid4 (2020). The owner measured ${km} km.`,
    'The basis is the actual electricity and petrol bills.',
    `The owner's average prices: CHF ${home}/kWh electricity and CHF ${fuel}/L petrol.`,
  ] },
  { h: 'One price basis for all', p: [
    `Home charging CHF ${home}/kWh. Public CHF ${pub}/kWh (TCS median for DC fast charging). Petrol CHF ${fuel}/L.`,
    'These values apply to every vehicle. You can change them in the settings.',
    `CO₂: petrol 2.78 kg per litre, electricity ${grid} g per kWh (grid mix, adjustable).`,
  ] },
  { h: 'Charging: starting value', p: [
    `When you select an electric car, it starts with the public fast-charging price (CHF ${pub}/kWh).`,
    'Tapping the toggle shows home charging, for that vehicle only.',
    'Selecting another vehicle resets it to that vehicle\'s starting value.',
    'Plug-in hybrids start with home charging.',
    'The reference car is always calculated with home charging.',
  ] },
  { h: 'Where the comparison values come from', p: [
    'The values of the compared vehicles come from an AI-assisted query with Google Gemini.',
    'They are not independent tests.',
    '"Measured" means: taken from that query as stated. "Estimated" means: an approximation.',
  ] },
  { h: 'Plug-in hybrids', p: [
    'PHEV values assume regularly charged vehicles.',
  ] },
  { h: 'The green range badge', p: [
    'For electric cars: range with a full battery.',
    `For the reference car: one measured trip of about ${range} km, with one charge at home and no stop.`,
  ] },
  { h: 'Photos', p: [
    'Real photos from Wikimedia Commons or AI-generated illustrations (Symbolbild).',
    'See the image credits for details.',
  ] },
  { h: 'Brands and logos', p: [
    'Brand names and logos belong to their respective owners and are used for identification only.',
    'The logo shapes come from the Simple Icons library (CC0). Where no logo exists, we show the brand\'s initials.',
  ] },
  { h: 'Not purchase advice', p: [
    'This site is not purchase advice.',
    'Real consumption depends on driving style, season and route.',
  ] },
]

function Block({ lang, title, sections, asOf, creditsLabel }: {
  lang: 'de' | 'en'; title: string; sections: Section[]; asOf: string; creditsLabel: string
}) {
  return (
    <section lang={lang} aria-labelledby={`h-${lang}`} className="mt-8">
      <h2 id={`h-${lang}`} className="font-display font-semibold text-xl sm:text-2xl leading-tight text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {sections.map((s) => (
          <div key={s.h} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="font-display font-semibold text-[15px] text-ink">{s.h}</h3>
            <div className="mt-1.5 space-y-1 text-sm leading-relaxed text-muted">
              {s.p.map((line) => <p key={line}>{line}</p>)}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-page">
        {asOf} · <Link href="/credits" className="text-ink underline underline-offset-2">{creditsLabel}</Link>
      </p>
    </section>
  )
}

export default function MethodikPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href="/" className="font-display font-bold text-base tracking-tight text-ink">EV COMPARE</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-display font-semibold text-[28px] sm:text-4xl leading-tight text-ink">
          So haben wir gerechnet <span className="text-muted-page font-normal">· How we calculated</span>
        </h1>
        <p className="mt-3 text-sm text-muted-page">
          <a href="#h-de" className="underline underline-offset-2">Deutsch</a>
          {' · '}
          <a href="#h-en" className="underline underline-offset-2">English</a>
        </p>

        <Block lang="de" title="Deutsch" sections={DE} asOf="Datenstand: November 2026" creditsLabel="Bildnachweise" />
        <Block lang="en" title="English" sections={EN} asOf="Data as of: November 2026" creditsLabel="Image credits" />

        <p className="mt-10">
          <Link href="/" className="inline-flex items-center min-h-11 px-5 rounded-full border border-border bg-surface text-sm font-semibold text-ink">
            ← EV Compare
          </Link>
        </p>
      </main>
    </div>
  )
}
