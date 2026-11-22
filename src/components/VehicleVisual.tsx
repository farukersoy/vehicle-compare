'use client'

import { useState } from 'react'
import Image from 'next/image'
import VehicleSilhouette from './VehicleSilhouette'
import { Vehicle } from '@/types'

interface Props {
  vehicle: Vehicle
  /** `sizes` hint so next/image serves a small file for small slots. */
  sizes: string
  /** Eager-load (above-the-fold hero). Everything else is lazy. */
  priority?: boolean
  className?: string
}

/**
 * Real studio photo via next/image (responsive, lazy, WebP/AVIF) when
 * `vehicle.image` is set and loads; otherwise the SVG silhouette.
 *
 * The parent must be `relative` with a fixed aspect ratio, so the image fills
 * a reserved box and nothing shifts while it loads.
 */
export default function VehicleVisual({ vehicle, sizes, priority = false, className = '' }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  if (vehicle.image && !imgFailed) {
    return (
      <Image
        src={vehicle.image}
        alt={`${vehicle.brand} ${vehicle.model}`}
        fill
        sizes={sizes}
        priority={priority}
        quality={70}
        className={`object-contain ${className}`}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      <VehicleSilhouette shape={vehicle.silhouette} bodyColor="#94A3B8" className="w-full h-full" />
    </div>
  )
}
