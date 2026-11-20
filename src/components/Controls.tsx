'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Segmented control (44px tap targets) ─────────────────────────────────────

export interface SegOption<V extends string> { value: V; label: string; icon?: React.ReactNode }

export function Segmented<V extends string>({ value, options, onChange, label }: {
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

// ─── Decimal input (Swiss format: always a dot) ───────────────────────────────

/** Accepts digits with at most one "." or "," while typing (partial input like "1." is allowed). */
const PARTIAL_DECIMAL = /^\d*[.,]?\d*$/

/** Parses "1.718" or "1,718"; returns null for empty/invalid input. */
export function parseDecimal(text: string): number | null {
  const s = text.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$|^\d+\.$|^\.\d+$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/**
 * Text input for decimal numbers, independent of the browser locale:
 * - accepts "," and "." while typing, always shows a dot
 * - ignores keystrokes that would make the text invalid
 * - commits every valid value live; on blur falls back to the last valid value
 */
export function DecimalInput({ id, value, onCommit, min = 0, max = Infinity, className = '', ...aria }: {
  id?: string
  value: number
  onCommit: (v: number) => void
  min?: number
  max?: number
  className?: string
  'aria-label'?: string
}) {
  const [text, setText] = useState(String(value))
  const focused = useRef(false)

  // Keep in sync with outside changes while the user isn't editing.
  useEffect(() => {
    if (!focused.current) setText(String(value))
  }, [value])

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      value={text}
      onFocus={() => { focused.current = true }}
      onChange={(e) => {
        const raw = e.target.value
        if (!PARTIAL_DECIMAL.test(raw)) return          // ignore invalid keystrokes
        const next = raw.replace(',', '.')              // always display a dot
        setText(next)
        const n = parseDecimal(next)
        if (n !== null && n >= min && n <= max) onCommit(n)
      }}
      onBlur={() => {
        focused.current = false
        const n = parseDecimal(text)
        if (n === null || n < min || n > max) setText(String(value))   // fall back to last valid
        else setText(String(n))                                         // normalise, e.g. "1." → "1"
      }}
      className={className}
      {...aria}
    />
  )
}
