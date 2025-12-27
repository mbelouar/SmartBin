/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  // Allow API calls to backend services
  async rewrites() {
    const rewrites = []
    
    // Only add rewrites if environment variables are set
    if (process.env.NEXT_PUBLIC_AUTH_SERVICE_URL) {
      rewrites.push({
        source: '/api/auth/:path*',
        destination: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL + '/api/auth/:path*',
      })
    }
    
    if (process.env.NEXT_PUBLIC_BIN_SERVICE_URL) {
      rewrites.push({
        source: '/api/bins/:path*',
        destination: process.env.NEXT_PUBLIC_BIN_SERVICE_URL + '/api/bins/:path*',
      })
    }
    
    if (process.env.NEXT_PUBLIC_DETECTION_SERVICE_URL) {
      rewrites.push({
        source: '/api/detections/:path*',
        destination: process.env.NEXT_PUBLIC_DETECTION_SERVICE_URL + '/api/detections/:path*',
      })
    }
    
    if (process.env.NEXT_PUBLIC_RECLAMATION_SERVICE_URL) {
      rewrites.push({
        source: '/api/reclamations/:path*',
        destination: process.env.NEXT_PUBLIC_RECLAMATION_SERVICE_URL + '/api/reclamations/:path*',
      })
    }
    
    return rewrites
  },
}

export default nextConfig
