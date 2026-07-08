export type VehicleType = 'BEV' | 'PHEV' | 'HEV'

export type SilhouetteShape =
  | 'suv'
  | 'large-suv'
  | 'sedan'
  | 'hatchback'
  | 'city-car'

export type DataQuality = 'measured' | 'estimated'

export interface Vehicle {
  id: string
  model: string
  brand: string
  brandDomain: string   // for logo: google.com/s2/favicons?domain=...
  brandColor: string    // hex brand color
  image?: string        // optional real photo path, e.g. '/cars/opel-grandland.jpg'
  type: VehicleType
  segment: string
  silhouette: SilhouetteShape
  electricKwh100km: number
  fuelL100km: number
  fuelL100kmEmpty?: number
  co2DirectGkm: number
  dataQuality: DataQuality
  sourceNote: string
  isReference?: boolean
}

export interface Settings {
  chargeRate: 'home' | 'public'
  phevScenario: 'full' | 'empty'
  co2GridGkwh: number
  homePriceCHF: number
  publicPriceCHF: number
  fuelPriceCHF: number
}

export interface CostResult {
  costPer100kmCHF: number
  electricCostPer100km: number
  fuelCostPer100km: number
  co2TotalGkm: number
  electricKwhUsed: number
  fuelLUsed: number
}
