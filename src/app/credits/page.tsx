import type { Metadata } from 'next'
import Link from 'next/link'
import { vehicles } from '@/data/vehicles'
import { photoCredits, isAiCredit, type CommonsCredit } from '@/lib/photo-credits'

export const metadata: Metadata = {
  title: 'Bildnachweise · Image credits — EV Compare',
  description: 'Sources and licences of the vehicle photos used on EV Compare.',
}

const byId = new Map(vehicles.map((v) => [v.id, v]))
const nameOf = (id: string) => {
  const v = byId.get(id)
  return v ? `${v.brand} ${v.model}` : id
}

export default function CreditsPage() {
  const rows = photoCredits
    .filter((c): c is CommonsCredit => !isAiCredit(c))
    .map((c) => ({ ...c, name: nameOf(c.vehicleId) }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const aiRows = photoCredits
    .filter(isAiCredit)
    .map((c) => ({ ...c, name: nameOf(c.vehicleId) }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-page">
      <header className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href="/" className="font-display font-bold text-base tracking-tight text-ink">EV COMPARE</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-display font-semibold text-[28px] sm:text-4xl leading-tight text-ink">
          Bildnachweise <span className="text-muted-page font-normal">· Image credits</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-page">
          Fahrzeugfotos von Wikimedia Commons, für diese Seite zugeschnitten, skaliert und auf weissen
          Hintergrund gesetzt. Photos from Wikimedia Commons, cropped, resized and placed on a white
          background for this site.
        </p>

        {rows.length === 0 ? (
          <p className="mt-8 text-[15px] text-muted-page">
            Noch keine Fotos mit Bildnachweis. · No credited photos yet.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {rows.map((c) => (
              <li key={c.vehicleId} className="rounded-xl border border-border bg-surface p-4 text-sm">
                <p className="font-display font-semibold text-[15px] text-ink">
                  {c.name}
                </p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
                  <dt>Autor · Author</dt>
                  <dd className="text-ink break-words">{c.author}</dd>
                  <dt>Lizenz · Licence</dt>
                  <dd>
                    {c.licenseUrl
                      ? <a href={c.licenseUrl} className="text-ink underline underline-offset-2" rel="license noreferrer" target="_blank">{c.licenseName}</a>
                      : <span className="text-ink">{c.licenseName}</span>}
                    {c.modified && <span> · bearbeitet · modified</span>}
                  </dd>
                  <dt>Quelle · Source</dt>
                  <dd className="min-w-0">
                    <a href={c.sourceUrl} className="text-ink underline underline-offset-2 break-all" rel="noreferrer" target="_blank">
                      {c.fileTitle.replace(/^File:/, '')}
                    </a>
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
        )}

        {aiRows.length > 0 && (
          <section className="mt-12" aria-labelledby="ai-heading">
            <h2 id="ai-heading" className="font-display font-semibold text-xl sm:text-2xl leading-tight text-ink">
              KI-generierte Illustrationen <span className="text-muted-page font-normal">· AI-generated illustrations</span>
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-page">
              Für diese Fahrzeuge zeigen wir mit Google Gemini erstellte Illustrationen (Symbolbild), keine
              Fotos. Form, Farbe und Details können vom realen Fahrzeug abweichen. For these vehicles we show
              illustrations created with Google Gemini, not photos. Shape, colour and details may differ from
              the real vehicle.
            </p>
            <ul className="mt-5 rounded-xl border border-border bg-surface divide-y divide-border text-sm">
              {aiRows.map((c) => (
                <li key={c.vehicleId} className="px-4 py-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="font-display font-semibold text-[15px] text-ink">{c.name}</span>
                  <span className="text-muted">{c.author}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10">
          <Link href="/" className="inline-flex items-center min-h-11 px-5 rounded-full border border-border bg-surface text-sm font-semibold text-ink">
            ← EV Compare
          </Link>
        </p>
      </main>
    </div>
  )
}
