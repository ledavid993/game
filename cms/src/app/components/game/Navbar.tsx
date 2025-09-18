'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/game/host', label: 'Host', icon: '📺' },
  { href: '/game/status', label: 'Status', icon: '📊' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-manor-wine/20">
      <div className="px-4 sm:px-6">
        <div className="flex h-12 sm:h-14 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">🏚️</span>
            <span className="font-manor text-[clamp(0.875rem,2vw,1.125rem)] uppercase tracking-wider text-manor-candle hidden sm:block">
              Manor
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-2 rounded-lg text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium transition-all duration-200
                  flex items-center gap-2
                  ${isActive(item.href)
                    ? 'bg-manor-wine/30 text-manor-candle border border-manor-wine/40'
                    : 'text-manor-parchment/80 hover:text-manor-candle hover:bg-manor-wine/20'
                  }
                `}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-manor-parchment/80 hover:text-manor-candle hover:bg-manor-wine/20 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center items-center">
              <span className={`bg-current transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${
                isOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'
              }`} />
              <span className={`bg-current transition-all duration-300 ease-out h-0.5 w-5 rounded-sm my-0.5 ${
                isOpen ? 'opacity-0' : 'opacity-100'
              }`} />
              <span className={`bg-current transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${
                isOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'
              }`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-manor-wine/20 bg-black/90"
          >
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    flex items-center gap-3
                    ${isActive(item.href)
                      ? 'bg-manor-wine/30 text-manor-candle border border-manor-wine/40'
                      : 'text-manor-parchment/80 hover:text-manor-candle hover:bg-manor-wine/20'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}