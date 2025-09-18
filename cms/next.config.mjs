import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Ignore node_modules for client-side bundles
    webpackConfig.externals = webpackConfig.externals || []
    if (Array.isArray(webpackConfig.externals)) {
      webpackConfig.externals.push('socket.io')
    }

    return webpackConfig
  },
  // External packages for server components
  serverExternalPackages: ['socket.io'],
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
