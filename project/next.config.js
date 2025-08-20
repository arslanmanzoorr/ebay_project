/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  output: 'standalone',
  images: {
    domains: ['localhost', '127.0.0.1'],
    unoptimized: true,
  },
  // Enable static exports for better Docker performance
  trailingSlash: false,
  // Disable server-side features that aren't needed in production
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
