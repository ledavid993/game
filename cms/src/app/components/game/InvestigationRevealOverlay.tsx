'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isMurdererRole } from '@/app/lib/game/roles'

interface InvestigationRevealOverlayProps {
  isVisible: boolean
  targetName: string
  targetRole: string
  onDismiss: () => void
}

export function InvestigationRevealOverlay({
  isVisible,
  targetName,
  targetRole,
  onDismiss,
}: InvestigationRevealOverlayProps) {
  const [phase, setPhase] = useState<'sealed' | 'breaking' | 'opening' | 'revealed'>('sealed')

  const isMurderer = isMurdererRole(targetRole)
  const verdictLabel = isMurderer ? 'Naughty' : 'Nice'

  useEffect(() => {
    if (!isVisible) {
      setPhase('sealed')
      return
    }

    // Animation sequence
    const timers: NodeJS.Timeout[] = []

    timers.push(setTimeout(() => setPhase('breaking'), 800))
    timers.push(setTimeout(() => setPhase('opening'), 1600))
    timers.push(setTimeout(() => setPhase('revealed'), 2400))

    // Auto-dismiss after full reveal
    timers.push(setTimeout(() => onDismiss(), 8000))

    return () => timers.forEach(clearTimeout)
  }, [isVisible, onDismiss])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          onClick={phase === 'revealed' ? onDismiss : undefined}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-black/95" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_60%)]"
          />

          {/* Content - Centered Envelope */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Envelope Container */}
            <div className="relative w-80 h-52 perspective-1000">
              {/* Envelope Back */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 rounded-lg shadow-2xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Paper texture */}
                <div className="absolute inset-0 opacity-20 rounded-lg bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                {/* Envelope flap (top triangle) */}
                <motion.div
                  className="absolute -top-0 left-0 right-0 h-28 origin-bottom"
                  initial={{ rotateX: 0 }}
                  animate={{
                    rotateX: phase === 'opening' || phase === 'revealed' ? 180 : 0,
                  }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Flap front */}
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-amber-700 to-amber-800"
                    style={{
                      clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                      backfaceVisibility: 'hidden'
                    }}
                  />
                  {/* Flap back */}
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-amber-900 to-amber-950"
                    style={{
                      clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                      transform: 'rotateX(180deg)',
                      backfaceVisibility: 'hidden'
                    }}
                  />
                </motion.div>

                {/* Wax Seal */}
                <AnimatePresence>
                  {(phase === 'sealed' || phase === 'breaking') && (
                    <motion.div
                      className="absolute top-14 left-1/2 -translate-x-1/2 z-20"
                      initial={{ scale: 1 }}
                      animate={{
                        scale: phase === 'breaking' ? [1, 1.2, 0] : 1,
                        rotate: phase === 'breaking' ? [0, 10, -10, 0] : 0,
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-700 via-red-800 to-red-900 shadow-lg flex items-center justify-center border-2 border-red-950">
                        <span className="text-2xl">🔍</span>
                      </div>
                      {/* Seal crack effect */}
                      {phase === 'breaking' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 1] }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-16 h-16 rounded-full border-4 border-yellow-400/60 animate-ping" />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Letter inside envelope */}
                <motion.div
                  className="absolute top-4 left-4 right-4 bottom-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded shadow-inner flex flex-col items-center justify-center p-4"
                  initial={{ y: 0 }}
                  animate={{
                    y: phase === 'revealed' ? -60 : 0,
                  }}
                  transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                >
                  {/* Letter content */}
                  <AnimatePresence>
                    {phase === 'revealed' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-center"
                      >
                        <p className="text-amber-900/60 text-xs uppercase tracking-widest mb-1">
                          {targetName} is...
                        </p>
                        <motion.p
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4, duration: 0.5, type: 'spring', bounce: 0.4 }}
                          className={`font-manor text-4xl uppercase tracking-wider ${
                            isMurderer ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {isMurderer ? '😈' : '😇'} {verdictLabel}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Sparkle effects during reveal */}
              {phase === 'revealed' && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full ${isMurderer ? 'bg-red-400' : 'bg-emerald-400'}`}
                      initial={{
                        opacity: 0,
                        scale: 0,
                        x: 160,
                        y: 104,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        x: 160 + Math.cos(i * Math.PI / 4) * 140,
                        y: 104 + Math.sin(i * Math.PI / 4) * 100,
                      }}
                      transition={{
                        delay: 0.1 * i,
                        duration: 1,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Tap to close hint */}
            <AnimatePresence>
              {phase === 'revealed' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-white/50"
                >
                  Tap anywhere to close
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
