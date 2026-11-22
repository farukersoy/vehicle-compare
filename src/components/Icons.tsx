// One icon style: 24px grid, 1.75 stroke, round caps, currentColor.

import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

export const IconHome = (p: IconProps) => (
  <Base {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></Base>
)
export const IconBolt = (p: IconProps) => (
  <Base {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></Base>
)
export const IconFuel = (p: IconProps) => (
  <Base {...p}><path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" /><path d="M3 21h12" /><path d="M4 10h10" />
    <path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3" /></Base>
)
export const IconSliders = (p: IconProps) => (
  <Base {...p}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></Base>
)
export const IconSearch = (p: IconProps) => (
  <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Base>
)
export const IconChevronDown = (p: IconProps) => (
  <Base {...p}><path d="m6 9 6 6 6-6" /></Base>
)
export const IconArrowUp = (p: IconProps) => (
  <Base {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Base>
)
export const IconCar = (p: IconProps) => (
  <Base {...p}><path d="M5 16h14M3 16v-3l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v3" />
    <circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" /></Base>
)
export const IconLeaf = (p: IconProps) => (
  <Base {...p}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19 13 11" /></Base>
)
export const IconCheck = (p: IconProps) => (
  <Base {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Base>
)
export const IconInfo = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.6v.2" /></Base>
)
