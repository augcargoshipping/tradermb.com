/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [],
    unoptimized: true,
  },
  // Static export for Namecheap hosting
  output: 'export',
  trailingSlash: true,
  // Disable server-side features for static export
  distDir: 'out',
  // Environment variables configuration
  env: {
    // These will be available at build time
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // For client-side access, use NEXT_PUBLIC_ prefix
  publicRuntimeConfig: {
    // These will be available on both server and client
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  },
  serverRuntimeConfig: {
    // These will only be available on the server
    airtableBaseId: process.env.AIRTABLE_BASE_ID,
    airtableToken: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  },
}

export default nextConfig
