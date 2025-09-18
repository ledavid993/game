import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable all caching and static generation
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },

  // Force all pages to be dynamic
  typescript: {
    ignoreBuildErrors: false,
  },

  // Disable static optimization
  generateBuildId: async () => {
    return Date.now().toString()
  },

  // Headers to disable all caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
          {
            key: 'X-Accel-Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)