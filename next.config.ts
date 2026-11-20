import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Car photos are rendered at quality 70 (see VehicleVisual); Next 16 requires
    // every quality value used to be allow-listed here.
    qualities: [70, 75],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.imagin.studio',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com', // brand favicons
      },
    ],
  },
}

export default nextConfig