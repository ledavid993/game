import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
const metadataBase = (() => {
  try {
    return new URL(baseUrl)
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_BASE_URL for metadataBase:', error)
    return undefined
  }
})()

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'Christmas Murder Mystery Party',
    template: '%s | Christmas Murder Mystery Party',
  },
  description:
    'Host the ultimate holiday murder mystery with responsive TV and mobile experiences, live updates, and festive themes.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Christmas Murder Mystery Party',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Christmas Murder Mystery Party',
    description:
      'Host and play a real-time holiday murder mystery with socket-powered updates, QR joins, and immersive themes.',
    url: '/',
    siteName: 'Christmas Murder Mystery Party',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Christmas Murder Mystery Party',
    description:
      'Real-time Christmas party murder mystery built for TV hosts and mobile players with festive theming.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} bg-[var(--color-background)] text-[var(--color-text)] antialiased`}
        data-theme="christmas"
      >
        <main className="flex min-h-screen flex-col">{children}</main>
      </body>
    </html>
  )
}
