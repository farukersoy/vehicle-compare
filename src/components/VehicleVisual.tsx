'use client'

import { useState } from 'react'
import VehicleSilhouette from './VehicleSilhouette'
import { Vehicle } from '@/types'

interface Props {
  vehicle: Vehicle
  className?: string
}

/**
 * Shows a real car photo if `vehicle.image` is set AND loads successfully.
 * Otherwise falls back to the SVG silhouette.
 */
export default function VehicleVisual({ vehicle, className = '' }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const c = vehicle.brandColor

  if (vehicle.image && !imgFailed) {
    return (
      <img
        src={vehicle.image}
        alt={`${vehicle.brand} ${vehicle.model}`}
        className={`object-contain ${className}`}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <VehicleSilhouette shape={vehicle.silhouette} bodyColor={c} className={className} />
  )
}
