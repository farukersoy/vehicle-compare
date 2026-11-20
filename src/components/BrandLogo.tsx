'use client'

interface Props {
  brand: string
  domain: string
  size?: number
  className?: string
}

export default function BrandLogo({ brand, domain, size = 48, className = '' }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={`${brand} logo`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size, objectFit: 'contain' }}
      className={className}
      onError={(e) => {
        // Fallback: hide image if logo fails to load
        ;(e.target as HTMLImageElement).style.visibility = 'hidden'
      }}
    />
  )
}
