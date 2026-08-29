'use client'

import { useState } from 'react'
import VehicleSilhouette from './VehicleSilhouette'
import { Vehicle } from '@/types'

interface Props {
  vehicle: Vehicle
  className?: string
}

/**
 * Shows a real, Gemini-generated studio photo if `vehicle.image` is set
 * and loads successfully. All photos share the same style: 3/4 front
 * angle, white background, studio lighting (see /public/cars/README.txt
 * for the prompt template used to generate them).
 *
 * Falls back to the SVG silhouette if no image is set yet, or if it
 * fails to load — so adding photos vehicle-by-vehicle never breaks
 * the site.
 */
export default function VehicleVisual({ vehicle, className = '' }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const c = vehicle.brandColor

  if (vehicle.image && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={vehicle.image}
        alt={`${vehicle.brand} ${vehicle.model}`}
        className={`object-contain ${className}`}
        loading="lazy"
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <VehicleSilhouette shape={vehicle.silhouette} bodyColor={c} className={className} />
  )
}
