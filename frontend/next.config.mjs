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
    const authUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8001';
    const binUrl = process.env.NEXT_PUBLIC_BIN_SERVICE_URL || 'http://localhost:8002';
    const detectionUrl = process.env.NEXT_PUBLIC_DETECTION_SERVICE_URL || 'http://localhost:8003';
    const reclamationUrl = process.env.NEXT_PUBLIC_RECLAMATION_SERVICE_URL || 'http://localhost:8004';

    return [
      {
        source: '/api/auth/:path*',
        destination: authUrl + '/api/auth/:path*',
      },
      {
        source: '/api/bins/:path*',
        destination: binUrl + '/api/bins/:path*',
      },
      {
        source: '/api/detections/:path*',
        destination: detectionUrl + '/api/detections/:path*',
      },
      {
        source: '/api/reclamations/:path*',
        destination: reclamationUrl + '/api/reclamations/:path*',
      },
    ]
  },
}

export default nextConfig
