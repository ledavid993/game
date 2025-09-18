'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { useSocket } from './useSocket'
import type { SerializedGameState } from '@/app/lib/game/types'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

interface GameStatusDisplayProps {
  initialGameState: SerializedGameState
}

export default function GameStatusDisplay({ initialGameState }: GameStatusDisplayProps) {
  const { gameState } = useSocket()
  const [currentState, setCurrentState] = useState<SerializedGameState>(initialGameState)

  useEffect(() => {
    if (gameState) {
      setCurrentState(gameState)
    }
  }, [gameState])

  const activeState = currentState
  const { stats, players, settings } = activeState


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'completed': return 'text-red-500'
      case 'lobby': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '🎭 Game in Progress'
      case 'completed': return '💀 Game Completed'
      case 'lobby': return '⏳ Waiting to Start'
      default: return '❓ Unknown Status'
    }
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(177,54,30,0.2),_transparent_55%),linear-gradient(140deg,_rgba(9,11,16,0.96)_0%,_rgba(17,22,34,0.92)_55%,_rgba(4,5,9,0.98)_100%)]">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <motion.div
          className="flex flex-col items-center text-center space-y-4 sm:space-y-6 md:space-y-8"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.h1
            className="font-manor text-[clamp(2rem,6vw,4rem)] uppercase tracking-[0.3em] text-manor-candle"
            variants={fadeUp}
            transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
          >
            Manor Status
          </motion.h1>

          <motion.div
            className={`font-gothic text-[clamp(1.125rem,3vw,1.5rem)] ${getStatusColor(activeState.isActive ? 'active' : 'lobby')}`}
            variants={fadeUp}
            transition={{ delay: 0.25, duration: 0.8, ease: 'easeOut' }}
          >
            {getStatusText(activeState.isActive ? 'active' : 'lobby')}
          </motion.div>

          {/* Game Statistics */}
          <motion.div
            className="grid w-full grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
            variants={fadeUp}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          >
            <div className="manor-card text-center py-3 sm:py-4">
              <div className="text-[clamp(1.5rem,4vw,2rem)] text-green-500 font-bold">{stats.alivePlayers}</div>
              <div className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-manor-parchment/80 uppercase tracking-wider">Alive</div>
            </div>
            <div className="manor-card text-center py-3 sm:py-4">
              <div className="text-[clamp(1.5rem,4vw,2rem)] text-red-500 font-bold">{stats.deadPlayers}</div>
              <div className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-manor-parchment/80 uppercase tracking-wider">Dead</div>
            </div>
            <div className="manor-card text-center py-3 sm:py-4">
              <div className="text-[clamp(1.5rem,4vw,2rem)] text-yellow-500 font-bold">{stats.murderers}</div>
              <div className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-manor-parchment/80 uppercase tracking-wider">Murderers</div>
            </div>
            <div className="manor-card text-center py-3 sm:py-4">
              <div className="text-[clamp(1.5rem,4vw,2rem)] text-blue-500 font-bold">{stats.civilians}</div>
              <div className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-manor-parchment/80 uppercase tracking-wider">Civilians</div>
            </div>
          </motion.div>

          {/* Game Duration and Progress */}
          <motion.div
            className="w-full max-w-2xl"
            variants={fadeUp}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
          >
            <div className="manor-card text-center">
              <h3 className="font-manor text-[clamp(1rem,2.5vw,1.25rem)] uppercase tracking-[0.2em] text-manor-candle mb-4">
                Session Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[clamp(0.75rem,1.5vw,0.875rem)]">
                <div>
                  <span className="text-manor-candle font-semibold">Game State:</span>
                  <div className={`mt-1 font-bold ${activeState.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                    {activeState.isActive ? '🎭 Active' : '⏳ Lobby'}
                  </div>
                </div>
                <div>
                  <span className="text-manor-candle font-semibold">Total Players:</span>
                  <div className="mt-1 font-bold text-blue-400">{stats.totalPlayers}</div>
                </div>
                {activeState.isActive && (
                  <>
                    <div>
                      <span className="text-manor-candle font-semibold">Players Remaining:</span>
                      <div className="mt-1 font-bold text-green-400">{stats.alivePlayers}</div>
                    </div>
                    <div>
                      <span className="text-manor-candle font-semibold">Eliminations:</span>
                      <div className="mt-1 font-bold text-red-400">{stats.totalKills}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            variants={fadeUp}
            transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
          >
            <Link href="/game/status">
              <button className="btn-primary px-6 py-2 sm:px-8 sm:py-3 text-[clamp(0.875rem,1.5vw,1rem)]">
                📱 Full Screen Status
              </button>
            </Link>
            <Link href="/game/host">
              <button className="btn-secondary px-6 py-2 sm:px-8 sm:py-3 text-[clamp(0.875rem,1.5vw,1rem)]">
                📺 Host Dashboard
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}