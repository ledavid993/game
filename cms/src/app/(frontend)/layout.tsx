import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Cinzel, IM_Fell_English, Lato } from 'next/font/google'

import '../globals.css'

// Force this layout to be dynamic (no caching)
export const dynamic = 'force-dynamic'
export const revalidate = 0

const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
  weight: ['400', '600', '700'],
})
const fellEnglish = IM_Fell_English({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-fell',
})
const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
  variable: '--font-lato',
})

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
    default: 'Manor of Whispers',
    template: '%s | Manor of Whispers',
  },
  description:
    'Invite your guests into the Manor of Whispers—an immersive murder mystery with theatrical visuals and cross-device gameplay.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Manor of Whispers',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Manor of Whispers',
    description:
      'A real-time murder mystery experience styled as a haunted manor, complete with live updates and cinematic storytelling.',
    url: '/',
    siteName: 'Christmas Murder Mystery Party',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manor of Whispers',
    description:
      'A web-novel inspired murder house game designed for large displays and mobile accomplices.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${fellEnglish.variable} ${lato.variable}`}>
      <body className="font-body bg-[var(--manor-midnight)] text-[var(--manor-candle)] antialiased">
        <main className="flex min-h-screen flex-col">{children}</main>
      </body>
    </html>
  )
}
