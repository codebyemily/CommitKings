import type { NextConfig } from 'next'
import path from 'path'

let supabaseHost: string | undefined
try {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (u) supabaseHost = new URL(u).hostname
} catch {
  supabaseHost = undefined
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: '/onesignal/OneSignalSDK.sw.js',
        destination: 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/logo.svg',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHost,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
