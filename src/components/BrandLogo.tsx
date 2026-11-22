import { BRAND_LOGO_PATHS } from '@/data/brand-logos'

interface Props {
  brand: string
  /** Square size in px (28 in panel headers, 20 in picker rows). */
  size?: number
  /** Sets the logo colour through currentColor, e.g. "text-ink" or "text-muted". */
  className?: string
}

/** "Land Rover" → "LR", "Opel" → "O", "Alfa Romeo" → "AR". */
function initials(brand: string): string {
  const words = brand.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? words.slice(0, 2).map((w) => w[0]) : [words[0]?.[0] ?? '?']).join('').toUpperCase()
}

/**
 * Self-hosted, monochrome brand mark: the Simple Icons path in currentColor
 * when the library has one, otherwise a neutral monogram. Never an external
 * request, never blank.
 */
export default function BrandLogo({ brand, size = 28, className = '' }: Props) {
  const path = BRAND_LOGO_PATHS[brand]
  if (path) {
    return (
      <svg role="img" aria-label={brand} viewBox="0 0 24 24" width={size} height={size} fill="currentColor"
           className={`flex-shrink-0 ${className}`}>
        <path d={path} />
      </svg>
    )
  }
  const letters = initials(brand)
  return (
    <span role="img" aria-label={brand}
      className="inline-flex flex-shrink-0 items-center justify-center rounded-md bg-monogram text-ink font-bold leading-none select-none"
      style={{ width: size, height: size, fontSize: Math.round(size * (letters.length > 1 ? 0.4 : 0.5)) }}>
      <span aria-hidden="true">{letters}</span>
    </span>
  )
}
