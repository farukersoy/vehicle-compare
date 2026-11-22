'use client'

import { SilhouetteShape } from '@/types'

// Each silhouette uses viewBox "0 0 200 90".
// Ground line is at y=82. Wheel centres sit on the ground.
// Body paths are closed polygons — no arches needed; wheels overlap the body.

type ShapeConfig = {
  bodyD: string          // SVG path for the car body (no wheels)
  windowD: string        // simplified window/glass area
  wheel1X: number
  wheel2X: number
  wheelCY: number
  wheelR: number
}

const shapes: Record<SilhouetteShape, ShapeConfig> = {
  suv: {
    // High boxy roofline, short overhangs
    bodyD: `
      M 14,72 L 14,58 Q 16,50 22,44 L 38,38 Q 50,28 64,24
      L 70,20 L 132,20 L 143,24 Q 157,30 163,40
      Q 170,50 172,60 L 172,72 Z
    `,
    windowD: `
      M 66,24 L 72,20 L 128,20 L 140,24 L 148,32
      Q 138,30 78,30 L 72,30 Z
    `,
    wheel1X: 44,
    wheel2X: 148,
    wheelCY: 76,
    wheelR: 15,
  },
  'large-suv': {
    // Taller, wider — longer wheelbase
    bodyD: `
      M 10,74 L 10,56 Q 12,46 20,40 L 38,32 Q 54,22 70,18
      L 76,14 L 136,14 L 150,20 Q 165,28 172,40
      Q 178,52 178,64 L 178,74 Z
    `,
    windowD: `
      M 72,18 L 78,14 L 132,14 L 147,20 L 154,28
      Q 144,26 80,26 L 76,26 Z
    `,
    wheel1X: 46,
    wheel2X: 154,
    wheelCY: 78,
    wheelR: 17,
  },
  sedan: {
    // Classic 3-box: longer hood, low roofline, clear trunk
    bodyD: `
      M 12,72 L 12,64 Q 14,56 22,50 L 46,40 Q 58,30 74,24
      L 80,20 L 130,20 L 142,24 Q 155,30 164,42
      L 174,56 Q 176,64 176,72 Z
    `,
    windowD: `
      M 76,24 L 82,20 L 128,20 L 140,24 L 152,34
      Q 142,32 80,32 L 76,32 Z
    `,
    wheel1X: 50,
    wheel2X: 148,
    wheelCY: 76,
    wheelR: 14,
  },
  hatchback: {
    // 2-box, sloped rear — no distinct trunk
    bodyD: `
      M 14,72 L 14,62 Q 16,54 24,46 L 44,36 Q 56,26 70,22
      L 76,18 L 134,18 Q 150,20 160,34
      L 166,52 Q 168,62 168,72 Z
    `,
    windowD: `
      M 72,22 L 78,18 L 132,18 L 148,20 L 156,32
      Q 146,30 78,30 Z
    `,
    wheel1X: 46,
    wheel2X: 140,
    wheelCY: 76,
    wheelR: 14,
  },
  'city-car': {
    // Short wheelbase, rounded, tall-ish cabin
    bodyD: `
      M 22,72 L 22,60 Q 24,50 34,42 L 54,28 Q 66,20 80,18
      L 118,18 Q 136,20 148,32 L 158,46
      Q 162,58 162,72 Z
    `,
    windowD: `
      M 76,22 L 82,18 L 116,18 L 132,20 L 142,30
      Q 132,28 80,28 L 74,28 Z
    `,
    wheel1X: 50,
    wheel2X: 134,
    wheelCY: 76,
    wheelR: 13,
  },
}

interface Props {
  shape: SilhouetteShape
  bodyColor?: string
  className?: string
}

export default function VehicleSilhouette({
  shape,
  bodyColor = '#0B1F3A',
  className = '',
}: Props) {
  const cfg = shapes[shape]
  const uid = shape // stable — no SSR mismatch risk for static IDs

  return (
    <svg
      viewBox="0 0 200 90"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id={`body-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bodyColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor={bodyColor} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`glass-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#AEDCF5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4BA8DC" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="100" cy="86" rx="88" ry="3" fill="#000" opacity="0.12" />

      {/* Car body */}
      <path d={cfg.bodyD} fill={`url(#body-${uid})`} />

      {/* Windows / glass */}
      <path d={cfg.windowD} fill={`url(#glass-${uid})`} />

      {/* Front wheel */}
      <circle cx={cfg.wheel1X} cy={cfg.wheelCY} r={cfg.wheelR + 3} fill={bodyColor} opacity="0.7" />
      <circle cx={cfg.wheel1X} cy={cfg.wheelCY} r={cfg.wheelR} fill="#1C1C1E" />
      <circle cx={cfg.wheel1X} cy={cfg.wheelCY} r={cfg.wheelR * 0.45} fill="#666" />
      <circle cx={cfg.wheel1X} cy={cfg.wheelCY} r={cfg.wheelR * 0.18} fill="#999" />

      {/* Rear wheel */}
      <circle cx={cfg.wheel2X} cy={cfg.wheelCY} r={cfg.wheelR + 3} fill={bodyColor} opacity="0.7" />
      <circle cx={cfg.wheel2X} cy={cfg.wheelCY} r={cfg.wheelR} fill="#1C1C1E" />
      <circle cx={cfg.wheel2X} cy={cfg.wheelCY} r={cfg.wheelR * 0.45} fill="#666" />
      <circle cx={cfg.wheel2X} cy={cfg.wheelCY} r={cfg.wheelR * 0.18} fill="#999" />

      {/* Headlight glint */}
      <circle cx={cfg.wheel1X - cfg.wheelR - 12} cy={cfg.wheelCY - 14} r="3" fill="#FFF" opacity="0.6" />
    </svg>
  )
}
