'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSocket } from './useSocket'
import { PlayerStatusGrid } from './PlayerStatusGrid'
import { GameStats } from './GameStats'
import type { SerializedGameState } from '@/app/lib/game/types'

interface GameStatusScreenProps {
  initialGameState: SerializedGameState
}

export default function GameStatusScreen({ initialGameState }: GameStatusScreenProps) {
  const { gameState, isConnected } = useSocket()
  const [currentState, setCurrentState] = useState<SerializedGameState>(initialGameState)

  useEffect(() => {
    if (gameState) {
      setCurrentState(gameState)
    }
  }, [gameState])

  const activeState = currentState

  return (
    <div className="w-screen h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(177,54,30,0.2),_transparent_55%),linear-gradient(140deg,_rgba(9,11,16,0.96)_0%,_rgba(17,22,34,0.92)_55%,_rgba(4,5,9,0.98)_100%)]">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="h-full w-full bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')]" />
      </div>

      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`
            px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
            ${isConnected
              ? 'bg-green-900/50 text-green-400 border border-green-500/30'
              : 'bg-red-900/50 text-red-400 border border-red-500/30'
            }
          `}
        >
          {isConnected ? '🟢 Live' : '🔴 Offline'}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-shrink-0 p-4 text-center border-b border-manor-wine/20"
        >
          <h1 className="font-manor text-3xl md:text-4xl uppercase tracking-[0.3em] text-manor-candle mb-2">
            Manor Status
          </h1>
          <div className="text-sm text-manor-parchment/70 uppercase tracking-wider">
            Game ID: {activeState.id}
          </div>
        </motion.header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Stats Panel */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-shrink-0 w-full lg:w-80 p-4 border-b lg:border-b-0 lg:border-r border-manor-wine/20"
            >
              <GameStats gameState={activeState} />
            </motion.aside>

            {/* Players Grid */}
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-4">
                <div className="mb-4 text-center">
                  <h2 className="font-manor text-xl md:text-2xl uppercase tracking-[0.25em] text-manor-candle">
                    Guest Registry
                  </h2>
                  <div className="text-sm text-manor-parchment/70 mt-1">
                    {activeState.players.length} guests in the manor
                  </div>
                </div>

                <PlayerStatusGrid
                  players={activeState.players}
                  showRoles={activeState.stats.gameEnded}
                />
              </div>
            </motion.main>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex-shrink-0 p-4 border-t border-manor-wine/20 text-center"
        >
          <div className="text-xs text-manor-parchment/50 uppercase tracking-wider">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </motion.footer>
      </div>
    </div>
  )
}