import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Christmas Murder Mystery Game',
  description: 'A thrilling party game perfect for Christmas gatherings.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
