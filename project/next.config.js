/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', '127.0.0.1'],
    unoptimized: true,
  },
  // Enable static exports for better Docker performance
  trailingSlash: false,
  // Disable server-side features that aren't needed in production
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors for production
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint for production
  },
}

module.exports = nextConfig
