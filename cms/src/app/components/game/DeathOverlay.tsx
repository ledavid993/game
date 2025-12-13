'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DeathOverlayProps {
  isVisible: boolean
  playerName?: string
  onDismiss: () => void
  autoDismissDelay?: number
}

export function DeathOverlay({
  isVisible,
  playerName,
  onDismiss,
  autoDismissDelay = 6000,
}: DeathOverlayProps) {
  const [showContinue, setShowContinue] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setShowContinue(false)
      return
    }

    // Show "continue" prompt after a delay
    const continueTimer = setTimeout(() => {
      setShowContinue(true)
    }, 3000)

    // Auto-dismiss after the full delay
    const dismissTimer = setTimeout(() => {
      onDismiss()
    }, autoDismissDelay)

    return () => {
      clearTimeout(continueTimer)
      clearTimeout(dismissTimer)
    }
  }, [isVisible, autoDismissDelay, onDismiss])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          onClick={onDismiss}
        >
          {/* Background layers */}
          <div className="absolute inset-0 bg-black" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,47,26,0.3),transparent_70%)]"
          />
          <div className="absolute inset-0 opacity-30">
            <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]" />
          </div>

          {/* Blood drip effect at top */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: '15vh' }}
            transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#8b1a1a] via-[#5c1212] to-transparent"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
            {/* Skull icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.8, type: 'spring', bounce: 0.4 }}
              className="text-8xl sm:text-9xl mb-6"
            >
              💀
            </motion.div>

            {/* Main title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="font-manor text-4xl sm:text-5xl md:text-6xl uppercase tracking-[0.3em] text-[#8b2f1a] mb-4"
              style={{ textShadow: '0 0 40px rgba(139,47,26,0.8)' }}
            >
              You Have Fallen
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="font-body text-lg sm:text-xl text-manor-parchment/80 mb-2"
            >
              {playerName ? `${playerName}, your` : 'Your'} story ends here...
            </motion.p>

            {/* Flavor text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.8 }}
              className="font-body text-sm sm:text-base text-manor-parchment/60 italic max-w-sm"
            >
              The shadows have claimed another soul. Your secrets die with you.
            </motion.p>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 2, duration: 0.6 }}
              className="w-48 h-px bg-gradient-to-r from-transparent via-[#8b2f1a] to-transparent my-8"
            />

            {/* Continue prompt */}
            <AnimatePresence>
              {showContinue && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  }}
                  className="font-body text-xs uppercase tracking-[0.4em] text-manor-parchment/50"
                >
                  Tap anywhere to continue as a whisper...
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Vignette effect */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
